import { iframePanel } from '../components/iframePanel';
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
            layout: 'fit',
            width: '100%',
            autoHeight: true,
            items: [
                new SYNOCOMMUNITY.RRManager.IframePanel({
                    iframeSrc: document.location.origin + '/ttyd',
                }),
            ],            
            listeners: {
                scope: me,
                afterrender: me.onAfterRender,
                resize: me.onResize
            },

        };
        return Ext.apply(cfg, e);
    },
    getOptions: function () {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const path = window.location.pathname.replace(/[/]+$/, '');
        const wsUrl = [protocol, '//', window.location.hostname, ':7681', path, '/ws', window.location.search].join('');
        const tokenUrl = [window.location.protocol, '//', window.location.hostname, , ':7681', '/token'].join('');
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
    onAfterRender: function () {
        const me = this;
        // Ext.defer(function () {
        //     const container = me.getComponent("terminalContainer");
        //     if (container) {
        //         const containerEl = container.getEl().dom;
        //         me.options = me.getOptions();
        //         me.xterm = new Xterm(me.options);
        //         me.xterm.refreshToken();
        //         me.xterm.open(containerEl);
        //         me.xterm.connect();
        //         // // Adjust terminal size to fit the container
        //         me.resizeTerminal();

        //     } else {
        //         console.error('Terminal container not found');
        //     }
        // }, 50);
    },
    onResize: function () {
        this.resizeTerminal();
    },
    resizeTerminal: function () {
        const me = this;
        if (me.xterm) {
            const containerEl = me.getEl().dom;
            const width = containerEl.clientWidth;
            const height = containerEl.clientHeight;

            // Calculate new cols and rows based on the container size
            const cols = Math.floor(width / me.xterm.terminal._core._renderService.dimensions.device.cell.width);
            const rows = Math.floor(height / me.xterm.terminal._core._renderService.dimensions.device.cell.height);
            if (cols && rows) {
                me.xterm.terminal.resize(cols, rows);
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
