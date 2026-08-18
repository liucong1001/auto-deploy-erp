#!/usr/bin/env node
// ============================================================
// yjcd-deploy-lite.js —— ERP 部署脚本（极简版）
// 用法：node yjcd-deploy-lite.js --app <appKey> --note "备注"
// 环境变量：DEPLOY_USERNAME / DEPLOY_PASSWORD / DEPLOY_BASE_URL
// ============================================================

const http = require('http');
const https = require('https');
const { URL } = require('url');

// ---------------- 配置 ----------------
const BASE_URL = (process.env.DEPLOY_BASE_URL || 'https://avatar-beta.yjzf.com').replace(/\/+$/, '');
const USERNAME = process.env.DEPLOY_USERNAME || 'liucong';
const PASSWORD = process.env.DEPLOY_PASSWORD || '12345678a';
const DEFAULT_APP_KEY = 'ops.web.portal';
const POLL_INTERVAL = 10000;        // 轮询间隔 10 秒
const BUILD_TIMEOUT = 30 * 60 * 1000; // 构建超时 30 分钟
const DEPLOY_TIMEOUT = 30 * 60 * 1000; // 部署超时 30 分钟

// ---------------- 参数解析 ----------------
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    const hasValue = next && !next.startsWith('--');
    if (hasValue) {
      args[name] = next;
      i++;
    } else {
      args[name] = true;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const APP_KEY = args.app || DEFAULT_APP_KEY;
const NOTE = args.note || `auto-deploy ${APP_KEY}`;
const VERSION = args.version || '';

if (!USERNAME || !PASSWORD) {
  console.error('❌ 缺少 DEPLOY_USERNAME 或 DEPLOY_PASSWORD');
  process.exit(1);
}

// ---------------- HTTP 请求 ----------------
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const lib = url.protocol === 'https:' ? https : http;
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    const data = body ? JSON.stringify(body) : null;

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json;charset=UTF-8',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          try {
            const json = text ? JSON.parse(text) : {};
            if (!res.statusCode || res.statusCode >= 400 || json.succeed === false) {
              const err = new Error(json.msg || `HTTP ${res.statusCode}`);
              err.code = 'API_ERROR';
              err.payload = json;
              reject(err);
            } else {
              resolve(json);
            }
          } catch (e) {
            const err = new Error(`解析响应失败: ${text}`);
            err.code = 'PARSE_ERROR';
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------- 工具函数 ----------------
function log(msg) {
  console.log(`[${new Date().toLocaleString()}] ${msg}`);
}

// ---------------- Step 1: 触发构建 ----------------
async function triggerBuild() {
  log('Step 1: 触发构建');
  const res = await request('POST', '/api/uplus/build', {
    builder: USERNAME,
    app_key: APP_KEY,
    tag: 'beta',
    commit: '',
    note: NOTE,
    version: VERSION,
  });
  const buildNumber = res.data && res.data.build_number;
  if (!buildNumber) throw new Error('未返回 build_number');
  log(`  构建已触发，buildNumber=${buildNumber}`);
  return buildNumber;
}

// ---------------- Step 2: 轮询构建状态 ----------------
async function pollBuild(buildNumber) {
  log('Step 2: 轮询构建状态');
  const start = Date.now();
  while (Date.now() - start < BUILD_TIMEOUT) {
    const res = await request('GET', `/api/uplus/build/log/${APP_KEY}/${buildNumber}`);
    const build = res.data || {};
    log(`  status=${build.status}, progress=${build.progress}%`);
    if (build.status === 'SUCCESS') return;
    if (build.status === 'FAILURE') {
      const err = new Error('构建失败');
      err.code = 'BUILD_FAILED';
      err.log = build.log;
      throw err;
    }
    await sleep(POLL_INTERVAL);
  }
  throw new Error('构建轮询超时');
}

// ---------------- Step 3: 获取部署标签 ----------------
async function fetchDeployTags() {
  log('Step 3: 获取部署标签');
  const res = await request('GET', `/api/uplus/deploy/tag/${APP_KEY}`);
  const tags = Array.isArray(res.data) ? res.data : [];
  if (tags.length < 2) throw new Error('部署标签不足');
  log(`  deployTag=${tags[0]}, rollbackTag=${tags[1]}`);
  return { deployTag: tags[0], rollbackTag: tags[1] };
}

// ---------------- Step 4.5: 检查历史部署 ----------------
async function checkHistoryDeploy() {
  log('Step 4.5: 检查历史部署');
  const res = await request('GET', `/api/uplus/deploy/${APP_KEY}`);
  const list = (res.data && res.data.list) || [];
  const undone = list.find((d) => d.status !== 'FINISHED' && d.status !== 'CANCELLED');
  if (undone) {
    log(`  发现未完成部署 deployId=${undone.deploy_id}, status=${undone.status}，等待完成...`);
    await waitDeployFinished(undone.deploy_id);
  } else {
    log('  无历史未完成部署');
  }
}

async function waitDeployFinished(deployId) {
  const start = Date.now();
  while (Date.now() - start < DEPLOY_TIMEOUT) {
    await request('GET', `/api/uplus/deploy/gray/refresh/${deployId}`);
    const res = await request('GET', `/api/uplus/deploy/gray/${deployId}`);
    const status = res.data && res.data.deploy && res.data.deploy.status;
    log(`  历史部署 status=${status}`);
    if (status === 'FINISHED') return;
    if (status === 'FAILED' || status === 'CANCELLED') throw new Error(`历史部署失败: ${status}`);
    await sleep(POLL_INTERVAL);
  }
  throw new Error('等待历史部署超时');
}

// ---------------- Step 5: 创建部署单 ----------------
async function createDeploy(tags) {
  log('Step 5: 创建部署单');
  const res = await request('POST', '/api/uplus/deploy', {
    creator: USERNAME,
    app_key: APP_KEY,
    deploy_tag: tags.deployTag,
    rollback_tag: tags.rollbackTag,
  });
  const deployId = res.data && res.data.deploy_id;
  if (!deployId) throw new Error('未返回 deploy_id');
  log(`  部署单创建成功，deployId=${deployId}`);
  return String(deployId);
}

// ---------------- Step 6: 配置灰度分组 ----------------
async function configGrayGroup(deployId) {
  log('Step 6: 配置灰度分组');
  await request('POST', '/api/uplus/deploy/gray/group', {
    deploy_id: deployId,
    deploy_tag: '',
    creator: '',
  });
  log('  灰度分组配置完成');
}

// ---------------- Step 7: 灰度规则审批 ----------------
async function approveGrayRules(deployId) {
  log('Step 7: 灰度规则审批');
  const steps = ['rd_apply', 'rd_finish', 'qa_apply', 'qa_finish'];
  for (const op of steps) {
    await request('POST', '/api/uplus/deploy/gray/rule', {
      deploy_id: deployId,
      op_type: op,
      payload: '',
    });
    log(`  ${op} 完成`);
  }
}

// ---------------- Step 8: 执行部署 ----------------
async function executeDeploy(deployId) {
  log('Step 8: 执行部署');
  const res = await request('GET', `/api/uplus/deploy/gray/${deployId}`);
  let groupInfo = [];
  try {
    const raw = res.data && res.data.deploy && res.data.deploy.groupInfo;
    groupInfo = typeof raw === 'string' ? JSON.parse(raw) : raw || [];
  } catch (_) {}

  if (!groupInfo.length) throw new Error('未获取到分组信息');
  log(`  分组数量: ${groupInfo.length}`);

  for (const group of groupInfo) {
    if (group.action === 'DONE') {
      log(`  分组 id=${group.id} 已完成，跳过`);
      continue;
    }
    log(`  执行分组 id=${group.id}...`);
    await request('POST', '/api/uplus/deploy/gray/group/execute', {
      deploy_id: deployId,
      group_id: group.id,
    });
    await waitGroupDone(deployId, group.id);
    log(`  分组 id=${group.id} 部署完成`);
  }
}

async function waitGroupDone(deployId, groupId) {
  const max = 60;
  for (let i = 0; i < max; i++) {
    await request('GET', `/api/uplus/deploy/gray/refresh/${deployId}`);
    const res = await request('GET', `/api/uplus/deploy/gray/${deployId}`);
    let groupInfo = [];
    try {
      const raw = res.data && res.data.deploy && res.data.deploy.groupInfo;
      groupInfo = typeof raw === 'string' ? JSON.parse(raw) : raw || [];
    } catch (_) {}
    const target = groupInfo.find((g) => g.id === groupId);
    if (target && target.action === 'DONE') return;
    if (groupInfo.length && groupInfo.every((g) => g.action === 'DONE')) return;
    log(`  分组 id=${groupId} 部署中，${i + 1}/${max} 轮...`);
    await sleep(POLL_INTERVAL);
  }
  throw new Error('分组部署超时');
}

// ---------------- Step 9: 检查整体部署状态 ----------------
async function pollDeployStatus(deployId) {
  log('Step 9: 检查整体部署状态');
  const max = 60;
  for (let i = 0; i < max; i++) {
    await request('GET', `/api/uplus/deploy/gray/refresh/${deployId}`);
    const res = await request('GET', `/api/uplus/deploy/gray/${deployId}`);
    const deploy = (res.data && res.data.deploy) || {};
    const status = deploy.status;
    let groupInfo = [];
    try {
      groupInfo = typeof deploy.groupInfo === 'string' ? JSON.parse(deploy.groupInfo) : deploy.groupInfo || [];
    } catch (_) {}
    const doneCount = groupInfo.filter((g) => g.action === 'DONE').length;
    log(`  status=${status}, 分组进度=${doneCount}/${groupInfo.length}`);
    if (status === 'FINISHED') return;
    if (status === 'FAILED' || status === 'CANCELLED') throw new Error(`部署失败: ${status}`);
    await sleep(POLL_INTERVAL);
  }
  throw new Error('部署状态轮询超时');
}

// ---------------- Step 10: 标记部署完成 ----------------
async function markDone(deployId) {
  log('Step 10: 标记部署完成');
  await request('GET', `/api/uplus/deploy/group/done/${deployId}`);
  await request('GET', `/api/uplus/deploy/gray/done/${deployId}`);
  log(`  部署完成，deployId=${deployId}`);
}

// ---------------- 主流程 ----------------
async function main() {
  log(`开始部署: ${APP_KEY}`);
  log(`备注: ${NOTE}`);
  try {
    const buildNumber = await triggerBuild();
    await pollBuild(buildNumber);
    const tags = await fetchDeployTags();
    await checkHistoryDeploy();
    const deployId = await createDeploy(tags);
    await configGrayGroup(deployId);
    await approveGrayRules(deployId);
    await executeDeploy(deployId);
    await pollDeployStatus(deployId);
    await markDone(deployId);
    log('✅ 全部完成');
    process.exit(0);
  } catch (err) {
    log(`❌ 失败: ${err.message}`);
    if (err.log) console.error(err.log);
    process.exit(1);
  }
}

main();
