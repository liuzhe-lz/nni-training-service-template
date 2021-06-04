'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const tkill = require("tree-kill");
const log_1 = require("./nnilib/log");
const environment_1 = require("./nnilib/environment");
const utils_1 = require("./nnilib/utils");
const util_1 = require("./nnilib/util");
const channel_1 = require("./channel");
let Local2EnvironmentService = class Local2EnvironmentService extends environment_1.EnvironmentService {
    constructor(_config, info) {
        super();
        this.log = log_1.getLogger('Local2EnvironmentService');
        this.experimentInfo = info;
        this.experimentId = info.experimentId;
        this.experimentRootDir = info.logDir;
    }
    initCommandChannel(emitter) {
        this.commandChannel = channel_1.WebCommandChannel.getInstance(emitter, this.experimentInfo.basePort);
    }
    get environmentMaintenceLoopInterval() {
        return 100;
    }
    get hasStorageService() {
        return false;
    }
    get getName() {
        return 'local2';
    }
    async refreshEnvironmentsStatus(environments) {
        environments.forEach(async (environment) => {
            const jobpidPath = `${path.join(environment.runnerWorkingFolder, 'pid')}`;
            const runnerReturnCodeFilePath = `${path.join(environment.runnerWorkingFolder, 'code')}`;
            try {
                const pidExist = await fs.existsSync(jobpidPath);
                if (!pidExist) {
                    return;
                }
                const pid = await fs.promises.readFile(jobpidPath, 'utf8');
                const alive = await utils_1.isAlive(pid);
                environment.status = 'RUNNING';
                if (!alive) {
                    if (fs.existsSync(runnerReturnCodeFilePath)) {
                        const runnerReturnCode = await fs.promises.readFile(runnerReturnCodeFilePath, 'utf8');
                        const match = runnerReturnCode.trim()
                            .match(/^-?(\d+)\s+(\d+)$/);
                        if (match !== null) {
                            const { 1: code } = match;
                            if (parseInt(code, 10) === 0) {
                                environment.setStatus('SUCCEEDED');
                            }
                            else {
                                environment.setStatus('FAILED');
                            }
                        }
                    }
                }
            }
            catch (error) {
                this.log.error(`Update job status exception, error is ${error.message}`);
            }
        });
    }
    getScript(environment) {
        const script = [];
        if (process.platform === 'win32') {
            script.push(`$env:PATH="${process.env.path}"`);
            script.push(`cd $env:${this.experimentRootDir}`);
            script.push(`New-Item -ItemType "directory" -Path ${path.join(this.experimentRootDir, 'envs', environment.id)} -Force`);
            script.push(`cd envs\\${environment.id}`);
            environment.command = `python -m nni.tools.trial_tool.trial_runner`;
            script.push(`cmd.exe /c ${environment.command} --job_pid_file ${path.join(environment.runnerWorkingFolder, 'pid')} 2>&1 | Out-File "${path.join(environment.runnerWorkingFolder, 'trial_runner.log')}" -encoding utf8`, `$NOW_DATE = [int64](([datetime]::UtcNow)-(get-date "1/1/1970")).TotalSeconds`, `$NOW_DATE = "$NOW_DATE" + (Get-Date -Format fff).ToString()`, `Write $LASTEXITCODE " " $NOW_DATE  | Out-File "${path.join(environment.runnerWorkingFolder, 'code')}" -NoNewline -encoding utf8`);
        }
        else {
            script.push(`cd ${this.experimentRootDir}`);
            script.push(`eval ${environment.command} --job_pid_file ${environment.runnerWorkingFolder}/pid 1>${environment.runnerWorkingFolder}/trialrunner_stdout 2>${environment.runnerWorkingFolder}/trialrunner_stderr`);
            if (process.platform === 'darwin') {
                script.push(`echo $? \`date +%s999\` >'${environment.runnerWorkingFolder}/code'`);
            }
            else {
                script.push(`echo $? \`date +%s%3N\` >'${environment.runnerWorkingFolder}/code'`);
            }
        }
        script.push('');
        return script;
    }
    async startEnvironment(environment) {
        const localEnvCodeFolder = path.join(this.experimentRootDir, "envs");
        const localTempFolder = path.join(this.experimentRootDir, "environment-temp", "envs");
        await util_1.execCopydir(localTempFolder, localEnvCodeFolder);
        environment.runnerWorkingFolder = path.join(localEnvCodeFolder, environment.id);
        await util_1.execMkdir(environment.runnerWorkingFolder);
        environment.command = this.getScript(environment).join(utils_1.getNewLine());
        const scriptName = util_1.getScriptName('run');
        await fs.promises.writeFile(path.join(localEnvCodeFolder, scriptName), environment.command, { encoding: 'utf8', mode: 0o777 });
        //this.log.info('cwd:', process.cwd());
        //this.log.info(localEnvCodeFolder, scriptName);
        //util_1.runScript('pwd > /home/lz/tmp-pwd');
        util_1.runScript(path.join(localEnvCodeFolder, scriptName));
        environment.trackingUrl = `${environment.runnerWorkingFolder}`;
    }
    async stopEnvironment(environment) {
        if (environment.isAlive === false) {
            return Promise.resolve();
        }
        const jobpidPath = `${path.join(environment.runnerWorkingFolder, 'pid')}`;
        const pid = await fs.promises.readFile(jobpidPath, 'utf8');
        tkill(Number(pid), 'SIGKILL');
    }
};
exports.Local2EnvironmentService = Local2EnvironmentService;
