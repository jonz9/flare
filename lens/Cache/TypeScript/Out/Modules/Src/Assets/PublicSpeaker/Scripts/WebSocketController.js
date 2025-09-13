"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketController = void 0;
var __selfType = requireType("./WebSocketController");
function component(target) { target.getTypeName = function () { return __selfType; }; }
const NativeLogger_1 = require("SpectaclesInteractionKit.lspkg/Utils/NativeLogger");
const log = new NativeLogger_1.default("WebSocketController");
let WebSocketController = class WebSocketController extends BaseScriptComponent {
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            if (this.autoConnect) {
                this.connect();
            }
        });
        this.createEvent("UpdateEvent").bind(() => {
            this.update();
        });
    }
    update() {
        // Handle reconnection if needed
        if (this.isReconnecting) {
            this.reconnectTimer -= getDeltaTime();
            if (this.reconnectTimer <= 0) {
                this.attemptReconnect();
            }
        }
    }
    // Connect to the WebSocket server
    connect() {
        if (this.isConnected) {
            log.d("Already connected to WebSocket server");
            return;
        }
        if (!this.internetModule) {
            log.e("Internet Module is not assigned. Please assign it in the Inspector.");
            this.updateStatus("Error: No Internet Module");
            return;
        }
        log.d(`Connecting to WebSocket server: ${this.serverUrl}`);
        this.updateStatus("Connecting...");
        try {
            // Create WebSocket using the Internet Module
            this.webSocket = this.internetModule.createWebSocket(this.serverUrl);
            this.webSocket.binaryType = 'blob';
            // Set up event handlers
            this.webSocket.onopen = (event) => {
                log.d("WebSocket connection established");
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.isReconnecting = false;
                this.updateStatus("Connected");
            };
            this.webSocket.onmessage = (message) => {
                log.d(`Received message: ${message}`);
                this.handleMessage(message);
            };
            this.webSocket.onclose = () => {
                log.d("WebSocket connection closed");
                this.isConnected = false;
                this.updateStatus("Disconnected");
                // Start reconnection process
                if (!this.isReconnecting) {
                    this.startReconnection();
                }
            };
            this.webSocket.onerror = (event) => {
                log.e("WebSocket error");
                this.updateStatus("Connection error");
            };
        }
        catch (error) {
            log.e(`Error creating WebSocket: ${error}`);
            this.updateStatus("Connection failed");
            // Start reconnection process
            if (!this.isReconnecting) {
                this.startReconnection();
            }
        }
    }
    // Disconnect from the WebSocket server
    disconnect() {
        if (!this.isConnected || !this.webSocket) {
            log.d("Not connected to WebSocket server");
            return;
        }
        log.d("Disconnecting from WebSocket server");
        this.isReconnecting = false; // Stop any reconnection attempts
        try {
            this.webSocket.close();
            this.webSocket = null;
            this.isConnected = false;
            this.updateStatus("Disconnected");
        }
        catch (error) {
            log.e(`Error disconnecting: ${error}`);
        }
    }
    // Check if WebSocket is connected
    isWebSocketConnected() {
        return this.isConnected;
    }
    // Send a generic message to the WebSocket server
    sendMessage(messageObj) {
        if (!this.isConnected || !this.webSocket) {
            log.w("Cannot send message: Not connected to WebSocket server");
            return false;
        }
        try {
            const message = JSON.stringify(messageObj);
            log.d(`Sending message: ${message}`);
            this.webSocket.send(message);
            return true;
        }
        catch (error) {
            log.e(`Error sending message: ${error}`);
            return false;
        }
    }
    // Send a command to the WebSocket server
    sendCommand(command) {
        return this.sendMessage({
            type: "command",
            command: command
        });
    }
    // Send a "next" command
    next() {
        return this.sendCommand("next");
    }
    // Send a "previous" command
    previous() {
        return this.sendCommand("previous");
    }
    // Check if a "next" command was received
    wasNextCommandReceived(sinceTime = 0) {
        return this.lastCommand === "next" && this.lastCommandTime > sinceTime;
    }
    // Check if a "previous" command was received
    wasPreviousCommandReceived(sinceTime = 0) {
        return this.lastCommand === "previous" && this.lastCommandTime > sinceTime;
    }
    // Get the last command received
    getLastCommand() {
        return {
            command: this.lastCommand,
            timestamp: this.lastCommandTime
        };
    }
    // Clear the last command (useful after processing a command)
    clearLastCommand() {
        this.lastCommand = "";
        this.lastCommandTime = 0;
    }
    // Handle incoming messages
    handleMessage(data) {
        try {
            // Parse the message data
            let messageData = data;
            // If data is a string, parse it as JSON
            if (typeof data === 'string') {
                messageData = JSON.parse(data);
            }
            // If data is a MessageEvent (from WebSocket), extract the data property
            else if (data && data.data) {
                const dataStr = data.data.toString();
                messageData = JSON.parse(dataStr);
            }
            log.d(`Processing message: ${JSON.stringify(messageData)}`);
            if (messageData.type === "command") {
                log.d(`Received command: ${messageData.command}`);
                // Process specific commands
                switch (messageData.command) {
                    case "next":
                        // Store the command and timestamp
                        this.lastCommand = "next";
                        this.lastCommandTime = Date.now() / 1000; // Convert to seconds
                        log.d("Received next command");
                        break;
                    case "previous":
                        // Store the command and timestamp
                        this.lastCommand = "previous";
                        this.lastCommandTime = Date.now() / 1000; // Convert to seconds
                        log.d("Received previous command");
                        break;
                    default:
                        log.d(`Unknown command: ${messageData.command}`);
                        break;
                }
            }
        }
        catch (error) {
            log.e(`Error processing message: ${error}`);
        }
    }
    // Start the reconnection process
    startReconnection() {
        if (this.isReconnecting) {
            return;
        }
        this.isReconnecting = true;
        this.reconnectAttempts = 0;
        this.reconnectTimer = this.reconnectInterval;
        log.d("Starting reconnection process");
        this.updateStatus("Reconnecting...");
    }
    // Attempt to reconnect to the WebSocket server
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            log.d("Maximum reconnection attempts reached");
            this.isReconnecting = false;
            this.updateStatus("Reconnection failed");
            return;
        }
        this.reconnectAttempts++;
        log.d(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.updateStatus(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
        // Set timer for next attempt if this one fails
        this.reconnectTimer = this.reconnectInterval;
    }
    // Update the status text
    updateStatus(status) {
        if (this.statusText) {
            this.statusText.text = status;
        }
    }
    __initialize() {
        super.__initialize();
        this.internetModule = require("LensStudio:InternetModule");
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.reconnectTimer = 0;
        this.isReconnecting = false;
        this.lastCommand = "";
        this.lastCommandTime = 0;
    }
};
exports.WebSocketController = WebSocketController;
exports.WebSocketController = WebSocketController = __decorate([
    component
], WebSocketController);
//# sourceMappingURL=WebSocketController.js.map