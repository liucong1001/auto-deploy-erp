#!/usr/bin/env node
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// deploy.config.js
var require_deploy_config = __commonJS({
  "deploy.config.js"(exports2, module2) {
    module2.exports = {
      // ========================================
      // 平台连接配置（可能需要改 baseUrl）
      // ========================================
      platform: {
        baseUrl: "https://avatar-beta.yjzf.com",
        // 可通过 DEPLOY_BASE_URL 环境变量覆盖
        defaultAppKey: "",
        // 默认 appKey，建议 CLI 传 --app 覆盖
        pollInterval: 1e4,
        // 轮询间隔（毫秒），一般不用改
        buildTimeout: 30 * 60 * 1e3,
        // 构建超时 30 分钟
        deployTimeout: 30 * 60 * 1e3,
        // 部署超时 30 分钟
        historyDeployTimeout: 30 * 60 * 1e3
        // 历史部署超时 30 分钟
      },
      // ========================================
      // 认证配置（建议留空，走环境变量）
      // ========================================
      auth: {
        username: "",
        // 建议留空，通过 DEPLOY_USERNAME 环境变量注入
        password: ""
        // 建议留空，通过 DEPLOY_PASSWORD 环境变量注入
      },
      // ========================================
      // 运行时策略（一般不用改）
      // ========================================
      runtime: {
        historyMode: "manual",
        // 历史构建处理方式
        buildFailAction: "exit",
        // 构建失败处理方式
        dryRun: true,
        // 默认 dry-run（安全）
        debug: false,
        // 调试日志开关
        checkOnly: false,
        // 仅检查模式
        quick: false,
        // 快速模式（仅 dry-run）
        yes: false,
        // 非交互模式
        stopAfter: ""
        // 提前停止（仅测试用）
      },
      // ========================================
      // 构建配置（一般不用改）
      // ========================================
      build: {
        branchTag: "beta",
        // 构建分支标签
        defaultNotePrefix: "auto-deploy"
        // 构建备注前缀
      }
    };
  }
});

// src/config.js
var require_config = __commonJS({
  "src/config.js"(exports2, module2) {
    function parseArgs2(argv) {
      const result = {};
      for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (!token.startsWith("--")) {
          continue;
        }
        const key = token.slice(2);
        const next = argv[index + 1];
        const hasValue = next && !next.startsWith("--");
        switch (key) {
          case "app":
          case "version":
          case "history-mode":
          case "build-fail-action":
          case "stop-after":
          case "note":
            result[toCamelCase(key)] = hasValue ? next : "";
            if (hasValue) {
              index += 1;
            }
            break;
          case "need-package":
          case "dry-run":
          case "debug":
          case "check-only":
          case "quick":
          case "yes":
          case "allow-live":
            result[toCamelCase(key)] = true;
            break;
          case "help":
            result.help = true;
            break;
          default:
            result.unknown = result.unknown || [];
            result.unknown.push(token);
            if (hasValue) {
              index += 1;
            }
            break;
        }
      }
      return result;
    }
    function toCamelCase(value) {
      return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    }
    module2.exports = {
      parseArgs: parseArgs2
    };
  }
});

// src/context.js
var require_context = __commonJS({
  "src/context.js"(exports2, module2) {
    function createContext2(options) {
      return {
        appKey: options.appKey,
        username: options.username,
        password: options.password,
        version: options.version || "",
        needPackage: Boolean(options.needPackage),
        buildNumber: null,
        deployTag: null,
        rollbackTag: null,
        instanceCount: null,
        deployId: null,
        latestBuild: null,
        dryRun: options.dryRun,
        allowLive: options.allowLive,
        pollInterval: options.pollInterval,
        buildTimeout: options.buildTimeout,
        deployTimeout: options.deployTimeout,
        historyDeployTimeout: options.historyDeployTimeout,
        historyMode: options.historyMode,
        buildFailAction: options.buildFailAction,
        debug: options.debug,
        checkOnly: options.checkOnly,
        quick: options.quick,
        yes: options.yes,
        stopAfter: options.stopAfter || "",
        buildNote: options.buildNote || "",
        branchTag: options.branchTag || "beta"
      };
    }
    module2.exports = {
      createContext: createContext2
    };
  }
});

// src/utils/errors.js
var require_errors = __commonJS({
  "src/utils/errors.js"(exports2, module2) {
    var DeployError2 = class extends Error {
      constructor(message, code, details) {
        super(message);
        this.name = "DeployError";
        this.code = code || "DEPLOY_ERROR";
        this.details = details || null;
      }
    };
    module2.exports = {
      DeployError: DeployError2
    };
  }
});

// src/utils/logger.js
var require_logger = __commonJS({
  "src/utils/logger.js"(exports2, module2) {
    var COLORS = {
      reset: "\x1B[0m",
      bright: "\x1B[1m",
      dim: "\x1B[2m",
      red: "\x1B[31m",
      green: "\x1B[32m",
      yellow: "\x1B[33m",
      blue: "\x1B[34m",
      magenta: "\x1B[35m",
      cyan: "\x1B[36m",
      white: "\x1B[37m"
    };
    var LEVEL_COLORS = {
      INFO: COLORS.green,
      WARN: COLORS.yellow,
      ERROR: COLORS.red,
      DEBUG: COLORS.dim,
      STEP: COLORS.cyan + COLORS.bright
    };
    var KEY_COLORS = {
      appKey: COLORS.yellow,
      buildNumber: COLORS.magenta + COLORS.bright,
      deployTag: COLORS.green + COLORS.bright,
      rollbackTag: COLORS.blue,
      status: COLORS.yellow,
      dryRun: COLORS.cyan,
      allowLive: COLORS.green,
      version: COLORS.magenta
    };
    function timestamp() {
      return (/* @__PURE__ */ new Date()).toISOString();
    }
    function log(level, message, meta) {
      const levelColor = LEVEL_COLORS[level] || COLORS.white;
      const timeStr = `${COLORS.dim}[${timestamp()}]${COLORS.reset}`;
      const levelStr = `${levelColor}[${level}]${COLORS.reset}`;
      console.log(`${timeStr} ${levelStr} ${message}`);
      if (meta && Object.keys(meta).length > 0) {
        for (const [key, value] of Object.entries(meta)) {
          const display = value !== null && typeof value === "object" ? JSON.stringify(value, null, 2) : value;
          const keyColor = KEY_COLORS[key] || COLORS.white;
          console.log(`    ${COLORS.dim}${key}:${COLORS.reset} ${keyColor}${display}${COLORS.reset}`);
        }
      }
    }
    function info(message, meta) {
      log("INFO", message, meta);
    }
    function warn(message, meta) {
      log("WARN", message, meta);
    }
    function error(message, meta) {
      log("ERROR", message, meta);
    }
    function debug(enabled, message, meta) {
      if (!enabled) {
        return;
      }
      log("DEBUG", message, meta);
    }
    function step(name, meta) {
      log("STEP", name, meta);
    }
    module2.exports = {
      info,
      warn,
      error,
      debug,
      step
    };
  }
});

