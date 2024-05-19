const { readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");
const { safeParseJSON, getPnpmWorkspaceRootPath } = require("./utils");

/**
 * 获取worksapce根目录下的临时文件路径 'deps-released-temp.json'
 * @returns {String} tempFilePath
 */
async function getDepsRecordFilePath() {
  const DEPS_RELEASED_FILENAME = "deps-released-temp.json";
  return join(await getPnpmWorkspaceRootPath(), DEPS_RELEASED_FILENAME);
}

/**
 * 读取临时文件，返回临时文件记录的内容: 本轮已发布的包&版本号
 * @returns {Object}
 */
async function getExistedDepsRecord() {
  const depsRecordFilePath = await getDepsRecordFilePath();
  if (!existsSync(depsRecordFilePath)) return {};
  const fileText = readFileSync(depsRecordFilePath);
  const res = safeParseJSON(fileText, {});
  console.log("[deps-analyzer] get: ", JSON.stringify(res, null, 2));
  return res;
}

/**
 * 传入一个依赖发布对象, 用来记录本轮已发布的包&版本号信息 (key为报名，value为版本号信息)
 * @param {Object} depsRecordObj
 * @returns void
 */
async function addDepsRecord(depsRecordObj) {
  if (!depsRecordObj) return;
  // 合并本次其他已发布记录
  const existsDepRecord = await getExistedDepsRecord();
  const depsRecordFilePath = await getDepsRecordFilePath();
  const writeText = JSON.stringify(
    {
      ...existsDepRecord,
      ...depsRecordObj,
    },
    null,
    2
  );
  writeFileSync(depsRecordFilePath, writeText);
  console.log("[deps-analyzer] after add: ", writeText);
}

module.exports = {
  getExistedDepsRecord,
  addDepsRecord,
};
