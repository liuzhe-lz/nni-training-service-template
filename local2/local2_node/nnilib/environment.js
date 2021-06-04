'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class TrialGpuSummary {
    constructor(gpuCount, timestamp, gpuInfos) {
        this.assignedGpuIndexMap = new Map();
        this.gpuCount = gpuCount;
        this.timestamp = timestamp;
        this.gpuInfos = gpuInfos;
    }
}
exports.TrialGpuSummary = TrialGpuSummary;
class EnvironmentInformation {
    constructor(id, name, envId) {
        this.defaultNodeId = "default";
        this.isNoGpuWarned = false;
        this.isAlive = true;
        this.isRunnerReady = false;
        this.status = "UNKNOWN";
        this.runningTrialCount = 0;
        this.assignedTrialCount = 0;
        this.latestTrialReleasedTime = -1;
        this.trackingUrl = "";
        this.workingFolder = "";
        this.runnerWorkingFolder = "";
        this.command = "";
        this.nodeCount = 1;
        this.gpuSummaries = new Map();
        this.id = id;
        this.name = name;
        this.envId = envId ? envId : name;
        this.nodes = new Map();
    }
    setStatus(status) {
        if (this.status !== status) {
            this.status = status;
        }
    }
    setGpuSummary(nodeId, newGpuSummary) {
        if (nodeId === null || nodeId === undefined) {
            nodeId = this.defaultNodeId;
        }
        const originalGpuSummary = this.gpuSummaries.get(nodeId);
        if (undefined === originalGpuSummary) {
            newGpuSummary.assignedGpuIndexMap = new Map();
            this.gpuSummaries.set(nodeId, newGpuSummary);
        }
        else {
            originalGpuSummary.gpuCount = newGpuSummary.gpuCount;
            originalGpuSummary.timestamp = newGpuSummary.timestamp;
            originalGpuSummary.gpuInfos = newGpuSummary.gpuInfos;
        }
    }
    get defaultGpuSummary() {
        const gpuSummary = this.gpuSummaries.get(this.defaultNodeId);
        if (gpuSummary === undefined) {
            if (false === this.isNoGpuWarned) {
                this.isNoGpuWarned = true;
            }
        }
        else {
            this.isNoGpuWarned = false;
        }
        return gpuSummary;
    }
}
exports.EnvironmentInformation = EnvironmentInformation;
class EnvironmentService {
    async init() {
        return;
    }
    get prefetchedEnvironmentCount() {
        return 0;
    }
    get getCommandChannel() {
        if (this.commandChannel === undefined) {
            throw new Error("Command channel not initialized!");
        }
        return this.commandChannel;
    }
    get environmentMaintenceLoopInterval() {
        return 5000;
    }
    get hasMoreEnvironments() {
        return true;
    }
    createEnvironmentInformation(envId, envName) {
        return new EnvironmentInformation(envId, envName);
    }
}
exports.EnvironmentService = EnvironmentService;
class NodeInformation {
    constructor(id) {
        this.status = "UNKNOWN";
        this.id = id;
    }
}
exports.NodeInformation = NodeInformation;
class RunnerSettings {
    constructor() {
        this.experimentId = "";
        this.platform = "";
        this.nniManagerIP = "";
        this.nniManagerPort = 8081;
        this.nniManagerVersion = "";
        this.logCollection = "none";
        this.command = "";
        this.enableGpuCollector = true;
        this.commandChannel = "file";
    }
}
exports.RunnerSettings = RunnerSettings;