// src/http/avatarClient.js
var require_avatarClient = __commonJS({
  "src/http/avatarClient.js"(exports2, module2) {
    var { DeployError: DeployError2 } = require_errors();
    var logger2 = require_logger();
    function nodeFetch(url, options = {}) {
      return new Promise((resolve, reject) => {
        const lib = url.startsWith("https") ? require("https") : require("http");
        const { method = "GET", headers = {}, body } = options;
        const urlObj = new URL(url);
        const reqOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: urlObj.pathname + urlObj.search,
          method,
          headers
        };
        const req = lib.request(reqOptions, (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            resolve({
              status: res.statusCode,
              ok: res.statusCode >= 200 && res.statusCode < 300,
              text: () => Promise.resolve(text),
              json: () => Promise.resolve(JSON.parse(text))
            });
          });
        });
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
      });
    }
    var _fetch = typeof fetch === "function" ? fetch : nodeFetch;
    function createAvatarClient2(options) {
      const state = {
        // 平台连接配置
        baseUrl: stripTrailingSlash(options.baseUrl),
        // Avatar 平台基础 URL
        username: options.username,
        // Basic Auth 用户名
        password: options.password,
        // Basic Auth 密码
        // 运行模式控制
        dryRun: Boolean(options.dryRun),
        // true: 只输出请求信息，不发送真实 HTTP 请求
        allowLive: Boolean(options.allowLive),
        // true: 允许真实调用（仍需 dryRun=false 才生效）
        debug: Boolean(options.debug),
        // true: 输出调试日志
        quick: Boolean(options.quick),
        // true: dry-run 模式下快速返回 mock 结果，不模拟轮询等待
        // 内部状态计数
        buildLogCalls: 0,
        // 记录 getBuildLog 调用次数，用于 mock 状态机
        // dry-run 模拟数据配置（仅用于测试，不触发真实请求）
        mockPrecheckStatus: String(options.mockPrecheckStatus || "NONE").toUpperCase(),
        // Step 0 模拟状态: NONE|BUILDING|SUCCESS|FAILURE
        mockBuildResult: String(options.mockBuildResult || "SUCCESS").toUpperCase(),
        // Step 2 模拟结果: SUCCESS|FAILURE
        mockDeployTag: options.mockDeployTag || "20260414-091108",
        // 模拟部署标签
        mockRollbackTag: options.mockRollbackTag || "20260413-172202",
        // 模拟回滚标签
        mockBuilder: options.username,
        // 模拟构建者
        mockHistoryList: options.mockHistoryList || "none",
        // Step 4.5 模拟历史列表: none|has_undone|has_done
        mockHistoryStatus: options.mockHistoryStatus || "RULE_QA_TESTED",
        // Step 4.5 自动恢复：存量部署当前阶段（真实枚举）
        mockHistoryAutoComplete: options.mockHistoryAutoComplete !== false
        // Step 4.5 自动恢复：是否快速推进到 FINISHED
      };
      return {
        getBuildList(appKey) {
          return request(state, {
            method: "GET",
            path: `/api/uplus/build/${appKey}`,
            purpose: "Step 0 \u68C0\u67E5\u6784\u5EFA\u72B6\u6001",
            dryRunResponse: createMockBuildList(state)
          });
        },
        triggerBuild(payload) {
          return request(state, {
            method: "POST",
            path: "/api/uplus/build",
            body: payload,
            purpose: "Step 1 \u89E6\u53D1\u6784\u5EFA",
            dryRunResponse: {
              build_number: 520,
              tag: state.mockDeployTag
            }
          });
        },
        getBuildLog(appKey, buildNumber) {
          state.buildLogCalls += 1;
          return request(state, {
            method: "GET",
            path: `/api/uplus/build/log/${appKey}/${buildNumber}`,
            purpose: "Step 2 \u67E5\u8BE2\u6784\u5EFA\u65E5\u5FD7",
            dryRunResponse: createMockBuildLog(state)
          });
        },
        getDeployTags(appKey) {
          return request(state, {
            method: "GET",
            path: `/api/uplus/deploy/tag/${appKey}`,
            purpose: "Step 3 \u83B7\u53D6\u90E8\u7F72\u6807\u7B7E",
            dryRunResponse: [state.mockDeployTag, state.mockRollbackTag, "20260413-171439"]
          });
        },
        getDeployList(appKey) {
          return request(state, {
            method: "GET",
            path: `/api/uplus/deploy/${appKey}`,
            purpose: "Step 4.5 \u68C0\u67E5\u5386\u53F2\u90E8\u7F72\u5217\u8868",
            dryRunResponse: createMockDeployList(state)
          });
        },
        createDeploy(payload) {
          if (state.dryRun || !state.allowLive) {
            const key = "deployStatus_67215";
            currentDeployCallCounts[key] = 0;
          }
          return request(state, {
            method: "POST",
            path: "/api/uplus/deploy",
            body: payload,
            purpose: "Step 5 \u521B\u5EFA\u90E8\u7F72\u5355",
            dryRunResponse: { deploy_id: "67215" }
          });
        },
        getDeployStatus(deployId) {
          const isCurrentDeploy = String(deployId) === "67215";
          const dryRunResponse = isCurrentDeploy ? createMockCurrentDeployStatus(state) : createMockDeployStatus(state);
          return request(state, {
            method: "GET",
            path: `/api/uplus/deploy/gray/${deployId}`,
            purpose: "Step 4.5/Step 8/9 \u68C0\u67E5\u90E8\u7F72\u72B6\u6001",
            dryRunResponse
          });
        },
        refreshDeployStatus(deployId) {
          return request(state, {
            method: "GET",
            path: `/api/uplus/deploy/gray/refresh/${deployId}`,
            purpose: "Step 4.5/Step 9 \u5237\u65B0\u90E8\u7F72\u72B6\u6001",
            dryRunResponse: { succeed: true, data: null, code: "200" }
          });
        },
        configGrayGroup(deployId, payload) {
          return request(state, {
            method: "POST",
            path: "/api/uplus/deploy/gray/group",
            body: payload,
            purpose: "Step 4.5/Step 6 \u914D\u7F6E\u7070\u5EA6\u5206\u7EC4",
            dryRunResponse: { succeed: true, data: null, code: "200" }
          });
        },
        approveGrayRule(deployId, payload) {
          return request(state, {
            method: "POST",
            path: "/api/uplus/deploy/gray/rule",
            body: payload,
            purpose: "Step 4.5/Step 7 \u7070\u5EA6\u89C4\u5219\u5BA1\u6279",
            dryRunResponse: { succeed: true, data: null, code: "200" }
          });
        },
        executeDeploy(deployId, groupId) {
          return request(state, {
            method: "POST",
            path: "/api/uplus/deploy/gray/group/execute",
            body: { deploy_id: deployId, group_id: groupId },
            purpose: "Step 4.5/Step 8 \u6267\u884C\u90E8\u7F72",
            dryRunResponse: { succeed: true, data: null, code: "200" }
          });
        },
        markGroupDone(deployId) {
          return request(state, {
            method: "GET",
            path: `/api/uplus/deploy/group/done/${deployId}`,
            purpose: "Step 4.5/Step 10 \u6807\u8BB0\u5206\u7EC4\u5B8C\u6210",
            dryRunResponse: { succeed: true, data: null, code: "200" }
          });
        },
        markGrayDone(deployId) {
          if (state.dryRun || !state.allowLive) {
            const key = `deployStatus_${deployId}`;
            const isCurrentDeploy = String(deployId) === "67215";
            if (isCurrentDeploy) {
              currentDeployCallCounts[key] = CURRENT_DEPLOY_STAGES.length;
            } else {
              const startIndex = DEPLOY_STATUS_STAGES.indexOf(state.mockHistoryStatus || "RULE_QA_TESTED");
              const safeStart = startIndex >= 0 ? startIndex : 0;
              autoCompleteCallCounts[key] = DEPLOY_STATUS_STAGES.length - safeStart;
            }
          }
          return request(state, {
            method: "GET",
            path: `/api/uplus/deploy/gray/done/${deployId}`,
            purpose: "Step 4.5/Step 10 \u6807\u8BB0\u7070\u5EA6\u5B8C\u6210",
            dryRunResponse: { succeed: true, data: null, code: "200" }
          });
        }
      };
    }
    async function request(state, config) {
      const url = `${state.baseUrl}${config.path}`;
      if (state.dryRun || !state.allowLive) {
        const dryRunResponse = config.dryRunResponse;
        const isBuildLog2 = config.purpose.includes("\u67E5\u8BE2\u6784\u5EFA\u65E5\u5FD7");
        const isBuildList2 = config.purpose.includes("\u68C0\u67E5\u6784\u5EFA\u72B6\u6001");
        console.log(`
>>>> [REQ] [dry-run] ${config.purpose}`);
        console.log(`      ${config.method} ${url}`);
        if (config.body) {
          console.log("      body:", JSON.stringify(config.body, null, 2).replace(/\n/g, "\n      "));
        }
        if ((isBuildLog2 || isBuildList2) && !state.debug) {
          const preview = dryRunResponse.log ? dryRunResponse.log.substring(0, 200) + "..." : "N/A";
          console.log(`<<<< [RES] status: ${dryRunResponse.status}, progress: ${dryRunResponse.progress}%`);
          console.log(`      log preview: ${preview}`);
        } else {
          console.log("<<<< [RES] =====");
          console.log("      ", JSON.stringify(dryRunResponse, null, 2).replace(/\n/g, "\n      "));
        }
        return {
          succeed: true,
          dryRun: true,
          request: {
            method: config.method,
            url,
            purpose: config.purpose,
            body: config.body || null
          },
          data: dryRunResponse
        };
      }
      logger2.info(`[live] ${config.purpose}`, {
        method: config.method,
        url,
        body: config.body || null
      });
      console.log(`
>>>> [REQ] ${config.purpose}`);
      console.log(`      ${config.method} ${url}`);
      const response = await _fetch(url, {
        method: config.method,
        headers: buildHeaders(state),
        body: config.body ? JSON.stringify(config.body) : void 0
      });
      const rawText = await response.text();
      const payload = rawText ? tryParseJson(rawText) : {};
      const isBuildLog = config.purpose.includes("\u67E5\u8BE2\u6784\u5EFA\u65E5\u5FD7");
      const isBuildList = config.purpose.includes("\u68C0\u67E5\u6784\u5EFA\u72B6\u6001");
      const shouldPrintFullLog = !isBuildLog && !isBuildList || payload.status === "FAILURE" || state.debug;
      const MAX_LOG_LENGTH = 1e3;
      const buildData = payload.data || payload;
      const logResponse = shouldPrintFullLog ? payload : {
        buildStatus: buildData.status,
        progress: buildData.progress,
        logPreview: buildData.log ? buildData.log.substring(0, 200) + "..." : void 0
      };
      const responseStr = JSON.stringify(logResponse);
      const truncatedResponse = responseStr.length > MAX_LOG_LENGTH ? responseStr.substring(0, MAX_LOG_LENGTH) + "... [\u622A\u65AD\uFF0C\u5171" + responseStr.length + "\u5B57\u7B26]" : responseStr;
      logger2.info(`[live] ${config.purpose} \u54CD\u5E94`, {
        status: response.status,
        response: truncatedResponse
      });
      if (shouldPrintFullLog) {
        console.log("<<<< [RES] =====");
        console.log("      ", JSON.stringify(payload, null, 2).replace(/\n/g, "\n      "));
      } else {
        const status = buildData.status || "UNKNOWN";
        const progress = buildData.progress !== void 0 ? `${buildData.progress}%` : "N/A";
        console.log(`<<<< [RES] status: ${status}, progress: ${progress}`);
      }
      if (!response.ok) {
        throw new DeployError2(`\u8BF7\u6C42\u5931\u8D25: ${response.status} ${response.statusText}`, "HTTP_ERROR", {
          url,
          status: response.status,
          payload
        });
      }
      if (!payload || payload.succeed === false) {
        throw new DeployError2(payload.msg || "\u63A5\u53E3\u8FD4\u56DE\u5931\u8D25", "API_ERROR", {
          url,
          payload
        });
      }
      return payload;
    }
    function buildHeaders(state) {
      const auth = Buffer.from(`${state.username}:${state.password}`).toString("base64");
      return {
        Authorization: `Basic ${auth}`,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/json"
      };
    }
    function createMockBuildList(state) {
      if (state.mockPrecheckStatus === "NONE") {
        return {
          list: []
        };
      }
      return {
        list: [
          {
            tag: state.mockDeployTag,
            builder: state.mockBuilder,
            status: state.mockPrecheckStatus,
            note: "dry-run mock build",
            build_number: 519,
            start: Date.now() - 60 * 1e3,
            end: Date.now()
          }
        ]
      };
    }
    function createMockBuildLog(state) {
      if (state.quick) {
        return {
          status: state.mockBuildResult,
          progress: state.mockBuildResult === "SUCCESS" ? 100 : 80,
          log: `[dry-run] build quick result: ${state.mockBuildResult}`
        };
      }
      if (state.mockBuildResult === "FAILURE") {
        if (state.buildLogCalls === 1) {
          return {
            status: "BUILDING",
            progress: 33,
            log: "[dry-run] building..."
          };
        }
        return {
          status: "FAILURE",
          progress: 80,
          log: "[dry-run] build failed due to mock scenario"
        };
      }
      if (state.buildLogCalls === 1) {
        return {
          status: "BUILDING",
          progress: 33,
          log: "[dry-run] building..."
        };
      }
      return {
        status: "SUCCESS",
        progress: 100,
        log: "[dry-run] build success"
      };
    }
    function stripTrailingSlash(baseUrl) {
      return String(baseUrl).replace(/\/+$/, "");
    }
    function createMockDeployList(state) {
      if (state.mockHistoryList === "none") {
        return { list: [] };
      }
      if (state.mockHistoryList === "has_done") {
        return {
          list: [
            {
              deploy_id: 67e3,
              deployer: state.mockBuilder,
              note: "dry-run mock",
              status: "FINISHED",
              deploy_tag: state.mockRollbackTag,
              rollback_tag: "20260413-171439",
              app_key: "erp.fund.api",
              start: Date.now() - 3600 * 1e3,
              end: Date.now() - 3e3 * 1e3
            }
          ]
        };
      }
      return {
        list: [
          {
            deploy_id: 67214,
            deployer: state.mockBuilder,
            note: "dry-run mock (undone)",
            status: state.mockHistoryStatus || "RULE_QA_TESTED",
            deploy_tag: "20260414-080000",
            rollback_tag: state.mockRollbackTag,
            app_key: "erp.fund.api",
            start: Date.now() - 600 * 1e3,
            end: -1
          }
        ]
      };
    }
    var DEPLOY_STATUS_STAGES = [
      "CREATED",
      "GRAY_CREATED",
      "RULE_RD_APPLIED",
      "RULE_RD_TESTED",
      "RULE_QA_APPLIED",
      "RULE_QA_TESTED",
      // 审批完成，等待执行部署
      "RULE_QA_TESTED",
      // 执行部署后仍是此状态，但 groupInfo 出现 DOING
      "RULE_QA_TESTED",
      // 部署完成，groupInfo 变为 DONE
      "FINISHED"
    ];
    var autoCompleteCallCounts = {};
    function createMockDeployStatus(state) {
      const deployId = "67214";
      if (!state.mockHistoryAutoComplete) {
        return buildMockDeployStatusPayload(state.mockHistoryStatus || "RULE_QA_TESTED", 0);
      }
      const key = `deployStatus_${deployId}`;
      if (!autoCompleteCallCounts[key]) {
        autoCompleteCallCounts[key] = 0;
      }
      autoCompleteCallCounts[key] += 1;
      const startIndex = DEPLOY_STATUS_STAGES.indexOf(state.mockHistoryStatus || "RULE_QA_TESTED");
      if (startIndex < 0) {
        return buildMockDeployStatusPayload(state.mockHistoryStatus, 0);
      }
      const safeStart = startIndex;
      const currentIndex = Math.min(
        safeStart + autoCompleteCallCounts[key] - 1,
        DEPLOY_STATUS_STAGES.length - 1
      );
      const callCountAtStage = autoCompleteCallCounts[key];
      return buildMockDeployStatusPayload(DEPLOY_STATUS_STAGES[currentIndex], callCountAtStage);
    }
    function buildMockDeployStatusPayload(status, callCount) {
      let groupInfo = "[]";
      if (status === "RULE_QA_TESTED") {
        if (!callCount || callCount <= 1) {
          groupInfo = JSON.stringify([
            { id: 1, action: "TODO", status: "GRAY", deployer: "chebin", ready: 0, size: 1, podInfo: [] }
          ]);
        } else if (callCount === 2) {
          groupInfo = JSON.stringify([
            { id: 1, action: "DOING", status: "YELLOW", deployer: "chebin", ready: 0, size: 1, podInfo: [] }
          ]);
        } else {
          groupInfo = JSON.stringify([
            { id: 1, action: "DONE", status: "GREEN", deployer: "chebin", ready: 1, size: 1, podInfo: [
              { name: "erp-fund-api-mock", ip: "172.20.2.48", host: "192.168.103.98", status: "Running", ready: "True", ts: Date.now() }
            ] }
          ]);
        }
      }
      return {
        deploy: {
          id: 67214,
          appKey: "erp.fund.api",
          deployTag: "20260414-080000",
          rollbackTag: "20260413-172202",
          creator: "chebin",
          status,
          start: "2026-04-14T01:13:41.000+00:00",
          end: status === "FINISHED" ? "2026-04-14T01:15:35.000+00:00" : null,
          groupInfo
        }
      };
    }
    var CURRENT_DEPLOY_STAGES = [
      "RULE_QA_TESTED",
      // 初次查询，groupInfo=TODO
      "RULE_QA_TESTED",
      // 执行部署后轮询，groupInfo=DOING
      "RULE_QA_TESTED",
      // 下一轮，groupInfo=DONE
      "FINISHED"
    ];
    var currentDeployCallCounts = {};
    function createMockCurrentDeployStatus(state) {
      const deployId = "67215";
      const key = `deployStatus_${deployId}`;
      if (!currentDeployCallCounts[key]) {
        currentDeployCallCounts[key] = 0;
      }
      currentDeployCallCounts[key] += 1;
      const currentIndex = Math.min(
        currentDeployCallCounts[key] - 1,
        CURRENT_DEPLOY_STAGES.length - 1
      );
      const status = CURRENT_DEPLOY_STAGES[currentIndex];
      const callCount = currentDeployCallCounts[key];
      let groupInfo = "[]";
      if (status === "RULE_QA_TESTED") {
        if (callCount <= 1) {
          groupInfo = JSON.stringify([
            { id: 1, action: "TODO", status: "GRAY", deployer: "chebin", ready: 0, size: 1, podInfo: [] }
          ]);
        } else if (callCount === 2) {
          groupInfo = JSON.stringify([
            { id: 1, action: "DOING", status: "YELLOW", deployer: "chebin", ready: 0, size: 1, podInfo: [] }
          ]);
        } else {
          groupInfo = JSON.stringify([
            { id: 1, action: "DONE", status: "GREEN", deployer: "chebin", ready: 1, size: 1, podInfo: [
              { name: "erp-fund-api-mock", ip: "172.20.2.48", host: "192.168.103.98", status: "Running", ready: "True", ts: Date.now() }
            ] }
          ]);
        }
      }
      return {
        deploy: {
          id: 67215,
          appKey: "erp.fund.api",
          deployTag: "20260414-091108",
          rollbackTag: "20260413-172202",
          creator: "chebin",
          status,
          start: "2026-04-14T02:00:00.000+00:00",
          end: status === "FINISHED" ? "2026-04-14T02:05:00.000+00:00" : null,
          groupInfo
        }
      };
    }
    function tryParseJson(value) {
      try {
        return JSON.parse(value);
      } catch (error) {
        return {
          rawText: value
        };
      }
    }
    module2.exports = {
      createAvatarClient: createAvatarClient2
    };
  }
});

