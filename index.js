const { getCurPkgInfo, checkIsPnpmWorkspace } = require("./lib/utils");
const { addDepsRecord } = require("./lib/handle-deps-file");
const { analyzeDeps } = require("./lib/analyze-deps");

let curPkgReleasedDeps;

/**
 * 处理pluginConfig默认值
 */
function mergeDefaultConfig(pluginConfig) {
  const { analyzeDepTypes, depsAutoReleaseType, ignorePackages, ignoreDeps } = pluginConfig;
  pluginConfig.depsAutoReleaseType = depsAutoReleaseType || "patch";
  pluginConfig.analyzeDepTypes = analyzeDepTypes || ["dependencies", "devDependencies", "peerDependencies"];
  pluginConfig.ignorePackages = ignorePackages || []; // 示例：['@ruqi-utils/core', '@ruqi-utils/mp']
  pluginConfig.ignoreDeps = ignoreDeps || {}; // 示例：{'@ruqi-cube/mp' : ['@ruqi-utils/core', '@ruqi-utils/mp'] }
  return pluginConfig;
}

/**
 * 生命周期 verifyConditions
 * 验证环境 & 插件参数是否正确
 */
async function verifyConditions(pluginConfig, context) {
  const { logger } = context;
  const isPnpmWorkspace = await checkIsPnpmWorkspace();
  if (!isPnpmWorkspace) {
    throw new Error("plugin deps-analyzer only support pnpm workspace");
  }
  if (pluginConfig.analyzeDepTypes) {
    if (!Array.isArray(pluginConfig.analyzeDepTypes)) throw new Error("analyzeDepTypes must be an array");
  }
  if (pluginConfig.depsAutoReleaseType) {
    if (!["inherit", "major", "minor", "patch"].includes(pluginConfig.depsAutoReleaseType))
      throw new Error("depsAutoReleaseType must be one of: major | minor | patch | inherit");
  }

  logger.log(`[deps-analyzer]: 合并配置结果 ${JSON.stringify(mergeDefaultConfig(pluginConfig), null, 2)}`);
}

/**
 * 生命周期 analyzeCommits
 * 增加依赖分析逻辑，并将分析结果通过pluginConfig对象透传给其他生命周期使用
 */
async function analyzeCommits(_pluginConfig, context) {
  const { logger } = context;
  const pluginConfig = mergeDefaultConfig(_pluginConfig);
  const [releaseType, depsAnalyzesResult] = await analyzeDeps(pluginConfig, context);
  curPkgReleasedDeps = depsAnalyzesResult; // 挂载到生命周期共享变量上，后续不需要重复分析
  logger.log(`【调试】analyzeCommits 写入 ${JSON.stringify(curPkgReleasedDeps, null, 2)}`);
  logger.log(`[deps-analyzer]: analyzeDeps result: ${releaseType}`);
  return releaseType;
}

/**
 * 生命周期 generateNotes
 * 根据前置步骤的分析结果 追加生成changeLog的notes
 */
async function generateNotes(_pluginConfig, context) {
  const { logger } = context;
  // const pluginConfig = mergeDefaultConfig(_pluginConfig);
  logger.log(`【调试】generateNotes复用 ${JSON.stringify(curPkgReleasedDeps, null, 2)}`);
  let hasContent = false;
  let changeLogNotes = ["### Dependencies"];
  for (const [depsType, depsObj] of Object.entries(curPkgReleasedDeps)) {
    for (const [name, recordObj] of Object.entries(depsObj)) {
      changeLogNotes.push(`* **${name}** upgraded to ${recordObj.version} (${depsType})`);
      hasContent = true;
    }
  }
  return hasContent ? changeLogNotes.join("\n\n") : "";
}

/**
 * 生命周期 success
 * 发布成功时，将本次发布信息记录到pnpm workspace的临时文件中，方便后续的依赖分析
 */
async function success(_pluginConfig, context) {
  const { logger, nextRelease } = context;
  const { name } = await getCurPkgInfo();

  if (name && nextRelease) {
    logger.log("[deps-analyzer][success]: 发布成功, 记录依赖信息");
    logger.log(`[deps-analyzer][success]: name调试 pkg:${name}, nextRelease:${nextRelease.name}`);
    const { version, type: releaseType } = nextRelease;
    await addDepsRecord({
      [name]: {
        version,
        releaseType,
      },
    });
  }
}

module.exports = { verifyConditions, analyzeCommits, generateNotes, success };
