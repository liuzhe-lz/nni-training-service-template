'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const commands_1 = require("./nnilib/commands");
const commandChannel_1 = require("./nnilib/commandChannel");
class WebRunnerConnection extends commandChannel_1.RunnerConnection {
    constructor() {
        super(...arguments);
        this.clients = [];
    }
    async close() {
        await super.close();
        while (this.clients.length > 0) {
            const client = this.clients.shift();
            if (client !== undefined) {
                client.close();
            }
        }
    }
    AddClient(client) {
        this.clients.push(client);
    }
}
class WebCommandChannel extends commandChannel_1.CommandChannel {
    constructor(commandEmitter, basePort) {
        super(commandEmitter);
        this.expId = 'local2';
        this.clients = new Map();
        this.basePort = basePort;
    }
    get channelName() {
        return "web";
    }
    async config(_key, _value) {
    }
    static getInstance(commandEmitter, basePort) {
        if (!this.commandChannel) {
            this.commandChannel = new WebCommandChannel(commandEmitter, basePort);
        }
        return this.commandChannel;
    }
    async start() {
        const port = this.basePort + 1;
        this.webSocketServer = new ws_1.Server({ port });
        this.webSocketServer.on('connection', (client) => {
            client.onerror = (event) => {
                console.log(`error on client ${JSON.stringify(event)}`);
            };
            this.clients.set(client, undefined);
            client.onmessage = (message) => {
                this.receivedWebSocketMessage(client, message);
            };
        }).on('error', (error) => {
            console.log(`error on websocket server ${error}`);
        });
    }
    async stop() {
        if (this.webSocketServer !== undefined) {
            this.webSocketServer.close();
        }
    }
    async run() {
    }
    async sendCommandInternal(environment, message) {
        if (this.webSocketServer === undefined) {
            throw new Error(`WebCommandChannel: uninitialized!`);
        }
        const runnerConnection = this.runnerConnections.get(environment.id);
        if (runnerConnection !== undefined) {
            for (const client of runnerConnection.clients) {
                client.send(message);
            }
        }
        else {
            console.log(`WebCommandChannel: cannot find client for env ${environment.id}, message is ignored.`);
        }
    }
    createRunnerConnection(environment) {
        return new WebRunnerConnection(environment);
    }
    receivedWebSocketMessage(client, message) {
        let connection = this.clients.get(client);
        const rawCommands = message.data.toString();
        if (connection === undefined) {
            const commands = this.parseCommands(rawCommands);
            let isValid = false;
            if (commands.length > 0) {
                const commandType = commands[0][0];
                const result = commands[0][1];
                let runnerId = result.runnerId;
                if (!this.runnerConnections.has(runnerId)) {
                    runnerId = Array.from(this.runnerConnections.keys())[0];
                }
                if (commandType === commands_1.INITIALIZED && this.runnerConnections.has(runnerId)) {
                    const runnerConnection = this.runnerConnections.get(runnerId);
                    this.clients.set(client, runnerConnection);
                    runnerConnection.AddClient(client);
                    connection = runnerConnection;
                    isValid = true;
                }
                else {
                    //console.log(`WebCommandChannel: client is not initialized, runnerId: ${result.runnerId}, command: ${commandType}, expId: ${this.expId}, exists: ${this.runnerConnections.has(result.runnerId)}`);
                }
            }
            if (!isValid) {
                //console.log(`WebCommandChannel: rejected client with invalid init message ${rawCommands}`);
                client.close();
                this.clients.delete(client);
            }
        }
        if (connection !== undefined) {
            this.handleCommand(connection.environment, rawCommands);
        }
    }
}
exports.WebCommandChannel = WebCommandChannel;
