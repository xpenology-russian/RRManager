import helper from './utils/updateWizardHelper';
import SynoApiProvider from './utils/synoApiProvider';
// Namespace definition
Ext.ns('SYNOCOMMUNITY.RRManager');
export default
    // Window definition
    Ext.define('SYNOCOMMUNITY.RRManager.AppWindow', {
        helper: SYNOCOMMUNITY.RRManager.Helper,
        apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,
        formatString: function (str, ...args) {
            return str.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        },
        extend: "SYNO.SDS.PageListAppWindow",
        activePage: "SYNOCOMMUNITY.RRManager.Overview.Main",
        defaultWinSize: { width: 1160, height: 620 },
        constructor: function (config) {
            const t = this;
            this.apiProvider.init(this.sendWebAPI.bind(this));
            t.callParent([t.fillConfig(config)]);           
        },
        fillConfig: function (e) {
            let tabs = this.getListItems();
            const i = {
                cls: "syno-app-iscsi",
                width: this.defaultWinSize.width,
                height: this.defaultWinSize.height,
                minWidth: this.defaultWinSize.width,
                minHeight: this.defaultWinSize.height,
                activePage: "SYNOCOMMUNITY.RRManager.Overview.Main",
                listItems: tabs,
            };
            return Ext.apply(i, e), i;

        },
        getListItems: function () {
            let items = [
                {
                    text: this.helper.V('ui', 'tab_general'),
                    iconCls: "icon-rr-overview",
                    fn: "SYNOCOMMUNITY.RRManager.Overview.Main",
                },
                {
                    text: this.helper.V('ui', 'tab_addons'),
                    iconCls: "icon-rr-addons",
                    fn: "SYNOCOMMUNITY.RRManager.Addons.Main",
                },
                {
                    text: this.helper.V('ui', 'tab_debug'),
                    iconCls: "icon-debug",
                    fn: "SYNOCOMMUNITY.RRManager.Debug.Main",
                },
                {
                    text: 'Console',
                    iconCls: "icon-terminal-and-SNMP",
                    fn: "SYNOCOMMUNITY.RRManager.Ssh.Main",
                },
                {
                    text: this.helper.V('ui', 'tab_configuration'),
                    iconCls: "icon-rr-setting",
                    fn: "SYNOCOMMUNITY.RRManager.Setting.Main",
                }
            ];
            // // Fetch conditionally add a tab if `ttydPackage` is available
            // this.apiProvider.getPackagesList().then((response) => {
            //     let ttydPackage = response.packages.find((pkg) => pkg.id === 'TTYD');
            //     if (ttydPackage) {
            //         let newTab = {
            //             text: "Console",
            //             iconCls: "icon-terminal-and-SNMP",
            //             fn: "SYNOCOMMUNITY.RRManager.Ssh.Main",
            //         };

            //         // Check if the tab already exists to prevent duplicates
            //         if (!items.find(tab => tab.fn === newTab.fn)) {
            //             items.push(newTab);
            //         }
            //     }
            //     return items;
            // });
            return items;
        },
        onOpen: function (a) {
            const t = this;
            t.mon(t.getPageList().getSelectionModel(), "selectionchange", t.onSelectionModelChange, t);
            SYNOCOMMUNITY.RRManager.AppWindow.superclass.onOpen.call(this, a);
        },
        onDestroy: function (e) {
            //this.apiProvider.runScheduledTask('UnMountLoaderDisk');
            SYNOCOMMUNITY.RRManager.AppWindow.superclass.onDestroy.call(this);
        },
        onSelectionModelChange: function () {
            const e = this
                , t = e.getActivePage();
            t && ("SYNOCOMMUNITY.RRManager.Overview.Main" === t.itemId ? e.getPageCt().addClass("iscsi-overview-panel") : e.getPageCt().removeClass("iscsi-overview-panel"));
        },
    });