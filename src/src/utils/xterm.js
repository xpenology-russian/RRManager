"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Xterm = void 0;
const decko_1 = require("decko");
const xterm_1 = require("@xterm/xterm");
const addon_canvas_1 = require("@xterm/addon-canvas");
const addon_webgl_1 = require("@xterm/addon-webgl");
const addon_fit_1 = require("@xterm/addon-fit");
const addon_web_links_1 = require("@xterm/addon-web-links");
const addon_image_1 = require("@xterm/addon-image");
const addon_unicode11_1 = require("@xterm/addon-unicode11");
const overlay_1 = require("./addons/overlay");
const zmodem_1 = require("./addons/zmodem");
// require("@xterm/xterm/css/xterm.css");
var Command;
(function (Command) {
    // server side
    Command["OUTPUT"] = "0";
    Command["SET_WINDOW_TITLE"] = "1";
    Command["SET_PREFERENCES"] = "2";
    // client side
    Command["INPUT"] = "0";
    Command["RESIZE_TERMINAL"] = "1";
    Command["PAUSE"] = "2";
    Command["RESUME"] = "3";
})(Command || (Command = {}));
function toDisposable(f) {
    return { dispose: f };
}
function addEventListener(target, type, listener) {
    target.addEventListener(type, listener);
    return toDisposable(() => target.removeEventListener(type, listener));
}
class Xterm {
    constructor(options, sendCb) {
        this.options = options;
        this.sendCb = sendCb;
        this.disposables = [];
        this.textEncoder = new TextEncoder();
        this.textDecoder = new TextDecoder();
        this.written = 0;
        this.pending = 0;
        this.fitAddon = new addon_fit_1.FitAddon();
        this.overlayAddon = new overlay_1.OverlayAddon();
        this.opened = false;
        this.resizeOverlay = true;
        this.reconnect = true;
        this.doReconnect = true;
        this.writeFunc = (data) => this.writeData(new Uint8Array(data));
    }
    dispose() {
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables.length = 0;
    }
    register(d) {
        this.disposables.push(d);
        return d;
    }
    sendFile(files) {
        var _a;
        (_a = this.zmodemAddon) === null || _a === void 0 ? void 0 : _a.sendFile(files);
    }
    async refreshToken() {
        try {
            //TODO: fix refresh token
            const resp = await fetch(this.options.tokenUrl,{
                  headers: {
                    'Authorization': 'Basic ' +'',
                  }
            });
            if (resp.ok) {
                const json = await resp.json();
                this.token = json.token;
            }
        }
        catch (e) {
            console.error(`[ttyd] fetch ${this.options.tokenUrl}: `, e);
        }
    }
    onWindowUnload(event) {
        var _a;
        event.preventDefault();
        if (((_a = this.socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            const message = 'Close terminal? this will also terminate the command.';
            event.returnValue = message;
            return message;
        }
        return undefined;
    }
    open(parent) {
        this.terminal = new xterm_1.Terminal(this.options.termOptions);
        const { terminal, fitAddon, overlayAddon } = this;
        window.term = terminal;
        window.term.fit = () => {
            this.fitAddon.fit();
        };
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(overlayAddon);
        terminal.loadAddon(new addon_web_links_1.WebLinksAddon());
        terminal.open(parent);
        fitAddon.fit();
    }
    initListeners() {
        const { terminal, fitAddon, overlayAddon, register, sendData } = this;
        // register(terminal.onTitleChange(data => {
        //     if (data && data !== '' && !this.titleFixed) {
        //         document.title = data + ' | ' + this.title;
        //     }
        // }));
        register(terminal.onData(data => sendData(data)));
        register(terminal.onBinary(data => sendData(Uint8Array.from(data, v => v.charCodeAt(0)))));
        register(terminal.onResize(({ cols, rows }) => {
            var _a;
            const msg = JSON.stringify({ columns: cols, rows: rows });
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(this.textEncoder.encode(Command.RESIZE_TERMINAL + msg));
            if (this.resizeOverlay)
                overlayAddon.showOverlay(`${cols}x${rows}`, 300);
        }));
        register(terminal.onSelectionChange(() => {
            var _a;
            if (this.terminal.getSelection() === '')
                return;
            try {
                document.execCommand('copy');
            }
            catch (e) {
                return;
            }
            (_a = this.overlayAddon) === null || _a === void 0 ? void 0 : _a.showOverlay('\u2702', 200);
        }));
        register(addEventListener(window, 'resize', () => fitAddon.fit()));
        register(addEventListener(window, 'beforeunload', this.onWindowUnload));
    }
    writeData(data) {
        var _a;
        const { terminal, textEncoder } = this;
        const { limit, highWater, lowWater } = this.options.flowControl;
        this.written += data.length;
        if (this.written > limit) {
            terminal.write(data, () => {
                var _a;
                this.pending = Math.max(this.pending - 1, 0);
                if (this.pending < lowWater) {
                    (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(textEncoder.encode(Command.RESUME));
                }
            });
            this.pending++;
            this.written = 0;
            if (this.pending > highWater) {
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(textEncoder.encode(Command.PAUSE));
            }
        }
        else {
            terminal.write(data);
        }
    }
    sendData(data) {
        const { socket, textEncoder } = this;
        if ((socket === null || socket === void 0 ? void 0 : socket.readyState) !== WebSocket.OPEN)
            return;
        if (typeof data === 'string') {
            const payload = new Uint8Array(data.length * 3 + 1);
            payload[0] = Command.INPUT.charCodeAt(0);
            const stats = textEncoder.encodeInto(data, payload.subarray(1));
            socket.send(payload.subarray(0, stats.written + 1));
        }
        else {
            const payload = new Uint8Array(data.length + 1);
            payload[0] = Command.INPUT.charCodeAt(0);
            payload.set(data, 1);
            socket.send(payload);
        }
    }
    connect() {
        this.socket = new WebSocket(this.options.wsUrl, ['tty']);
        const { socket, register } = this;
        socket.binaryType = 'arraybuffer';
        register(addEventListener(socket, 'open', this.onSocketOpen));
        register(addEventListener(socket, 'message', this.onSocketData));
        register(addEventListener(socket, 'close', this.onSocketClose));
        register(addEventListener(socket, 'error', () => (this.doReconnect = false)));
    }
    onSocketOpen() {
        var _a;
        console.log('[ttyd] websocket connection opened');
        const { textEncoder, terminal, overlayAddon } = this;
        const msg = JSON.stringify({ AuthToken: this.token, columns: terminal.cols, rows: terminal.rows });
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(textEncoder.encode(msg));
        if (this.opened) {
            terminal.reset();
            terminal.options.disableStdin = false;
            overlayAddon.showOverlay('Reconnected', 300);
        }
        else {
            this.opened = true;
        }
        this.doReconnect = this.reconnect;
        this.initListeners();
        terminal.focus();
    }
    onSocketClose(event) {
        console.log(`[ttyd] websocket connection closed with code: ${event.code}`);
        const { refreshToken, connect, doReconnect, overlayAddon } = this;
        overlayAddon.showOverlay('Connection Closed');
        this.dispose();
        // 1000: CLOSE_NORMAL
        if (event.code !== 1000 && doReconnect) {
            overlayAddon.showOverlay('Reconnecting...');
            refreshToken().then(connect);
        }
        else {
            const { terminal } = this;
            const keyDispose = terminal.onKey(e => {
                const event = e.domEvent;
                if (event.key === 'Enter') {
                    keyDispose.dispose();
                    overlayAddon.showOverlay('Reconnecting...');
                    refreshToken().then(connect);
                }
            });
            overlayAddon.showOverlay('Press ⏎ to Reconnect');
        }
    }
    parseOptsFromUrlQuery(query) {
        const { terminal } = this;
        const { clientOptions } = this.options;
        const prefs = {};
        const queryObj = Array.from(new URLSearchParams(query));
        for (const [k, queryVal] of queryObj) {
            let v = clientOptions[k];
            if (v === undefined)
                v = terminal.options[k];
            switch (typeof v) {
                case 'boolean':
                    prefs[k] = queryVal === 'true' || queryVal === '1';
                    break;
                case 'number':
                case 'bigint':
                    prefs[k] = Number.parseInt(queryVal, 10);
                    break;
                case 'string':
                    prefs[k] = queryVal;
                    break;
                case 'object':
                    prefs[k] = JSON.parse(queryVal);
                    break;
                default:
                    console.warn(`[ttyd] maybe unknown option: ${k}=${queryVal}, treating as string`);
                    prefs[k] = queryVal;
                    break;
            }
        }
        return prefs;
    }
    onSocketData(event) {
        const { textDecoder } = this;
        const rawData = event.data;
        const cmd = String.fromCharCode(new Uint8Array(rawData)[0]);
        const data = rawData.slice(1);
        switch (cmd) {
            case Command.OUTPUT:
                this.writeFunc(data);
                break;
            case Command.SET_WINDOW_TITLE:
                this.title = textDecoder.decode(data);
                document.title = this.title;
                break;
            case Command.SET_PREFERENCES:
                this.applyPreferences({
                    ...this.options.clientOptions,
                    ...JSON.parse(textDecoder.decode(data)),
                    ...this.parseOptsFromUrlQuery(window.location.search),
                });
                break;
            default:
                console.warn(`[ttyd] unknown command: ${cmd}`);
                break;
        }
    }
    applyPreferences(prefs) {
        const { terminal, fitAddon, register } = this;
        if (prefs.enableZmodem || prefs.enableTrzsz) {
            this.zmodemAddon = new zmodem_1.ZmodemAddon({
                zmodem: prefs.enableZmodem,
                trzsz: prefs.enableTrzsz,
                windows: prefs.isWindows,
                trzszDragInitTimeout: prefs.trzszDragInitTimeout,
                onSend: this.sendCb,
                sender: this.sendData,
                writer: this.writeData,
            });
            this.writeFunc = data => { var _a; return (_a = this.zmodemAddon) === null || _a === void 0 ? void 0 : _a.consume(data); };
            terminal.loadAddon(register(this.zmodemAddon));
        }
        for (const [key, value] of Object.entries(prefs)) {
            switch (key) {
                case 'rendererType':
                    this.setRendererType(value);
                    break;
                case 'disableLeaveAlert':
                    if (value) {
                        window.removeEventListener('beforeunload', this.onWindowUnload);
                        console.log('[ttyd] Leave site alert disabled');
                    }
                    break;
                case 'disableResizeOverlay':
                    if (value) {
                        console.log('[ttyd] Resize overlay disabled');
                        this.resizeOverlay = false;
                    }
                    break;
                case 'disableReconnect':
                    if (value) {
                        console.log('[ttyd] Reconnect disabled');
                        this.reconnect = false;
                        this.doReconnect = false;
                    }
                    break;
                case 'enableZmodem':
                    if (value)
                        console.log('[ttyd] Zmodem enabled');
                    break;
                case 'enableTrzsz':
                    if (value)
                        console.log('[ttyd] trzsz enabled');
                    break;
                case 'trzszDragInitTimeout':
                    if (value)
                        console.log(`[ttyd] trzsz drag init timeout: ${value}`);
                    break;
                case 'enableSixel':
                    if (value) {
                        terminal.loadAddon(register(new addon_image_1.ImageAddon()));
                        console.log('[ttyd] Sixel enabled');
                    }
                    break;
                case 'titleFixed':
                    if (!value || value === '')
                        return;
                    console.log(`[ttyd] setting fixed title: ${value}`);
                    this.titleFixed = value;
                    document.title = value;
                    break;
                case 'isWindows':
                    if (value)
                        console.log('[ttyd] is windows');
                    break;
                case 'unicodeVersion':
                    switch (value) {
                        case 6:
                        case '6':
                            console.log('[ttyd] setting Unicode version: 6');
                            break;
                        case 11:
                        case '11':
                        default:
                            console.log('[ttyd] setting Unicode version: 11');
                            terminal.loadAddon(new addon_unicode11_1.Unicode11Addon());
                            terminal.unicode.activeVersion = '11';
                            break;
                    }
                    break;
                default:
                    console.log(`[ttyd] option: ${key}=${JSON.stringify(value)}`);
                    if (terminal.options[key] instanceof Object) {
                        terminal.options[key] = Object.assign({}, terminal.options[key], value);
                    }
                    else {
                        terminal.options[key] = value;
                    }
                    if (key.indexOf('font') === 0)
                        fitAddon.fit();
                    break;
            }
        }
    }
    setRendererType(value) {
        const { terminal } = this;
        const disposeCanvasRenderer = () => {
            var _a;
            try {
                (_a = this.canvasAddon) === null || _a === void 0 ? void 0 : _a.dispose();
            }
            catch (_b) {
                // ignore
            }
            this.canvasAddon = undefined;
        };
        const disposeWebglRenderer = () => {
            var _a;
            try {
                (_a = this.webglAddon) === null || _a === void 0 ? void 0 : _a.dispose();
            }
            catch (_b) {
                // ignore
            }
            this.webglAddon = undefined;
        };
        const enableCanvasRenderer = () => {
            if (this.canvasAddon)
                return;
            this.canvasAddon = new addon_canvas_1.CanvasAddon();
            disposeWebglRenderer();
            try {
                this.terminal.loadAddon(this.canvasAddon);
                console.log('[ttyd] canvas renderer loaded');
            }
            catch (e) {
                console.log('[ttyd] canvas renderer could not be loaded, falling back to dom renderer', e);
                disposeCanvasRenderer();
            }
        };
        const enableWebglRenderer = () => {
            if (this.webglAddon)
                return;
            this.webglAddon = new addon_webgl_1.WebglAddon();
            disposeCanvasRenderer();
            try {
                this.webglAddon.onContextLoss(() => {
                    var _a;
                    (_a = this.webglAddon) === null || _a === void 0 ? void 0 : _a.dispose();
                });
                terminal.loadAddon(this.webglAddon);
                console.log('[ttyd] WebGL renderer loaded');
            }
            catch (e) {
                console.log('[ttyd] WebGL renderer could not be loaded, falling back to canvas renderer', e);
                disposeWebglRenderer();
                enableCanvasRenderer();
            }
        };
        switch (value) {
            case 'canvas':
                enableCanvasRenderer();
                break;
            case 'webgl':
                enableWebglRenderer();
                break;
            case 'dom':
                disposeWebglRenderer();
                disposeCanvasRenderer();
                console.log('[ttyd] dom renderer loaded');
                break;
            default:
                break;
        }
    }
}
__decorate([
    decko_1.bind
], Xterm.prototype, "register", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "sendFile", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "refreshToken", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "onWindowUnload", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "open", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "initListeners", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "writeData", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "sendData", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "connect", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "onSocketOpen", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "onSocketClose", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "parseOptsFromUrlQuery", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "onSocketData", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "applyPreferences", null);
__decorate([
    decko_1.bind
], Xterm.prototype, "setRendererType", null);
exports.Xterm = Xterm;
//# sourceMappingURL=index.js.map