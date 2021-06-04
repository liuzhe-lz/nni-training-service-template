'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const commands_1 = require("./commands");
const ipcInterface_1 = require("./ipcInterface");
const acceptedCommands = new Set(commands_1.TRIAL_COMMANDS);
class Command {
    constructor(environment, command, data) {
        if (!acceptedCommands.has(command)) {
            throw new Error(`unaccepted command ${command}`);
        }
        this.environment = environment;
        this.command = command;
        this.data = data;
    }
}
exports.Command = Command;
class RunnerConnection {
    constructor(environment) {
        this.environment = environment;
    }
    async open() {
    }
    async close() {
    }
}
exports.RunnerConnection = RunnerConnection;
class CommandChannel {
    constructor(commandEmitter) {
        this.runnerConnections = new Map();
        this.commandPattern = /(?<type>[\w]{2})(?<length>[\d]{14})(?<data>.*)\n?/gm;
        this.commandEmitter = commandEmitter;
    }
    async sendCommand(environment, commandType, data) {
        const command = ipcInterface_1.encodeCommand(commandType, JSON.stringify(data));
        await this.sendCommandInternal(environment, command.toString("utf8"));
    }
    async open(environment) {
        if (this.runnerConnections.has(environment.id)) {
            throw new Error(`CommandChannel: env ${environment.id} is opened already, shouldn't be opened again.`);
        }
        const connection = this.createRunnerConnection(environment);
        this.runnerConnections.set(environment.id, connection);
        await connection.open();
    }
    async close(environment) {
        if (this.runnerConnections.has(environment.id)) {
            const connection = this.runnerConnections.get(environment.id);
            this.runnerConnections.delete(environment.id);
            if (connection !== undefined) {
                await connection.close();
            }
        }
    }
    parseCommands(content) {
        const commands = [];
        let matches = this.commandPattern.exec(content);
        while (matches) {
            if (undefined !== matches.groups) {
                const commandType = matches.groups["type"];
                const dataLength = parseInt(matches.groups["length"]);
                const data = matches.groups["data"];
                if (dataLength !== data.length) {
                    throw new Error(`dataLength ${dataLength} not equal to actual length ${data.length}: ${data}`);
                }
                try {
                    const finalData = JSON.parse(data);
                    commands.push([commandType, finalData]);
                }
                catch (error) {
                    throw error;
                }
            }
            matches = this.commandPattern.exec(content);
        }
        return commands;
    }
    handleCommand(environment, content) {
        const parsedResults = this.parseCommands(content);
        for (const parsedResult of parsedResults) {
            const commandType = parsedResult[0];
            const data = parsedResult[1];
            const command = new Command(environment, commandType, data);
            this.commandEmitter.emit("command", command);
        }
    }
}
exports.CommandChannel = CommandChannel;