// src/utils/prompt.js
var require_prompt = __commonJS({
  "src/utils/prompt.js"(exports2, module2) {
    var readline = require("readline");
    async function askChoice(question, choices, defaultChoice, timeoutSeconds) {
      const displayChoices = choices.map((choice) => `${choice.value}:${choice.label}`).join(", ");
      const suffix = timeoutSeconds ? ` ${timeoutSeconds}\u79D2\u540E\u9ED8\u8BA4 ${defaultChoice}` : "";
      return ask(`${question} [${displayChoices}]${suffix}: `, defaultChoice, timeoutSeconds);
    }
    async function confirm(message, defaultValue) {
      const fallback = defaultValue ? "y" : "n";
      const answer = await ask(`${message} [y/N]: `, fallback, 0);
      return String(answer).toLowerCase() === "y";
    }
    async function askInput(message, defaultValue) {
      return ask(`${message}: `, defaultValue || "", 0);
    }
    function ask(promptText, defaultValue, timeoutSeconds) {
      return new Promise((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        let timer = null;
        let settled = false;
        const finish = (value) => {
          if (settled) {
            return;
          }
          settled = true;
          if (timer) {
            clearTimeout(timer);
          }
          rl.close();
          resolve(value === "" ? defaultValue : value);
        };
        if (timeoutSeconds && timeoutSeconds > 0) {
          timer = setTimeout(() => finish(defaultValue), timeoutSeconds * 1e3);
        }
        rl.question(promptText, (answer) => finish(answer.trim()));
      });
    }
    module2.exports = {
      askChoice,
      confirm,
      askInput
    };
  }
});

