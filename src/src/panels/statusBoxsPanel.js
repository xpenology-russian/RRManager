export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.StatusBoxsPanel", {
        extend: "SYNO.ux.Panel",
        apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,
        constructor: function (e) {
            this.appWin = e.appWin;
            this.owner = e.owner;
            this.helper = e.owner.helper;
            this.data = {};
            this.apiProvider.init(this);
            this.callParent([this.fillConfig(e)]);
        },
        onDataReady: function (data) {
            this.loadData(data);
            Ext.each(this.statusBoxes, (e) => {
                e.fireEvent("data_ready");
            });

            this.owner.fireEvent("data_ready");
        },
        fillConfig: function (e) {
            const statusBoxConfig = { owner: this, appWin: e.appWin, flex: 1 };
            this.selectedBox = "hw_info";
            this.statusBoxes = [
                new SYNOCOMMUNITY.RRManager.Overview.StatusBox(
                    Ext.apply({
                        type: "hw_info", title: "HW Info", storeKey: "hwinfo_summ",
                        data: {
                            title: "HW Info",
                            icon: "🖥️",
                            text: this?.data?.systemInfoTxt ?? "--",
                            text2: this?.data?.systemInfoTxt ?? "--",
                            text3: this?.data?.systemInfoTxt ?? "--",
                            error: 0,
                            warning: 0,
                            healthy: 2,
                            type: "healthy"
                        }
                    }, statusBoxConfig)),
                new SYNO.ux.Panel({ width: 10 }),

                new SYNOCOMMUNITY.RRManager.Overview.StatusBox(
                    Ext.apply({
                        type: "rr_info", title: "RR version", storeKey: "rrinfo_summ",
                        data: {
                            title: "RR version",
                            icon: "💊",
                            text: "This is some long text RR",
                            version: this?.data?.rrVersion ?? "--",
                            error: 0,
                            warning: 0,
                            type: "healthy"
                        }
                    }, statusBoxConfig),
                ),
                new SYNO.ux.Panel({ width: 10 }),

                new SYNOCOMMUNITY.RRManager.Overview.StatusBox(
                    Ext.apply(
                        {
                            type: "rrm_info", title: "RR Manager", storeKey: "rrminfo_summ",
                            data: {
                                title: "RR Manager",
                                icon: "🛡️",
                                text: "This is some long text RR Manager",
                                version: this?.data?.rrManagerVersion ?? "--",
                                error: 0,
                                warning: 0,
                                type: "healthy"
                            }
                        }, statusBoxConfig)
                ),
            ];
            const panelConfig = {
                cls: "iscsi-overview-status-panel",
                layout: "hbox",
                layoutConfig: { align: "stretch" },
                items: this.statusBoxes,
                listeners: {
                    scope: this,
                    selectchange: this.onSelectChange,
                    data_ready: this.onDataReady,
                },
            };
            return Ext.apply(panelConfig, e), panelConfig;
        },
        onSelectChange: function (e) {
            console.log("--onSelectChange StatusBoxsPanel")
            // (this.clickedBox = e),
            //     Ext.each(this.statusBoxs, (e) => {
            //         e.fireEvent("update");
            //     }),
            //     this.owner.panels.detailPanel.fireEvent("select", e);
        },
        loadData: function (data) {
            const self = this;
            self.statusBoxes.forEach((statusBox) => {
                if (statusBox.tpl && statusBox.tpl.data) {
                    Ext.apply(statusBox.tpl.data, data);
                    statusBox.updateTpl();
                }
            });
        }
    });