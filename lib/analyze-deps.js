const { getExistedDepsRecord } = require("./handle-deps-file");
const { getCurPkgInfo } = require("./utils");

/**
 * 包依赖分析，获取当前包依赖的变更, 返回变更的报名和新的版本号
 * @returns { Array } [releaseType, analyzeDepsDetail]
 */
async function collectCurPkgReleasedDeps(pluginConfig, context) {
  const { logger } = context;
  const analyzeDepTypes = pluginConfig.analyzeDepTypes; // ['dependencies', 'devDependencies', 'peerDependencies'];
  const curPkgInfo = await getCurPkgInfo();
  const curPackageName = curPkgInfo.name;

  const ignoreDeps = pluginConfig.ignoreDeps[curPackageName] || []; // pluginConfig.ignoreDeps: {'@ruqi-cube/mp' : ['@ruqi-utils/core', '@ruqi-utils/mp'] }
  const haveReleasedDepsRecord = await getExistedDepsRecord();
  const curPkgReleasedDeps = {};

  // 命中ignorePackages
  const ignorePackagesConfig = pluginConfig.ignorePackages;
  if (ignorePackagesConfig.includes(curPackageName)) {
    return [null, {}];
  }

  // 参考ts的enum枚举类型 做正反映射; 记录已发布依赖中的最高发布类型
  const releaseTypeNumMap = {
    major: 3,
    minor: 2,
    patch: 1,
    3: "major",
    2: "minor",
    1: "patch",
    0: null,
  };
  let maxReleaseTypeNum = 0;

  // 记录当前包依赖的已发布依赖
  for (const dependenciesType of analyzeDepTypes) {
    const curDependencies = curPkgInfo[dependenciesType] || {};
    curPkgReleasedDeps[dependenciesType] = Object.entries(haveReleasedDepsRecord).reduce(
      (accumulator, [haveReleasedPkgName, recordObj]) => {
        if (curDependencies[haveReleasedPkgName] && !ignoreDeps.includes(haveReleasedPkgName)) {
          accumulator[haveReleasedPkgName] = recordObj;
          maxReleaseTypeNum = Math.max(maxReleaseTypeNum, releaseTypeNumMap[recordObj.releaseType]);
        }
        return accumulator;
      },
      {}
    );
  }

  logger.log(`${curPackageName} collectCurPkgReleasedDeps: `, JSON.stringify(curPkgReleasedDeps));
  return [releaseTypeNumMap[maxReleaseTypeNum], curPkgReleasedDeps];
}

/**
 * 包依赖分析，获取当前包依赖的变更, 返回变更的类型和依赖更新信息
 * @returns { Array } [releaseType, analyzeDepsDetail]
 */
async function analyzeDeps(pluginConfig, context) {
  const depsAutoReleaseCondigType = pluginConfig.depsAutoReleaseType || "patch"; // inherit | major | minor | patch(默认)
  let [depsMaxReleaseType, curPkgReleasedDeps] = await collectCurPkgReleasedDeps(pluginConfig, context);

  // 处理发布类型
  let releaseType = null;
  if (depsAutoReleaseCondigType === "inherit") {
    releaseType = depsMaxReleaseType;
  } else {
    releaseType = depsMaxReleaseType === null ? null : depsAutoReleaseCondigType;
  }

  return [releaseType, curPkgReleasedDeps];
}

module.exports = {
  analyzeDeps,
};