// src/steps/step0CheckBuild.js
var require_step0CheckBuild = __commonJS({
  "src/steps/step0CheckBuild.js"(exports2, module2) {
    var logger2 = require_logger();
    async function runStep0(context, services) {
      logger2.step("Step 0: \u68C0\u67E5\u6784\u5EFA\u72B6\u6001", {
        appKey: context.appKey,
        dryRun: context.dryRun
      });
      const response = await services.client.getBuildList(context.appKey);
      const list = Array.isArray(response.data && response.data.list) ? response.data.list : [];
      const latestBuild = list[0] || null;
      context.latestBuild = latestBuild;
      if (!latestBuild) {
        logger2.info("\u672A\u68C0\u6D4B\u5230\u5386\u53F2\u6784\u5EFA\uFF0C\u8FDB\u5165\u672C\u6B21\u6784\u5EFA\u6D41\u7A0B");
        return {
          action: "START_BUILD",
          response
        };
      }
      logger2.info("\u83B7\u53D6\u5230\u6700\u65B0\u6784\u5EFA\u72B6\u6001", {
        status: latestBuild.status,
        buildNumber: latestBuild.build_number,
        tag: latestBuild.tag
      });
      switch (latestBuild.status) {
        case "BUILDING":
          return handleBuilding(context, services, latestBuild, response);
        case "SUCCESS":
          return handleSuccess(context, services, latestBuild, response);
        case "FAILURE":
          return handleFailure(context, services, latestBuild, response);
        default:
          logger2.warn("\u9047\u5230\u672A\u8BC6\u522B\u6784\u5EFA\u72B6\u6001\uFF0C\u6309\u5F00\u59CB\u672C\u6B21\u6784\u5EFA\u5904\u7406", {
            status: latestBuild.status
          });
          return {
            action: "START_BUILD",
            response
          };
      }
    }
    async function handleBuilding(context, services, latestBuild, response) {
      console.log(`
\u26A0\uFE0F  \u53D1\u73B0\u5B58\u91CF\u6784\u5EFA\u4E2D\u4EFB\u52A1\uFF08buildNumber=${latestBuild.build_number}, tag=${latestBuild.tag}\uFF09`);
      console.log("   \u4F18\u5148\u5904\u7406\u5B58\u91CF\u6784\u5EFA\u4EFB\u52A1\uFF0C\u8BF7\u9009\u62E9\u540E\u7EED\u64CD\u4F5C\uFF1A");
      const defaultChoice = "2";
      const forcedChoice = process.env.DEPLOY_MOCK_STEP0_CHOICE || null;
      const choice = forcedChoice || (context.yes || context.quick ? defaultChoice : await services.prompt.askChoice(
        "\u68C0\u6D4B\u5230\u5DF2\u6709\u6784\u5EFA\u6B63\u5728\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u9009\u62E9\u64CD\u4F5C",
        [
          { value: "1", label: "\u9000\u51FA" },
          { value: "2", label: "\u7B49\u5F85\u5B58\u91CF\u6784\u5EFA\u5B8C\u6210\uFF0C\u518D\u89E6\u53D1\u672C\u6B21\u6784\u5EFA" }
        ],
        defaultChoice,
        0
      ));
      if (choice === "1") {
        return {
          action: "EXIT",
          reason: "\u7528\u6237\u9009\u62E9\u9000\u51FA\uFF0C\u7A0D\u540E\u624B\u52A8\u8FD0\u884C\u811A\u672C",
          response
        };
      }
      console.log(`   \u2192 \u7B49\u5F85\u5B58\u91CF\u6784\u5EFA\u5B8C\u6210\uFF08buildNumber=${latestBuild.build_number}\uFF09...`);
      context.buildNumber = latestBuild.build_number;
      return {
        action: "WAIT_EXISTING_BUILD",
        response
      };
    }
    async function handleSuccess(context, services, latestBuild, response) {
      const defaultChoice = "1";
      const forcedChoice = process.env.DEPLOY_MOCK_STEP0_CHOICE || null;
      const choice = forcedChoice || (context.yes || context.quick ? defaultChoice : await services.prompt.askChoice(
        "\u68C0\u6D4B\u5230\u9057\u7559\u6784\u5EFA\u6210\u529F\uFF0C\u8BF7\u9009\u62E9\u64CD\u4F5C",
        [
          { value: "1", label: "\u91CD\u65B0\u6784\u5EFA" },
          { value: "2", label: "\u76F4\u63A5\u90E8\u7F72\u73B0\u6709\u7248\u672C" },
          { value: "3", label: "\u9000\u51FA" }
        ],
        defaultChoice,
        3
      ));
      if (choice === "2") {
        context.deployTag = latestBuild.tag;
        return {
          action: "SKIP_TO_DEPLOY",
          reason: "\u7528\u6237\u9009\u62E9\u76F4\u63A5\u90E8\u7F72\u73B0\u6709\u7248\u672C\uFF0C\u540E\u7EED\u9700\u63A5 Step 4-10",
          response
        };
      }
      if (choice === "3") {
        return {
          action: "EXIT",
          reason: "\u7528\u6237\u9009\u62E9\u9000\u51FA",
          response
        };
      }
      return {
        action: "START_BUILD",
        response
      };
    }
    async function handleFailure(context, services, latestBuild, response) {
      const defaultChoice = "3";
      const forcedChoice = process.env.DEPLOY_MOCK_STEP0_CHOICE || null;
      const choice = forcedChoice || (context.yes || context.quick ? defaultChoice : await services.prompt.askChoice(
        "\u68C0\u6D4B\u5230\u9057\u7559\u6784\u5EFA\u5931\u8D25\uFF0C\u8BF7\u9009\u62E9\u64CD\u4F5C",
        [
          { value: "1", label: "\u9000\u51FA" },
          { value: "2", label: "\u67E5\u770B\u65E5\u5FD7" },
          { value: "3", label: "\u5F00\u59CB\u672C\u6B21\u6784\u5EFA" }
        ],
        defaultChoice,
        3
      ));
      if (choice === "1") {
        return {
          action: "EXIT",
          reason: "\u7528\u6237\u9009\u62E9\u9000\u51FA\uFF0C\u5148\u4FEE\u590D\u95EE\u9898",
          response
        };
      }
      if (choice === "2") {
        const logResponse = await services.client.getBuildLog(context.appKey, latestBuild.build_number);
        return {
          action: "SHOW_LOG_THEN_DECIDE",
          response,
          logResponse
        };
      }
      return {
        action: "START_BUILD",
        response
      };
    }
    module2.exports = {
      runStep0
    };
  }
});

// src/steps/step1TriggerBuild.js
var require_step1TriggerBuild = __commonJS({
  "src/steps/step1TriggerBuild.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    async function runStep1(context, services) {
      logger2.step("Step 1: \u89E6\u53D1\u6784\u5EFA", {
        appKey: context.appKey,
        needPackage: context.needPackage,
        dryRun: context.dryRun
      });
      const payload = buildPayload(context);
      const response = await services.client.triggerBuild(payload);
      context.buildNumber = response.data && response.data.build_number;
      if (!context.buildNumber) {
        throw new DeployError2("Step 1 \u672A\u8FD4\u56DE build_number\uFF0C\u65E0\u6CD5\u7EE7\u7EED\u8F6E\u8BE2\u6784\u5EFA\u72B6\u6001", "BUILD_NUMBER_MISSING", {
          response
        });
      }
      logger2.info("\u6784\u5EFA\u5DF2\u89E6\u53D1", {
        buildNumber: context.buildNumber,
        tag: response.data && response.data.tag
      });
      return {
        payload,
        response
      };
    }
    function buildPayload(context) {
      return {
        builder: context.username,
        app_key: context.appKey,
        tag: context.branchTag,
        commit: "",
        note: context.buildNote || `auto-deploy ${context.appKey}`,
        version: context.needPackage ? context.version : ""
      };
    }
    module2.exports = {
      runStep1
    };
  }
});

// src/utils/sleep.js
var require_sleep = __commonJS({
  "src/utils/sleep.js"(exports2, module2) {
    function sleep(milliseconds) {
      return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
      });
    }
    module2.exports = {
      sleep
    };
  }
});

// src/steps/step2PollBuild.js
var require_step2PollBuild = __commonJS({
  "src/steps/step2PollBuild.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    var { sleep } = require_sleep();
    async function runStep2(context, services) {
      const label = context.isExistingBuild ? "Step 2: \u7B49\u5F85\u5B58\u91CF\u6784\u5EFA\u5B8C\u6210" : "Step 2: \u8F6E\u8BE2\u6784\u5EFA\u72B6\u6001";
      logger2.step(label, {
        appKey: context.appKey,
        buildNumber: context.buildNumber,
        dryRun: context.dryRun
      });
      const startTime = Date.now();
      while (Date.now() - startTime < context.buildTimeout) {
        const response = await services.client.getBuildLog(context.appKey, context.buildNumber);
        const build = response.data || {};
        logger2.info("\u6784\u5EFA\u72B6\u6001\u66F4\u65B0", {
          status: build.status,
          progress: build.progress
        });
        if (build.status === "SUCCESS") {
          return {
            response,
            build
          };
        }
        if (build.status === "FAILURE") {
          throw new DeployError2("\u6784\u5EFA\u5931\u8D25", "BUILD_FAILED", {
            log: build.log,
            response
          });
        }
        if (build.status !== "BUILDING") {
          throw new DeployError2(`\u672A\u77E5\u6784\u5EFA\u72B6\u6001: ${build.status || "EMPTY"}`, "BUILD_STATUS_UNKNOWN", {
            response
          });
        }
        if (context.quick) {
          continue;
        }
        await sleep(context.pollInterval);
      }
      throw new DeployError2("\u6784\u5EFA\u8F6E\u8BE2\u8D85\u65F6", "BUILD_TIMEOUT", {
        buildNumber: context.buildNumber,
        buildTimeout: context.buildTimeout
      });
    }
    module2.exports = {
      runStep2
    };
  }
});

// src/steps/step3FetchTags.js
var require_step3FetchTags = __commonJS({
  "src/steps/step3FetchTags.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    async function runStep3(context, services) {
      logger2.step("Step 3: \u83B7\u53D6\u90E8\u7F72\u6807\u7B7E", {
        appKey: context.appKey,
        dryRun: context.dryRun
      });
      const response = await services.client.getDeployTags(context.appKey);
      const tags = Array.isArray(response.data) ? response.data : [];
      if (tags.length < 2) {
        throw new DeployError2("\u90E8\u7F72\u6807\u7B7E\u6570\u91CF\u4E0D\u8DB3\uFF0C\u81F3\u5C11\u9700\u8981 deployTag \u548C rollbackTag", "DEPLOY_TAGS_INSUFFICIENT", {
          response
        });
      }
      context.deployTag = tags[0];
      context.rollbackTag = tags[1];
      logger2.info("\u83B7\u53D6\u90E8\u7F72\u6807\u7B7E\u6210\u529F", {
        deployTag: context.deployTag,
        rollbackTag: context.rollbackTag
      });
      return {
        response,
        tags
      };
    }
    module2.exports = {
      runStep3
    };
  }
});

