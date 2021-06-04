'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cpp = require("child-process-promise");
const cp = require("child_process");
const fs = require("fs");
const ignore_1 = require("ignore");
const path = require("path");
const utils_1 = require("./utils");
function* listDirWithIgnoredFiles(root, relDir, ignoreFiles) {
    let ignoreFile = undefined;
    const source = path.join(root, relDir);
    if (fs.existsSync(path.join(source, '.nniignore'))) {
        ignoreFile = path.join(source, '.nniignore');
        ignoreFiles.push(ignoreFile);
    }
    const ig = ignore_1.default();
    ignoreFiles.forEach((i) => ig.add(fs.readFileSync(i).toString()));
    for (const d of fs.readdirSync(source)) {
        const entry = path.join(relDir, d);
        if (ig.ignores(entry))
            continue;
        const entryStat = fs.statSync(path.join(root, entry));
        if (entryStat.isDirectory()) {
            yield entry;
            yield* listDirWithIgnoredFiles(root, entry, ignoreFiles);
        }
        else if (entryStat.isFile())
            yield entry;
    }
    if (ignoreFile !== undefined) {
        ignoreFiles.pop();
    }
}
exports.listDirWithIgnoredFiles = listDirWithIgnoredFiles;
async function execMkdir(directory, share = false) {
    if (process.platform === 'win32') {
        await cpp.exec(`powershell.exe New-Item -Path "${directory}" -ItemType "directory" -Force`);
    }
    else if (share) {
        await cpp.exec(`(umask 0; mkdir -p '${directory}')`);
    }
    else {
        await cpp.exec(`mkdir -p '${directory}'`);
    }
    return Promise.resolve();
}
exports.execMkdir = execMkdir;
async function execCopydir(source, destination) {
    if (!fs.existsSync(destination))
        await fs.promises.mkdir(destination);
    for (const relPath of listDirWithIgnoredFiles(source, '', [])) {
        const sourcePath = path.join(source, relPath);
        const destPath = path.join(destination, relPath);
        if (fs.statSync(sourcePath).isDirectory()) {
            if (!fs.existsSync(destPath)) {
                await fs.promises.mkdir(destPath);
            }
        }
        else {
            await fs.promises.copyFile(sourcePath, destPath);
        }
    }
    return Promise.resolve();
}
exports.execCopydir = execCopydir;
async function execNewFile(filename) {
    if (process.platform === 'win32') {
        await cpp.exec(`powershell.exe New-Item -Path "${filename}" -ItemType "file" -Force`);
    }
    else {
        await cpp.exec(`touch '${filename}'`);
    }
    return Promise.resolve();
}
exports.execNewFile = execNewFile;
function runScript(filePath) {
    if (process.platform === 'win32') {
        return cp.exec(`powershell.exe -ExecutionPolicy Bypass -file "${filePath}"`);
    }
    else {
        return cp.exec(`bash '${filePath}'`);
    }
}
exports.runScript = runScript;
async function execTail(filePath) {
    let cmdresult;
    if (process.platform === 'win32') {
        cmdresult = await cpp.exec(`powershell.exe Get-Content "${filePath}" -Tail 1`);
    }
    else {
        cmdresult = await cpp.exec(`tail -n 1 '${filePath}'`);
    }
    return Promise.resolve(cmdresult);
}
exports.execTail = execTail;
async function execRemove(directory) {
    if (process.platform === 'win32') {
        await cpp.exec(`powershell.exe Remove-Item "${directory}" -Recurse -Force`);
    }
    else {
        await cpp.exec(`rm -rf '${directory}'`);
    }
    return Promise.resolve();
}
exports.execRemove = execRemove;
async function execKill(pid) {
    if (process.platform === 'win32') {
        await cpp.exec(`cmd.exe /c taskkill /PID ${pid} /T /F`);
    }
    else {
        await cpp.exec(`pkill -P ${pid}`);
    }
    return Promise.resolve();
}
exports.execKill = execKill;
function setEnvironmentVariable(variable) {
    if (process.platform === 'win32') {
        return `$env:${variable.key}="${variable.value}"`;
    }
    else {
        return `export ${variable.key}='${variable.value}'`;
    }
}
exports.setEnvironmentVariable = setEnvironmentVariable;
function getScriptName(fileNamePrefix) {
    if (process.platform === 'win32') {
        return `${fileNamePrefix}.ps1`;
    }
    else {
        return `${fileNamePrefix}.sh`;
    }
}
exports.getScriptName = getScriptName;
function getGpuMetricsCollectorBashScriptContent(scriptFolder) {
    return `echo $$ > ${scriptFolder}/pid ; METRIC_OUTPUT_DIR=${scriptFolder} python3 -m nni.tools.gpu_tool.gpu_metrics_collector \
1>${scriptFolder}/stdout 2>${scriptFolder}/stderr`;
}
exports.getGpuMetricsCollectorBashScriptContent = getGpuMetricsCollectorBashScriptContent;
