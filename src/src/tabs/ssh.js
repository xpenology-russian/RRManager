import { Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { FitAddon } from '@xterm/addon-fit';
import { ImageAddon } from '@xterm/addon-image';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import { AttachAddon } from '@xterm/addon-attach';
import { Unicode11Addon } from '@xterm/addon-unicode11';

export default Ext.define('SYNOCOMMUNITY.RRManager.Ssh.Main', {
    extend: 'SYNO.ux.Panel',
    helper: SYNOCOMMUNITY.RRManager.Helper,
    apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,

    constructor: function (e) {
        this.installed = false;
        this.appWin = e.appWin;
        this.loaded = false;
        this.callParent([this.fillConfig(e)]);
        this.mon(
            this,
            'data_ready',
            () => {
                if (this.getActivePage) {
                    this.getActivePage().fireEvent('data_ready');
                }
            },
            this
        );
    },

    fillConfig: function (e) {
        const me = this;
        const cfg = {
            items: [
                {
                    xtype: 'container',
                    itemId: 'terminalContainer',
                    cls: 'terminal-container',
                    layout: 'fit',
                    style: {
                        width: '100%',
                        height: '100%'
                    }
                }
            ],
            listeners: {
                scope: me,
                afterrender: me.onAfterRender,
                resize: me.onResize
            },
            textEncoder: new TextEncoder(),
            textDecoder: new TextDecoder(),
        };
        return Ext.apply(cfg, e);
    },
    getOptions: function () {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const path = window.location.pathname.replace(/[/]+$/, '');
        debugger;
        const wsUrl = [protocol, '//', window.location.hostname,':7681', path, '/ws', window.location.search].join('');
        const tokenUrl = [window.location.protocol, '//', window.location.host, path, '/token'].join('');
        const clientOptions = {
            rendererType: 'webgl',
            disableLeaveAlert: false,
            disableResizeOverlay: false,
            enableZmodem: false,
            enableTrzsz: false,
            enableSixel: false,
            isWindows: false,
            unicodeVersion: '11',
        };
        const termOptions = {
            fontSize: 13,
            fontFamily: 'Consolas,Liberation Mono,Menlo,Courier,monospace',
            theme: {
                foreground: '#d2d2d2',
                background: '#2b2b2b',
                cursor: '#adadad',
                black: '#000000',
                red: '#d81e00',
                green: '#5ea702',
                yellow: '#cfae00',
                blue: '#427ab3',
                magenta: '#89658e',
                cyan: '#00a7aa',
                white: '#dbded8',
                brightBlack: '#686a66',
                brightRed: '#f54235',
                brightGreen: '#99e343',
                brightYellow: '#fdeb61',
                brightBlue: '#84b0d8',
                brightMagenta: '#bc94b7',
                brightCyan: '#37e6e8',
                brightWhite: '#f1f1f0',
            },
            allowProposedApi: true,
        };
        const flowControl = {
            limit: 100000,
            highWater: 10,
            lowWater: 4,
        };
        return {
            wsUrl,
            tokenUrl,
            clientOptions,
            termOptions,
            flowControl
        }
    },
    setRendererType: function (value) {
        const { terminal } = this;
        const disposeCanvasRenderer = () => {
            try {
                this.canvasAddon?.dispose();
            } catch {
                // ignore
            }
            this.canvasAddon = undefined;
        };
        const disposeWebglRenderer = () => {
            try {
                this.webglAddon?.dispose();
            } catch {
                // ignore
            }
            this.webglAddon = undefined;
        };
        const enableCanvasRenderer = () => {
            if (this.canvasAddon) return;
            this.canvasAddon = new CanvasAddon();
            disposeWebglRenderer();
            try {
                this.terminal.loadAddon(this.canvasAddon);
                console.log('[ttyd] canvas renderer loaded');
            } catch (e) {
                console.log('[ttyd] canvas renderer could not be loaded, falling back to dom renderer', e);
                disposeCanvasRenderer();
            }
        };
        const enableWebglRenderer = () => {
            if (this.webglAddon) return;
            this.webglAddon = new WebglAddon();
            disposeCanvasRenderer();
            try {
                this.webglAddon.onContextLoss(() => {
                    this.webglAddon?.dispose();
                });
                terminal.loadAddon(this.webglAddon);
                console.log('[ttyd] WebGL renderer loaded');
            } catch (e) {
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
    },
    applyPreferences(prefs) {
        const { terminal, fitAddon, register } = this;
        // if (prefs.enableZmodem || prefs.enableTrzsz) {
        //     this.zmodemAddon = new ZmodemAddon({
        //         zmodem: prefs.enableZmodem,
        //         trzsz: prefs.enableTrzsz,
        //         windows: prefs.isWindows,
        //         trzszDragInitTimeout: prefs.trzszDragInitTimeout,
        //         onSend: this.sendCb,
        //         sender: this.sendData,
        //         writer: this.writeData,
        //     });
        //     this.writeFunc = data => this.zmodemAddon?.consume(data);
        //     terminal.loadAddon(register(this.zmodemAddon));
        // }

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
                    if (value) console.log('[ttyd] Zmodem enabled');
                    break;
                case 'enableTrzsz':
                    if (value) console.log('[ttyd] trzsz enabled');
                    break;
                case 'trzszDragInitTimeout':
                    if (value) console.log(`[ttyd] trzsz drag init timeout: ${value}`);
                    break;
                case 'enableSixel':
                    if (value) {
                        terminal.loadAddon(register(new ImageAddon()));
                        console.log('[ttyd] Sixel enabled');
                    }
                    break;
                case 'titleFixed':
                    if (!value || value === '') return;
                    console.log(`[ttyd] setting fixed title: ${value}`);
                    this.titleFixed = value;
                    document.title = value;
                    break;
                case 'isWindows':
                    if (value) console.log('[ttyd] is windows');
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
                            terminal.loadAddon(new Unicode11Addon());
                            terminal.unicode.activeVersion = '11';
                            break;
                    }
                    break;
                default:
                    console.log(`[ttyd] option: ${key}=${JSON.stringify(value)}`);
                    if (terminal.options[key] instanceof Object) {
                        terminal.options[key] = Object.assign({}, terminal.options[key], value);
                    } else {
                        terminal.options[key] = value;
                    }
                    if (key.indexOf('font') === 0) fitAddon.fit();
                    break;
            }
        }
    },
    onSocketData(e) {
        self = this;

        const { textDecoder } = this;
        const i = e.data;
        const s = String.fromCharCode(new Uint8Array(i)[0]);
        const r = i.slice(1);
        switch (s) {
            case "0":
                this.writeFunc(r);
                break;
            case "1":
                this.title = textDecoder.decode(r);
                document.title = this.title;
                break;
            case "2":
                var payload = textDecoder.decode(r);
                if (payload && payload != "") {
                    this.applyPreferences({
                        ...self.options.clientOptions,
                        ...JSON.parse(payload)
                    });
                }
                break;
            default:
                console.warn(`[ttyd] unknown command: ${s}`);
        }
    },
    initListeners() {
        const me = this;
        // me.terminal.onTitleChange(data => {
        //     if (data && data !== '' && !this.titleFixed) {
        //         document.title = data + ' | ' + this.title;
        //     }
        // });
        me.terminal.onData(data => me.sendData(data));
        // me.terminal.onResize(({ cols, rows }) => {
        //     const msg = JSON.stringify({ columns: cols, rows: rows });
        //     this.socket?.send(this.textEncoder.encode(Command.RESIZE_TERMINAL + msg));
        //     if (this.resizeOverlay) overlayAddon.showOverlay(`${cols}x${rows}`, 300);
        // });
        me.socket.onmessage = e => me.onSocketData(e);
    },
    sendData(data) {
        me = this;
        const { socket, textEncoder } = this;
        if (socket?.readyState !== WebSocket.OPEN) return;

        if (typeof data === 'string') {
            const payload = new Uint8Array(data.length * 3 + 1);
            payload[0] = me.Command.INPUT.charCodeAt(0);
            const stats = textEncoder.encodeInto(data, payload.subarray(1));
            socket.send(payload.subarray(0, parseInt(stats.written) + 1));
        } else {
            const payload = new Uint8Array(data.length + 1);
            payload[0] = me.Command.INPUT.charCodeAt(0);
            payload.set(data, 1);
            me.socket.send(payload);
        }
    },
    Command: {
        // server side
        OUTPUT: '0',
        SET_WINDOW_TITLE: '1',
        SET_PREFERENCES: '2',

        // client side
        INPUT: '0',
        RESIZE_TERMINAL: '1',
        PAUSE: '2',
        RESUME: '3',
    },
    onAfterRender: function () {
        const me = this;
        Ext.defer(function () {
            const container = me.getComponent("terminalContainer");
            if (container) {
                const containerEl = container.getEl().dom;

                me.options = me.getOptions();
                // Initialize the xterm Terminal
                me.terminal = new Terminal(
                    me.options.termOptions
                );

                // Initialize the fit addon
                me.fitAddon = new FitAddon();
                me.terminal.loadAddon(me.fitAddon);

                me.webLinksAddon = new WebLinksAddon();
                me.terminal.loadAddon(me.webLinksAddon);

                me.imageAddon = new ImageAddon();
                me.terminal.loadAddon(me.imageAddon);

                me.webglAddon = new WebglAddon();
                me.terminal.loadAddon(me.webglAddon);

                me.canvasAddon = new CanvasAddon();
                me.terminal.loadAddon(me.canvasAddon);

                // Initialize WebSocket and AttachAddon
                me.socket = new WebSocket(me.options.wsUrl, ["tty"]);
                me.attachAddon = new AttachAddon(me.socket);
                me.terminal.loadAddon(me.attachAddon);

                me.terminal.open(containerEl);
                me.initListeners();

                // Optional: You can add some initial content to the terminal
                me.terminal.write('Connectiong to host....\r\n');
                // Adjust terminal size to fit the container
                me.resizeTerminal();

            } else {
                console.error('Terminal container not found');
            }
        }, 50);
    },
    onResize: function () {
        this.resizeTerminal();
    },
    resizeTerminal: function () {
        const me = this;
        if (me.terminal && me.fitAddon) {
            const containerEl = me.getEl().dom;
            const width = containerEl.clientWidth;
            const height = containerEl.clientHeight;

            // Calculate new cols and rows based on the container size
            const cols = Math.floor(width / me.terminal._core._renderService.dimensions.device.cell.width);
            const rows = Math.floor(height / me.terminal._core._renderService.dimensions.device.cell.width);
            if (cols && rows) {
                me.terminal.resize(cols, rows);
            }
        }
    },
    onActivate: function () {
        const self = this;
        if (this.loaded) return;

        (async () => {
            // Your async code here
        })();
    },

    updateAllForm: async function () {
        this.owner.setStatusBusy();
        try {
            const rrConfig = await this.getConf();
            const configName = 'rrConfig';

            this.appWin[configName] = rrConfig;
            this[configName] = rrConfig;

            localStorage.setItem(configName, JSON.stringify(rrConfig));
        } catch (e) {
            SYNO.Debug(e);
        } finally {
            this.owner.clearStatusBusy();
        }
    },

    onDeactivate: function () {
        this.panels?.healthPanel?.fireEvent(
            'deactivate',
            this.panels?.healthPanel?.clickedBox
        );
    },

    onDataReady: async function () {
        const e = this;
        e.loaded = true;
        e.appWin.clearStatusBusy();
    },

    getActivateOverviewPanel: function () {
        if (this.getActiveTab()) {
            return this.getActiveTab().overviewPanel;
        }
        return null;
    }
});
