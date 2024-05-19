const { readFileSync, existsSync } = require("fs");
const childProcess = require("child_process");
const { resolve } = require("path");

/**
 * 开启子进程执行一条 shell 语句，返回执行结果
 */
function tryExecute(command, options) {
  return new Promise((resolve) => {
    const proc = childProcess.exec(command, options, (error, stdout, stderr) => {
      resolve({
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        code: error?.code ?? proc.exitCode ?? 0,
        error,
      });
    });
  });
}

/**
 * 输出错误消息并退出程序
 */
function exit(message, exitCode = 1) {
  console.error(message);
  process.exit(exitCode);
}

/**
 * 执行一条 shell 语句。成功返回 stdout，失败则退出程序，子进程的 stderr 始终会输出到当前进程。
 */
async function execute(command, options) {
  const result = await tryExecute(command, options);
  if (result.stderr) process.stderr.write("\n" + result.stderr);
  if (result.error) {
    if (result.stdout) process.stderr.write("\n" + result.stdout);
    exit(`${command} 执行失败 [${result.code}]`);
  }
  return result.stdout;
}

/**
 * 解析 JSON，若失败，返回 fallback 或 undefined
 */
function safeParseJSON(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/**
 * 获取worksapce根目录
 */
async function getPnpmWorkspaceRootPath() {
  const workspaceMoudlePath = await execute("pnpm root -w");
  const workspaceRootPath = resolve(workspaceMoudlePath, "..");
  return workspaceRootPath;
}

/**
 * 获取workspace package根目录
 */
async function getPnpmWorkspacePkgInfo() {
  const workspaceRootPath = await getPnpmWorkspaceRootPath();
  return safeParseJSON(readFileSync(resolve(workspaceRootPath, "package.json")), {});
}

/**
 * 判断是否为pnpm workspace项目
 */
async function checkIsPnpmWorkspace() {
  const workspaceRootPath = await getPnpmWorkspaceRootPath();
  const workspaceFilePath = resolve(workspaceRootPath, "pnpm-workspace.yaml");
  return existsSync(workspaceFilePath);
}

/**
 * 获取当前子package根目录
 */
async function getCurPkgRootPath() {
  const pkgMoudlePath = await execute("pnpm root");
  const pkgRootPath = resolve(pkgMoudlePath, "..");
  return pkgRootPath;
}

/**
 * 获取当前子包的package.json信息
 */
async function getCurPkgInfo() {
  const pkgRootPath = await getCurPkgRootPath();
  return safeParseJSON(readFileSync(resolve(pkgRootPath, "package.json")), {});
}

module.exports = {
  execute,
  safeParseJSON,
  getPnpmWorkspaceRootPath,
  getPnpmWorkspacePkgInfo,
  checkIsPnpmWorkspace,
  getCurPkgRootPath,
  getCurPkgInfo,
};