// src/steps/step45CheckHistoryDeploy.js
var require_step45CheckHistoryDeploy = __commonJS({
  "src/steps/step45CheckHistoryDeploy.js"(exports2, module2) {
    var readline = require("readline");
    async function runStep45(context, services) {
      var _a;
      console.log("\n===== Step 4.5: \u68C0\u67E5\u5386\u53F2\u90E8\u7F72\u4EFB\u52A1 =====");
      const listRes = await services.client.getDeployList(context.appKey);
      const deployList = ((_a = listRes.data) == null ? void 0 : _a.list) || [];
      if (deployList.length === 0) {
        console.log("\u2705 \u65E0\u5386\u53F2\u90E8\u7F72\u8BB0\u5F55\uFF0C\u76F4\u63A5\u8FDB\u5165\u672C\u6B21\u90E8\u7F72\u6D41\u7A0B");
        return;
      }
      const latest = deployList[0];
      const displayId = latest.deploy_id;
      const displayTag = latest.deploy_tag;
      const displayStatus = latest.status;
      console.log(`  \u6700\u65B0\u90E8\u7F72: deployId=${displayId}, tag=${displayTag}, status=${displayStatus}`);
      if (displayStatus === "FINISHED") {
        console.log("\u2705 \u6700\u65B0\u5386\u53F2\u90E8\u7F72\u5DF2\u5B8C\u6210\uFF08FINISHED\uFF09\uFF0C\u76F4\u63A5\u8FDB\u5165\u672C\u6B21\u90E8\u7F72\u6D41\u7A0B");
        return;
      }
      console.log(`
\u26A0\uFE0F  \u68C0\u6D4B\u5230\u5B58\u91CF\u672A\u5B8C\u6210\u90E8\u7F72 [${displayId}]\uFF08status: ${displayStatus}\uFF09`);
      console.log("   1. \u9000\u51FA\u811A\u672C\uFF0C\u4EBA\u5DE5\u767B\u5F55\u5E73\u53F0\u5904\u7406\u540E\u91CD\u65B0\u8FD0\u884C");
      console.log("   2. \u81EA\u52A8\u6062\u590D\uFF0C\u5E2E\u4F60\u5B8C\u6210\u5B58\u91CF\u90E8\u7F72\u540E\u7EE7\u7EED\u672C\u6B21\u6D41\u7A0B");
      const choice = await askHistoryChoice("\u8BF7\u9009\u62E9\u5904\u7406\u65B9\u5F0F [1/2]\uFF085\u79D2\u540E\u9ED8\u8BA4 2\uFF09: ", "2", 5);
      if (choice.trim() === "1") {
        console.log("\n\u23F9  \u5DF2\u9000\u51FA\u3002\u8BF7\u767B\u5F55 https://avatar-beta.yjzf.com \u624B\u52A8\u5B8C\u6210\u5386\u53F2\u90E8\u7F72\u540E\u91CD\u65B0\u8FD0\u884C\u811A\u672C\u3002");
        process.exit(0);
      }
      await autoRecoverHistoryDeploy(String(displayId), context, services);
      console.log("\n\u2705 \u5B58\u91CF\u90E8\u7F72\u5904\u7406\u5B8C\u6210\uFF0C\u7EE7\u7EED\u672C\u6B21\u90E8\u7F72\u6D41\u7A0B");
    }
    async function autoRecoverHistoryDeploy(deployId, context, services) {
      var _a;
      console.log(`
\u2699\uFE0F  \u5F00\u59CB\u81EA\u52A8\u6062\u590D\u5B58\u91CF\u90E8\u7F72 [${deployId}]`);
      const MAX_ITERATIONS = 100;
      let iterations = 0;
      while (iterations < MAX_ITERATIONS) {
        iterations += 1;
        const statusRes = await services.client.getDeployStatus(deployId);
        const deployData = ((_a = statusRes.data) == null ? void 0 : _a.deploy) || statusRes.data || statusRes;
        const status = deployData == null ? void 0 : deployData.status;
        let groupInfo = [];
        try {
          const raw = deployData == null ? void 0 : deployData.groupInfo;
          groupInfo = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
        } catch (_) {
          groupInfo = [];
        }
        console.log(`  [\u7B2C${iterations}\u8F6E] status=${status}, groups=${groupInfo.length}`);
        switch (status) {
          case "CREATED": {
            console.log("  \u2192 \u6267\u884C: \u914D\u7F6E\u7070\u5EA6\u5206\u7EC4...");
            await services.client.configGrayGroup(deployId, {
              deploy_id: deployId,
              deploy_tag: "",
              creator: ""
            });
            await sleep(2e3);
            break;
          }
          case "GRAY_CREATED": {
            console.log("  \u2192 \u6267\u884C: RD \u7533\u8BF7\u7070\u5EA6\u89C4\u5219\u5BA1\u6279 (rd_apply)...");
            await services.client.approveGrayRule(deployId, {
              deploy_id: deployId,
              op_type: "rd_apply",
              payload: ""
            });
            await sleep(2e3);
            break;
          }
          case "RULE_RD_APPLIED": {
            console.log("  \u2192 \u6267\u884C: RD \u5B8C\u6210\u7070\u5EA6\u89C4\u5219\u5BA1\u6279 (rd_finish)...");
            await services.client.approveGrayRule(deployId, {
              deploy_id: deployId,
              op_type: "rd_finish",
              payload: ""
            });
            await sleep(2e3);
            break;
          }
          case "RULE_RD_TESTED": {
            console.log("  \u2192 \u6267\u884C: QA \u7533\u8BF7\u7070\u5EA6\u89C4\u5219\u5BA1\u6279 (qa_apply)...");
            await services.client.approveGrayRule(deployId, {
              deploy_id: deployId,
              op_type: "qa_apply",
              payload: ""
            });
            await sleep(2e3);
            break;
          }
          case "RULE_QA_APPLIED": {
            console.log("  \u2192 \u6267\u884C: QA \u5B8C\u6210\u7070\u5EA6\u89C4\u5219\u5BA1\u6279 (qa_finish)...");
            await services.client.approveGrayRule(deployId, {
              deploy_id: deployId,
              op_type: "qa_finish",
              payload: ""
            });
            await sleep(2e3);
            break;
          }
          case "RULE_QA_TESTED": {
            if (groupInfo.length === 0) {
              console.log("  \u23F3 \u7B49\u5F85\u5206\u7EC4\u4FE1\u606F\u5C31\u7EEA...");
              await sleep(5e3);
              break;
            }
            const allDone = groupInfo.every((g) => g.action === "DONE");
            if (allDone) {
              console.log("  \u2192 \u6267\u884C: \u6807\u8BB0\u5206\u7EC4\u5B8C\u6210...");
              await services.client.markGroupDone(deployId);
              console.log("  \u2192 \u6267\u884C: \u6807\u8BB0\u7070\u5EA6\u5B8C\u6210...");
              await services.client.markGrayDone(deployId);
              await sleep(2e3);
              break;
            }
            const todoGroups = groupInfo.filter((g) => g.action === "TODO");
            if (todoGroups.length > 0) {
              const group = todoGroups[0];
              console.log(`  \u2192 \u6267\u884C: \u90E8\u7F72\u5206\u7EC4 id=${group.id} (${todoGroups.length} \u4E2A\u5F85\u6267\u884C\uFF0C\u9010\u4E2A\u5904\u7406)...`);
              await services.client.executeDeploy(deployId, group.id);
              await sleep(2e3);
              break;
            }
            const doingGroups = groupInfo.filter((g) => g.action === "DOING");
            if (doingGroups.length > 0) {
              const readyCount = doingGroups.reduce((sum, g) => sum + (g.ready || 0), 0);
              const totalCount = doingGroups.reduce((sum, g) => sum + (g.size || 0), 0);
              console.log(`  \u23F3 \u90E8\u7F72\u4E2D\uFF08${readyCount}/${totalCount} \u5C31\u7EEA\uFF09\uFF0C10\u79D2\u540E\u91CD\u65B0\u68C0\u67E5...`);
              await services.client.refreshDeployStatus(deployId);
              await sleep(1e4);
              break;
            }
            console.log("  \u23F3 \u7B49\u5F85\u5206\u7EC4\u72B6\u6001\u66F4\u65B0...");
            await sleep(5e3);
            break;
          }
          case "FINISHED": {
            console.log(`  \u2705 \u5B58\u91CF\u90E8\u7F72 [${deployId}] \u5DF2\u5B8C\u6210\uFF08FINISHED\uFF09`);
            return;
          }
          case "CANCELLED":
          case "FAILED": {
            throw new Error(
              `\u5B58\u91CF\u90E8\u7F72\u5931\u8D25/\u5DF2\u53D6\u6D88\uFF08status: ${status}\uFF0CdeployId: ${deployId}\uFF09\uFF0C\u8BF7\u767B\u5F55\u5E73\u53F0\u624B\u52A8\u5904\u7406\u540E\u91CD\u65B0\u8FD0\u884C`
            );
          }
          default: {
            throw new Error(
              `\u5B58\u91CF\u90E8\u7F72\u72B6\u6001\u672A\u77E5\uFF08status: ${status}\uFF0CdeployId: ${deployId}\uFF09\uFF0C\u8BF7\u624B\u52A8\u5904\u7406`
            );
          }
        }
      }
      throw new Error(`\u5B58\u91CF\u90E8\u7F72\u81EA\u52A8\u6062\u590D\u8D85\u8FC7\u6700\u5927\u8F6E\u6B21\uFF08${MAX_ITERATIONS}\uFF09\uFF0C\u8BF7\u624B\u52A8\u5904\u7406`);
    }
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function askHistoryChoice(prompt2, defaultChoice, timeoutSeconds) {
      if (process.env.DEPLOY_DRY_RUN === "true" || process.env.DRY_RUN === "true") {
        const autoChoice = process.env.DEPLOY_MOCK_HISTORY_CHOICE || defaultChoice;
        console.log(`${prompt2}${autoChoice} (dry-run auto)`);
        return Promise.resolve(autoChoice);
      }
      if (!process.stdin.isTTY) {
        console.log(`${prompt2}${defaultChoice} (\u975E\u4EA4\u4E92\u6A21\u5F0F\uFF0C\u81EA\u52A8\u9009\u62E9)`);
        return Promise.resolve(defaultChoice);
      }
      return new Promise((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        let settled = false;
        let timer = null;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          rl.close();
          resolve(value === "" ? defaultChoice : value);
        };
        if (timeoutSeconds > 0) {
          timer = setTimeout(() => {
            process.stdout.write(`
\uFF08\u8D85\u65F6\uFF0C\u81EA\u52A8\u9009\u62E9 ${defaultChoice}\uFF09
`);
            finish(defaultChoice);
          }, timeoutSeconds * 1e3);
        }
        rl.question(prompt2, (answer) => finish(answer.trim()));
      });
    }
    module2.exports = {
      runStep45
    };
  }
});

