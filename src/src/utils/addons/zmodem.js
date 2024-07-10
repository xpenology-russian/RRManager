"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZmodemAddon = void 0;
const decko_1 = require("decko");
const file_saver_1 = require("file-saver");
const Zmodem = __importStar(require("zmodem.js/src/zmodem_browser"));
const trzsz_1 = require("trzsz");
class ZmodemAddon {
    constructor(options) {
        this.options = options;
        this.disposables = [];
    }
    activate(terminal) {
        this.terminal = terminal;
        if (this.options.zmodem)
            this.zmodemInit();
        if (this.options.trzsz)
            this.trzszInit();
    }
    dispose() {
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables.length = 0;
    }
    consume(data) {
        try {
            if (this.options.trzsz) {
                this.trzszFilter.processServerOutput(data);
            }
            else {
                this.sentry.consume(data);
            }
        }
        catch (e) {
            console.error('[ttyd] zmodem consume: ', e);
            this.reset();
        }
    }
    reset() {
        this.terminal.options.disableStdin = false;
        this.terminal.focus();
    }
    addDisposableListener(target, type, listener) {
        target.addEventListener(type, listener);
        this.disposables.push({ dispose: () => target.removeEventListener(type, listener) });
    }
    trzszInit() {
        const { terminal } = this;
        const { sender, writer, zmodem } = this.options;
        this.trzszFilter = new trzsz_1.TrzszFilter({
            writeToTerminal: data => {
                if (!this.trzszFilter.isTransferringFiles() && zmodem) {
                    this.sentry.consume(data);
                }
                else {
                    writer(typeof data === 'string' ? data : new Uint8Array(data));
                }
            },
            sendToServer: data => sender(data),
            terminalColumns: terminal.cols,
            isWindowsShell: this.options.windows,
            dragInitTimeout: this.options.trzszDragInitTimeout,
        });
        const element = terminal.element;
        this.addDisposableListener(element, 'dragover', event => event.preventDefault());
        this.addDisposableListener(element, 'drop', event => {
            var _a;
            event.preventDefault();
            this.trzszFilter
                .uploadFiles((_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.items)
                .then(() => console.log('[ttyd] upload success'))
                .catch(err => console.log('[ttyd] upload failed: ' + err));
        });
        this.disposables.push(terminal.onResize(size => this.trzszFilter.setTerminalColumns(size.cols)));
    }
    zmodemInit() {
        const { sender, writer } = this.options;
        const { terminal, reset, zmodemDetect } = this;
        this.session = null;
        this.sentry = new Zmodem.Sentry({
            to_terminal: octets => writer(new Uint8Array(octets)),
            sender: octets => sender(new Uint8Array(octets)),
            on_retract: () => reset(),
            on_detect: detection => zmodemDetect(detection),
        });
        this.disposables.push(terminal.onKey(e => {
            const event = e.domEvent;
            if (event.ctrlKey && event.key === 'c') {
                if (this.denier)
                    this.denier();
            }
        }));
    }
    zmodemDetect(detection) {
        const { terminal, receiveFile } = this;
        terminal.options.disableStdin = true;
        this.denier = () => detection.deny();
        this.session = detection.confirm();
        this.session.on('session_end', () => this.reset());
        if (this.session.type === 'send') {
            this.options.onSend();
        }
        else {
            receiveFile();
        }
    }
    sendFile(files) {
        const { session, writeProgress } = this;
        Zmodem.Browser.send_files(session, files, {
            on_progress: (_, offer) => writeProgress(offer),
        })
            .then(() => session.close())
            .catch(() => this.reset());
    }
    receiveFile() {
        const { session, writeProgress } = this;
        session.on('offer', offer => {
            offer.on('input', () => writeProgress(offer));
            offer
                .accept()
                .then(payloads => {
                const blob = new Blob(payloads, { type: 'application/octet-stream' });
                (0, file_saver_1.saveAs)(blob, offer.get_details().name);
            })
                .catch(() => this.reset());
        });
        session.start();
    }
    writeProgress(offer) {
        const { bytesHuman } = this;
        const file = offer.get_details();
        const name = file.name;
        const size = file.size;
        const offset = offer.get_offset();
        const percent = ((100 * offset) / size).toFixed(2);
        this.options.writer(`${name} ${percent}% ${bytesHuman(offset, 2)}/${bytesHuman(size, 2)}\r`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bytesHuman(bytes, precision) {
        if (!/^([-+])?|(\.\d+)(\d+(\.\d+)?|(\d+\.)|Infinity)$/.test(bytes)) {
            return '-';
        }
        if (bytes === 0)
            return '0';
        if (typeof precision === 'undefined')
            precision = 1;
        const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const num = Math.floor(Math.log(bytes) / Math.log(1024));
        const value = (bytes / Math.pow(1024, Math.floor(num))).toFixed(precision);
        return `${value} ${units[num]}`;
    }
}
__decorate([
    decko_1.bind
], ZmodemAddon.prototype, "reset", null);
__decorate([
    decko_1.bind
], ZmodemAddon.prototype, "trzszInit", null);
__decorate([
    decko_1.bind
], ZmodemAddon.prototype, "zmodemInit", null);
__decorate([
    decko_1.bind
], ZmodemAddon.prototype, "zmodemDetect", null);
__decorate([
    decko_1.bind
], ZmodemAddon.prototype, "sendFile", null);
__decorate([
    decko_1.bind
], ZmodemAddon.prototype, "receiveFile", null);
__decorate([
    decko_1.bind
], ZmodemAddon.prototype, "writeProgress", null);
exports.ZmodemAddon = ZmodemAddon;
//# sourceMappingURL=zmodem.js.map