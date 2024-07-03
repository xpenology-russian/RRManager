import terminalPanel from '../panels/terminal';

export default
    Ext.define("SYNOCOMMUNITY.RRManager.Ssh.Main", {
        extend: "SYNO.ux.Panel",
        helper: SYNOCOMMUNITY.RRManager.Helper,
        apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,
        formatString: function (str, ...args) {
            return str.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        },        
        constructor: function (e) {
            this.installed = false;
            this.appWin = e.appWin;
            this.loaded = false;
            this.callParent([this.fillConfig(e)]);
            this.mon(
                this,
                "data_ready",
                () => {
                    if (this.getActivePage)
                        this.getActivePage().fireEvent("data_ready");
                },
                this
            );
        },
        fillConfig: function (e) {
            this.panels = {
                rrConfigPanel: new SYNOCOMMUNITY.RRManager.TerminalPanel({
                    appWin: e.appWin,
                    owner: this,
                }),        
            };
            const t = {
                layoutConfig: { align: "stretch" },
                items: Object.values(this.panels),
                listeners: {
                    scope: this,
                    activate: this.onActivate,
                    deactivate: this.onDeactive,
                    data_ready: this.onDataReady,
                },
            };
            return Ext.apply(t, e), t;
        }, _getRrConfig: function () {
            const rrConfigJson = localStorage.getItem('rrConfig');
            return JSON.parse(rrConfigJson);
        },     
        onActivate: function () {
            const self = this;
            if (this.loaded) return;
            (async () => {
  
            })();            
        },      
        updateAllForm: async function () {
            this.owner.setStatusBusy();
            try {
                const rrConfig = await this.getConf();
                var configName = 'rrConfig';

                this.appWin[configName] = rrConfig;
                this[configName] = rrConfig;

                localStorage.setItem(configName, JSON.stringify(rrConfig));
            } catch (e) {
                SYNO.Debug(e);
            } finally {
                this.owner.clearStatusBusy();
            }
        },      
        onDeactive: function () {
            this.panels?.healthPanel?.fireEvent(
                "deactivate",
                this.panels?.healthPanel?.clickedBox
            );

        },
        onDataReady: async function () {
            const e = this;
            e.loaded = true;
            // need to clean the spinner when form has been loaded
            e.appWin.clearStatusBusy();
        },
        getActivateOverviewPanel: function () {
            if (this.getActiveTab()) {
                return this.getActiveTab().overviewPanel;
            }
            return null;
        },
    });