// src/steps/step5CreateDeploy.js
var require_step5CreateDeploy = __commonJS({
  "src/steps/step5CreateDeploy.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    async function runStep5(context, services) {
      var _a;
      console.log("\n===== Step 5: \u521B\u5EFA\u90E8\u7F72\u5355 =====");
      logger2.step("Step 5: \u521B\u5EFA\u90E8\u7F72\u5355", {
        appKey: context.appKey,
        deployTag: context.deployTag,
        rollbackTag: context.rollbackTag,
        dryRun: context.dryRun
      });
      if (!context.deployTag || !context.rollbackTag) {
        throw new DeployError2(
          "\u7F3A\u5C11 deployTag \u6216 rollbackTag\uFF0C\u8BF7\u786E\u8BA4 Step 3 \u5DF2\u6210\u529F\u6267\u884C",
          "MISSING_DEPLOY_TAG",
          { deployTag: context.deployTag, rollbackTag: context.rollbackTag }
        );
      }
      const payload = {
        creator: context.username,
        app_key: context.appKey,
        deploy_tag: context.deployTag,
        rollback_tag: context.rollbackTag
      };
      const response = await services.client.createDeploy(payload);
      const deployId = (_a = response.data) == null ? void 0 : _a.deploy_id;
      if (!deployId) {
        throw new DeployError2("\u521B\u5EFA\u90E8\u7F72\u5355\u5931\u8D25\uFF1A\u54CD\u5E94\u4E2D\u672A\u8FD4\u56DE deploy_id", "CREATE_DEPLOY_FAILED", {
          response
        });
      }
      context.deployId = String(deployId);
      logger2.info("\u521B\u5EFA\u90E8\u7F72\u5355\u6210\u529F", {
        deployId: context.deployId,
        deployTag: context.deployTag,
        rollbackTag: context.rollbackTag
      });
      console.log(`  \u2705 \u90E8\u7F72\u5355\u521B\u5EFA\u6210\u529F\uFF0CdeployId=${context.deployId}`);
      return { deployId: context.deployId };
    }
    module2.exports = {
      runStep5
    };
  }
});

// src/steps/step6SetupGrayGroup.js
var require_step6SetupGrayGroup = __commonJS({
  "src/steps/step6SetupGrayGroup.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    async function runStep6(context, services) {
      console.log("\n===== Step 6: \u914D\u7F6E\u7070\u5EA6\u5206\u7EC4 =====");
      logger2.step("Step 6: \u914D\u7F6E\u7070\u5EA6\u5206\u7EC4", {
        deployId: context.deployId,
        dryRun: context.dryRun
      });
      if (!context.deployId) {
        throw new DeployError2(
          "\u7F3A\u5C11 deployId\uFF0C\u8BF7\u786E\u8BA4 Step 5 \u5DF2\u6210\u529F\u6267\u884C",
          "MISSING_DEPLOY_ID"
        );
      }
      const payload = {
        deploy_id: context.deployId,
        deploy_tag: "",
        // 抓包确认传空字符串
        creator: ""
        // 抓包确认传空字符串
      };
      await services.client.configGrayGroup(context.deployId, payload);
      logger2.info("\u914D\u7F6E\u7070\u5EA6\u5206\u7EC4\u6210\u529F", { deployId: context.deployId });
      console.log("  \u2705 \u7070\u5EA6\u5206\u7EC4\u914D\u7F6E\u5B8C\u6210");
    }
    module2.exports = {
      runStep6
    };
  }
});

// src/steps/step7ApproveGrayRule.js
var require_step7ApproveGrayRule = __commonJS({
  "src/steps/step7ApproveGrayRule.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    async function runStep7(context, services) {
      console.log("\n===== Step 7: \u7070\u5EA6\u89C4\u5219\u5BA1\u6279 =====");
      logger2.step("Step 7: \u7070\u5EA6\u89C4\u5219\u5BA1\u6279", {
        deployId: context.deployId,
        dryRun: context.dryRun
      });
      if (!context.deployId) {
        throw new DeployError2(
          "\u7F3A\u5C11 deployId\uFF0C\u8BF7\u786E\u8BA4 Step 5 \u5DF2\u6210\u529F\u6267\u884C",
          "MISSING_DEPLOY_ID"
        );
      }
      const steps = [
        { op_type: "rd_apply", label: "RD \u7533\u8BF7\u53D1\u5E03 (rd_apply)" },
        { op_type: "rd_finish", label: "RD \u5BA1\u6279\u5B8C\u6210 (rd_finish)" },
        { op_type: "qa_apply", label: "QA \u7533\u8BF7\u53D1\u5E03 (qa_apply)" },
        { op_type: "qa_finish", label: "QA \u5BA1\u6279\u5B8C\u6210 (qa_finish)" }
      ];
      for (const step of steps) {
        console.log(`  \u2192 ${step.label}...`);
        await services.client.approveGrayRule(context.deployId, {
          deploy_id: context.deployId,
          op_type: step.op_type,
          payload: ""
        });
        logger2.info(`\u7070\u5EA6\u89C4\u5219\u5BA1\u6279: ${step.op_type}`, { deployId: context.deployId });
      }
      console.log("  \u2705 \u7070\u5EA6\u89C4\u5219\u5BA1\u6279\u5168\u90E8\u5B8C\u6210\uFF084\u6B65\uFF09");
    }
    module2.exports = {
      runStep7
    };
  }
});

// src/steps/step8ExecuteDeploy.js
var require_step8ExecuteDeploy = __commonJS({
  "src/steps/step8ExecuteDeploy.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    var { sleep } = require_sleep();
    async function runStep8(context, services) {
      var _a;
      console.log("\n===== Step 8: \u6267\u884C\u90E8\u7F72 =====");
      logger2.step("Step 8: \u6267\u884C\u90E8\u7F72", {
        deployId: context.deployId,
        dryRun: context.dryRun
      });
      if (!context.deployId) {
        throw new DeployError2(
          "\u7F3A\u5C11 deployId\uFF0C\u8BF7\u786E\u8BA4 Step 5 \u5DF2\u6210\u529F\u6267\u884C",
          "MISSING_DEPLOY_ID"
        );
      }
      const statusRes = await services.client.getDeployStatus(context.deployId);
      const deployData = ((_a = statusRes.data) == null ? void 0 : _a.deploy) || statusRes.data || statusRes;
      let groupInfo = [];
      try {
        const raw = deployData == null ? void 0 : deployData.groupInfo;
        groupInfo = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
      } catch (_) {
        groupInfo = [];
      }
      if (groupInfo.length === 0) {
        throw new DeployError2(
          "\u672A\u83B7\u53D6\u5230\u5206\u7EC4\u4FE1\u606F\uFF08groupInfo \u4E3A\u7A7A\uFF09\uFF0C\u65E0\u6CD5\u6267\u884C\u90E8\u7F72",
          "NO_GROUP_INFO",
          { deployId: context.deployId, deployData }
        );
      }
      console.log(`  \u5206\u7EC4\u6570\u91CF: ${groupInfo.length}`);
      for (let i = 0; i < groupInfo.length; i++) {
        const group = groupInfo[i];
        const groupId = group.id;
        if (group.action === "DONE") {
          console.log(`  \u23ED  \u5206\u7EC4 id=${groupId} \u5DF2\u5B8C\u6210\uFF0C\u8DF3\u8FC7`);
          continue;
        }
        console.log(`  [${i + 1}/${groupInfo.length}] \u6267\u884C\u90E8\u7F72\u5206\u7EC4 id=${groupId}...`);
        logger2.info(`\u6267\u884C\u90E8\u7F72\u5206\u7EC4`, { deployId: context.deployId, groupId });
        await services.client.executeDeploy(context.deployId, groupId);
        await waitForGroupDone(context.deployId, groupId, services);
        console.log(`  \u2705 \u5206\u7EC4 id=${groupId} \u90E8\u7F72\u5B8C\u6210`);
      }
      console.log("  \u2705 \u6240\u6709\u5206\u7EC4\u90E8\u7F72\u5B8C\u6210");
    }
    async function waitForGroupDone(deployId, groupId, services) {
      var _a, _b, _c;
      const MAX_ITERATIONS = 60;
      let iteration = 0;
      while (iteration < MAX_ITERATIONS) {
        iteration += 1;
        await services.client.refreshDeployStatus(deployId);
        const res = await services.client.getDeployStatus(deployId);
        const deployData = ((_a = res.data) == null ? void 0 : _a.deploy) || res.data || res;
        let groupInfo = [];
        try {
          const raw = deployData == null ? void 0 : deployData.groupInfo;
          groupInfo = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
        } catch (_) {
          groupInfo = [];
        }
        const target = groupInfo.find((g) => g.id === groupId);
        if (!target) {
          const allDone = groupInfo.every((g) => g.action === "DONE");
          if (allDone || groupInfo.length === 0) return;
        } else if (target.action === "DONE") {
          return;
        }
        const ready = (_b = target == null ? void 0 : target.ready) != null ? _b : 0;
        const size = (_c = target == null ? void 0 : target.size) != null ? _c : 0;
        console.log(`  \u23F3 \u5206\u7EC4 id=${groupId} \u90E8\u7F72\u4E2D\uFF08${ready}/${size} \u5C31\u7EEA\uFF09\uFF0C10\u79D2\u540E\u91CD\u65B0\u68C0\u67E5...`);
        await sleep(1e4);
      }
      throw new DeployError2(
        `\u5206\u7EC4 id=${groupId} \u90E8\u7F72\u7B49\u5F85\u8D85\u65F6\uFF08\u8D85\u8FC7 ${MAX_ITERATIONS} \u8F6E\uFF09`,
        "GROUP_DEPLOY_TIMEOUT",
        { deployId, groupId }
      );
    }
    module2.exports = {
      runStep8
    };
  }
});

