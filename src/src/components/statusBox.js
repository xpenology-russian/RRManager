export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.StatusBox", {
        extend: "SYNO.ux.Panel",
        constructor: function (e) {
            this.callParent([this.fillConfig(e)]);
        },
        fillConfig: function (e) {
            (this.appWin = e.appWin),
                (this.data = e.data),
                (this.tpl = new SYNOCOMMUNITY.RRManager.Overview.StatusBoxTmpl({
                    type: e.type,
                    title: e.title,
                    data: this.data,
                }));
            const t = {
                items: [
                    {
                        itemId: "statusBox",
                        xtype: "box",
                        cls: "iscsi-overview-statusbox-block",
                        html: "",
                    },
                ],
                data: this.data,
                listeners: {
                    scope: this,
                    afterrender: this.onAfterRender,
                    update: this.updateTpl,
                    data_ready: this.onDataReady,
                },
            };
            return Ext.apply(t, e), t;
        },
        onAfterRender: function () {
            this.mon(this.body, "click", this.onMouseClick, this);
        },
        updateTpl: function () {
            this.tpl.overwrite(
                this.getComponent("statusBox").getEl(),
                Ext.apply(
                    {
                        type: this.type,
                        clickType:
                            this.owner.clickedBox === this.type ? "click" : "unclick",
                        errorlevel: this.errorlevel,
                        total: this?.data?.icon,
                        error: 0,
                        warning: 0,
                    },
                    this.tpl.data
                )
            );
        },
        onMouseClick: function () {
            this.owner.fireEvent("selectchange", this.type);
        },
        processRRSummary: function () {
            const luns = [1, 2];
            Ext.each(luns, function (lun) {
                let status = "healthy";
                this.data[status]++;
            }, this);
        },
        //HW info
        processHWSummary: function () {
            const luns = [1, 2];
            Ext.each(luns, function (lun) {
                let status = "healthy";
                this.data[status]++;
            }, this);
        },
        processRRMSummary: function () {
            const luns = [1, 2];
            Ext.each(luns, function (lun) {
                let status = "healthy";
                this.data[status]++;
            }, this);
        },
        onDataReady: function () {
            this.data = { error: 0, warning: 0, healthy: 0 };
            Ext.apply(this.data, this.tpl.data);
            switch (this.storeKey) {
                case "hwinfo_summ":
                    this.processHWSummary();
                    break;
                case "rrinfo_summ":
                    this.processRRSummary();
                    break;
                case "rrminfo_summ":
                    this.processRRMSummary();
            }
            this.data.errorlevel = "healthy";
            this.updateTpl();
        },
    });