// src/steps/step9PollDeploy.js
var require_step9PollDeploy = __commonJS({
  "src/steps/step9PollDeploy.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    var { sleep } = require_sleep();
    async function runStep9(context, services) {
      var _a;
      console.log("\n===== Step 9: \u68C0\u67E5\u90E8\u7F72\u72B6\u6001 =====");
      logger2.step("Step 9: \u68C0\u67E5\u90E8\u7F72\u72B6\u6001", {
        deployId: context.deployId,
        dryRun: context.dryRun
      });
      if (!context.deployId) {
        throw new DeployError2(
          "\u7F3A\u5C11 deployId\uFF0C\u8BF7\u786E\u8BA4 Step 5 \u5DF2\u6210\u529F\u6267\u884C",
          "MISSING_DEPLOY_ID"
        );
      }
      const MAX_ITERATIONS = 60;
      let iteration = 0;
      while (iteration < MAX_ITERATIONS) {
        iteration += 1;
        await services.client.refreshDeployStatus(context.deployId);
        const res = await services.client.getDeployStatus(context.deployId);
        const deployData = ((_a = res.data) == null ? void 0 : _a.deploy) || res.data || res;
        const status = deployData == null ? void 0 : deployData.status;
        let groupInfo = [];
        try {
          const raw = deployData == null ? void 0 : deployData.groupInfo;
          groupInfo = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
        } catch (_) {
          groupInfo = [];
        }
        const doneCount = groupInfo.filter((g) => g.action === "DONE").length;
        const totalCount = groupInfo.length;
        console.log(`  [\u7B2C${iteration}\u8F6E] status=${status}, \u5206\u7EC4\u8FDB\u5EA6=${doneCount}/${totalCount}`);
        if (status === "FINISHED") {
          console.log("  \u2705 \u90E8\u7F72\u72B6\u6001\u786E\u8BA4\uFF1AFINISHED");
          logger2.info("\u90E8\u7F72\u72B6\u6001 FINISHED", { deployId: context.deployId });
          return;
        }
        if (groupInfo.length > 0 && doneCount === totalCount) {
          console.log("  \u2705 \u6240\u6709\u5206\u7EC4\u5DF2\u5B8C\u6210\uFF0C\u7B49\u5F85\u72B6\u6001\u6D41\u8F6C\u81F3 FINISHED...");
          return;
        }
        if (status === "CANCELLED" || status === "FAILED") {
          throw new DeployError2(
            `\u90E8\u7F72\u72B6\u6001\u5F02\u5E38\uFF08status: ${status}\uFF09\uFF0C\u8BF7\u767B\u5F55\u5E73\u53F0\u624B\u52A8\u68C0\u67E5`,
            "DEPLOY_FAILED",
            { deployId: context.deployId, status }
          );
        }
        await sleep(1e4);
      }
      throw new DeployError2(
        `\u90E8\u7F72\u72B6\u6001\u8F6E\u8BE2\u8D85\u65F6\uFF08\u8D85\u8FC7 ${MAX_ITERATIONS} \u8F6E\uFF09\uFF0C\u8BF7\u767B\u5F55\u5E73\u53F0\u624B\u52A8\u68C0\u67E5`,
        "DEPLOY_POLL_TIMEOUT",
        { deployId: context.deployId }
      );
    }
    module2.exports = {
      runStep9
    };
  }
});

// src/steps/step10MarkDone.js
var require_step10MarkDone = __commonJS({
  "src/steps/step10MarkDone.js"(exports2, module2) {
    var logger2 = require_logger();
    var { DeployError: DeployError2 } = require_errors();
    async function runStep10(context, services) {
      console.log("\n===== Step 10: \u6807\u8BB0\u90E8\u7F72\u5B8C\u6210 =====");
      logger2.step("Step 10: \u6807\u8BB0\u90E8\u7F72\u5B8C\u6210", {
        deployId: context.deployId,
        dryRun: context.dryRun
      });
      if (!context.deployId) {
        throw new DeployError2(
          "\u7F3A\u5C11 deployId\uFF0C\u8BF7\u786E\u8BA4 Step 5 \u5DF2\u6210\u529F\u6267\u884C",
          "MISSING_DEPLOY_ID"
        );
      }
      console.log("  \u2192 \u6807\u8BB0\u5206\u7EC4\u90E8\u7F72\u5B8C\u6210...");
      await services.client.markGroupDone(context.deployId);
      logger2.info("markGroupDone \u6210\u529F", { deployId: context.deployId });
      console.log("  \u2192 \u6807\u8BB0\u7070\u5EA6\u90E8\u7F72\u5B8C\u6210...");
      await services.client.markGrayDone(context.deployId);
      logger2.info("markGrayDone \u6210\u529F", { deployId: context.deployId });
      console.log("  \u2705 \u90E8\u7F72\u6807\u8BB0\u5B8C\u6210\uFF0CdeployId=" + context.deployId);
    }
    module2.exports = {
      runStep10
    };
  }
});

// src/steps/runDeployment.js
var require_runDeployment = __commonJS({
  "src/steps/runDeployment.js"(exports2, module2) {
    var logger2 = require_logger();
    var { runStep0 } = require_step0CheckBuild();
    var { runStep1 } = require_step1TriggerBuild();
    var { runStep2 } = require_step2PollBuild();
    var { runStep3 } = require_step3FetchTags();
    var { runStep45 } = require_step45CheckHistoryDeploy();
    var { runStep5 } = require_step5CreateDeploy();
    var { runStep6 } = require_step6SetupGrayGroup();
    var { runStep7 } = require_step7ApproveGrayRule();
    var { runStep8 } = require_step8ExecuteDeploy();
    var { runStep9 } = require_step9PollDeploy();
    var { runStep10 } = require_step10MarkDone();
    async function runDeployment2(context, services) {
      var _a;
      const summary = {
        executedSteps: [],
        mode: context.dryRun ? "dry-run" : "live",
        allowLive: context.allowLive
      };
      const step0Result = await runStep0(context, services);
      summary.executedSteps.push("Step0");
      summary.step0Action = step0Result.action;
      if (step0Result.action === "EXIT") {
        summary.terminated = true;
        summary.reason = step0Result.reason;
        return summary;
      }
      if (step0Result.action === "SHOW_LOG_THEN_DECIDE") {
        logger2.warn("\u5F53\u524D\u4EC5\u5B9E\u73B0\u5230 Step 0-3\uFF0C\u67E5\u770B\u65E5\u5FD7\u540E\u9ED8\u8BA4\u8FDB\u5165\u672C\u6B21\u6784\u5EFA\u6D41\u7A0B", {
          dryRun: context.dryRun
        });
      }
      if (step0Result.action === "SKIP_TO_DEPLOY") {
        logger2.info("\u4F7F\u7528\u73B0\u6709\u6784\u5EFA\uFF0C\u8DF3\u8FC7 Step 1-2\uFF0C\u76F4\u63A5\u83B7\u53D6\u90E8\u7F72\u6807\u7B7E");
        context.buildNumber = (_a = context.latestBuild) == null ? void 0 : _a.build_number;
        await runStep3(context, services);
        summary.executedSteps.push("Step3(skip)");
      } else if (step0Result.action === "WAIT_EXISTING_BUILD") {
        context.isExistingBuild = true;
        await runStep2(context, services);
        summary.executedSteps.push("Step2(existingBuild)");
        context.isExistingBuild = false;
        console.log("\n\u2705 \u5B58\u91CF\u6784\u5EFA\u5DF2\u5B8C\u6210\uFF0C\u5F00\u59CB\u89E6\u53D1\u672C\u6B21\u6784\u5EFA...\n");
        await runStep1(context, services);
        summary.executedSteps.push("Step1");
        await runStep2(context, services);
        summary.executedSteps.push("Step2");
        await runStep3(context, services);
        summary.executedSteps.push("Step3");
      } else if (step0Result.action === "START_BUILD") {
        await runStep1(context, services);
        summary.executedSteps.push("Step1");
        await runStep2(context, services);
        summary.executedSteps.push("Step2");
        await runStep3(context, services);
        summary.executedSteps.push("Step3");
      }
      if (context.stopAfter === "build") {
        summary.terminated = true;
        summary.reason = "\u547D\u4E2D --stop-after build";
        summary.pendingFromStep = 4.5;
        return attachContextSummary(summary, context);
      }
      await runStep45(context, services);
      summary.executedSteps.push("Step4.5");
      await runStep5(context, services);
      summary.executedSteps.push("Step5");
      await runStep6(context, services);
      summary.executedSteps.push("Step6");
      await runStep7(context, services);
      summary.executedSteps.push("Step7");
      await runStep8(context, services);
      summary.executedSteps.push("Step8");
      await runStep9(context, services);
      summary.executedSteps.push("Step9");
      await runStep10(context, services);
      summary.executedSteps.push("Step10");
      summary.completed = true;
      summary.reason = "\u5168\u90E8\u6B65\u9AA4\u6267\u884C\u5B8C\u6210";
      return attachContextSummary(summary, context);
    }
    function attachContextSummary(summary, context) {
      return {
        ...summary,
        appKey: context.appKey,
        buildNumber: context.buildNumber,
        deployTag: context.deployTag,
        rollbackTag: context.rollbackTag,
        deployId: context.deployId
      };
    }
    module2.exports = {
      runDeployment: runDeployment2
    };
  }
});

// deploy.js
var path = require("path");
var defaultConfig = require_deploy_config();
var { parseArgs } = require_config();
var { createContext } = require_context();
var { createAvatarClient } = require_avatarClient();
var prompt = require_prompt();
var logger = require_logger();
var { DeployError } = require_errors();
var { runDeployment } = require_runDeployment();
async function main() {
  const cliArgs = parseArgs(process.argv.slice(2));
  if (cliArgs.help) {
    printHelp();
    return;
  }
  if (Array.isArray(cliArgs.unknown) && cliArgs.unknown.length > 0) {
    throw new DeployError(`\u5B58\u5728\u672A\u8BC6\u522B\u53C2\u6570: ${cliArgs.unknown.join(", ")}`, "UNKNOWN_ARGS");
  }
  const STOP_AFTER_STAGES = ["build"];
  if (cliArgs.stopAfter && !STOP_AFTER_STAGES.includes(cliArgs.stopAfter)) {
    throw new DeployError(
      `--stop-after \u53C2\u6570\u503C\u65E0\u6548: "${cliArgs.stopAfter}"\uFF0C\u76EE\u524D\u4EC5\u652F\u6301: ${STOP_AFTER_STAGES.join(", ")}`,
      "INVALID_STOP_AFTER"
    );
  }
  const runtime = await resolveRuntime(cliArgs, defaultConfig);
  const context = createContext(runtime);
  const client = createAvatarClient(runtime);
  if (context.dryRun) {
    process.env.DEPLOY_DRY_RUN = "true";
  }
  logger.info("\u90E8\u7F72\u811A\u672C\u542F\u52A8", {
    appKey: context.appKey,
    dryRun: context.dryRun,
    allowLive: context.allowLive,
    stopAfter: context.stopAfter || null
  });
  const summary = await runDeployment(context, {
    client,
    prompt
  });
  logger.info("\u6267\u884C\u5B8C\u6210", summary);
  if (process.env.DEPLOY_OUTPUT_JSON === "true") {
    console.log("__RESULT__" + JSON.stringify({ success: true, summary }));
  }
}
async function resolveRuntime(cliArgs, config) {
  const appKey = cliArgs.app || process.env.DEPLOY_APP_KEY || config.platform.defaultAppKey;
  const username = process.env.DEPLOY_USERNAME || config.auth.username;
  const password = process.env.DEPLOY_PASSWORD || config.auth.password;
  const needPackage = Boolean(cliArgs.needPackage || cliArgs.version);
  const version = cliArgs.version || process.env.DEPLOY_VERSION || "";
  const versionPart = version ? `[${version}]` : "";
  const notePart = cliArgs.note || "";
  const buildNote = notePart ? `${config.build.defaultNotePrefix} ${versionPart} ${notePart}`.trim() : `${config.build.defaultNotePrefix} ${versionPart} ${appKey || ""}`.trim();
  if (!appKey) {
    throw new DeployError("\u7F3A\u5C11 appKey\uFF0C\u8BF7\u901A\u8FC7 --app\u3001DEPLOY_APP_KEY \u6216\u914D\u7F6E\u6587\u4EF6\u63D0\u4F9B", "APP_KEY_MISSING");
  }
  if (!username || !password) {
    throw new DeployError("\u7F3A\u5C11\u8BA4\u8BC1\u4FE1\u606F\uFF0C\u8BF7\u63D0\u4F9B DEPLOY_USERNAME \u548C DEPLOY_PASSWORD \u6216\u5728\u914D\u7F6E\u6587\u4EF6\u4E2D\u586B\u5199 auth.username/auth.password", "AUTH_MISSING");
  }
  if (needPackage && !version) {
    throw new DeployError("\u5DF2\u9009\u62E9\u9700\u8981\u6253\u5305\uFF0C\u4F46\u672A\u63D0\u4F9B version\uFF0C\u8BF7\u901A\u8FC7 --version \u6216 DEPLOY_VERSION \u63D0\u4F9B", "VERSION_MISSING");
  }
  const allowLive = Boolean(cliArgs.allowLive);
  const dryRun = cliArgs.dryRun || !allowLive;
  return {
    appKey,
    username,
    password,
    version,
    needPackage,
    buildNote,
    dryRun,
    allowLive,
    debug: Boolean(cliArgs.debug || config.runtime.debug),
    quick: Boolean(cliArgs.quick || config.runtime.quick),
    yes: Boolean(cliArgs.yes || config.runtime.yes),
    checkOnly: Boolean(cliArgs.checkOnly || config.runtime.checkOnly),
    stopAfter: cliArgs.stopAfter || config.runtime.stopAfter,
    historyMode: cliArgs.historyMode || config.runtime.historyMode,
    buildFailAction: cliArgs.buildFailAction || config.runtime.buildFailAction,
    pollInterval: config.platform.pollInterval,
    buildTimeout: config.platform.buildTimeout,
    deployTimeout: config.platform.deployTimeout,
    historyDeployTimeout: config.platform.historyDeployTimeout,
    branchTag: config.build.branchTag,
    baseUrl: process.env.DEPLOY_BASE_URL || config.platform.baseUrl,
    mockPrecheckStatus: process.env.DEPLOY_MOCK_PRECHECK_STATUS || "NONE",
    mockBuildResult: process.env.DEPLOY_MOCK_BUILD_RESULT || "SUCCESS",
    mockDeployTag: process.env.DEPLOY_MOCK_DEPLOY_TAG || "20260414-091108",
    mockRollbackTag: process.env.DEPLOY_MOCK_ROLLBACK_TAG || "20260413-172202",
    mockHistoryList: process.env.DEPLOY_MOCK_HISTORY_LIST || "none",
    mockHistoryStatus: process.env.DEPLOY_MOCK_HISTORY_STATUS || "RULE_QA_TESTED",
    mockHistoryAutoComplete: process.env.DEPLOY_MOCK_HISTORY_AUTO_COMPLETE !== "false"
  };
}
function printHelp() {
  const fileName = path.basename(__filename);
  console.log(`\u7528\u6CD5: yjcd --app <appKey> [options]`);
  console.log(`   \u6216: yjcd-quick --app <appKey> [options]
`);
  console.log("\u5E38\u7528\u547D\u4EE4:");
  console.log("  yjcd-quick --app erp.fund.api                          \u5FEB\u901F\u90E8\u7F72\uFF08\u63A8\u8350\uFF09");
  console.log("  yjcd-quick --app erp.fund.api --version 1.2.3          \u5E26\u7248\u672C\u53F7\u90E8\u7F72");
  console.log("  yjcd --app erp.fund.api --yes --allow-live             \u5B8C\u6574\u547D\u4EE4");
  console.log("  yjcd --app erp.fund.api --version 1.2.3 --yes --stop-after build");
  console.log("                                                         \u53EA\u6784\u5EFA\u6253\u5305\uFF0C\u4E0D\u90E8\u7F72");
  console.log("");
  console.log("\u6838\u5FC3\u53C2\u6570:");
  console.log("  --app <appKey>          \u5E94\u7528\u6807\u8BC6\uFF08\u5FC5\u586B\uFF09");
  console.log("  --version <ver>         \u6253\u5305\u7248\u672C\u53F7\uFF08\u4F20\u4E86\u5373\u8868\u793A\u9700\u8981\u6253\u5305\uFF09");
  console.log("  --note <text>           \u6784\u5EFA\u5907\u6CE8");
  console.log("  --yes                   \u975E\u4EA4\u4E92\u6A21\u5F0F\uFF0C\u81EA\u52A8\u786E\u8BA4\u6240\u6709\u63D0\u793A");
  console.log("  --allow-live            \u5141\u8BB8\u771F\u5B9E\u8C03\u7528\uFF08\u9ED8\u8BA4 dry-run\uFF09");
  console.log("  --stop-after build      \u6784\u5EFA\u6210\u529F\u540E\u505C\u6B62\uFF08\u4E0D\u8FDB\u5165\u90E8\u7F72\u9636\u6BB5\uFF09");
  console.log("  --dry-run               \u6A21\u62DF\u8FD0\u884C\uFF0C\u4E0D\u53D1\u9001\u771F\u5B9E\u8BF7\u6C42\uFF08\u9ED8\u8BA4\u5F00\u542F\uFF0C\u9664\u975E\u6EE1\u8DB3\u771F\u5B9E\u8C03\u7528\u6761\u4EF6\uFF09");
  console.log("  --debug                 \u8F93\u51FA\u8BE6\u7EC6\u8C03\u8BD5\u65E5\u5FD7");
  console.log("");
  console.log("\u73AF\u5883\u53D8\u91CF:");
  console.log("  DEPLOY_USERNAME         \u8BA4\u8BC1\u7528\u6237\u540D\uFF08\u4F18\u5148\u7EA7\u9AD8\u4E8E\u914D\u7F6E\u6587\u4EF6\uFF09");
  console.log("  DEPLOY_PASSWORD         \u8BA4\u8BC1\u5BC6\u7801\uFF08\u4F18\u5148\u7EA7\u9AD8\u4E8E\u914D\u7F6E\u6587\u4EF6\uFF09");
  console.log("");
  console.log("\u5B89\u88C5:");
  console.log("  npm install -g .        \u5168\u5C40\u5B89\u88C5\u540E\u53EF\u7528 yjcd / yjcd-quick \u547D\u4EE4");
}
main().catch((error) => {
  const payload = error instanceof DeployError ? { code: error.code, message: error.message, details: error.details } : { message: error.message || String(error) };
  logger.error("\u6267\u884C\u5931\u8D25", payload);
  if (process.env.DEPLOY_OUTPUT_JSON === "true") {
    console.log("__RESULT__" + JSON.stringify({ success: false, error: payload }));
  }
  process.exit(1);
});
