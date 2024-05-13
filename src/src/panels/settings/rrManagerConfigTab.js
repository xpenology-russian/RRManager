export default
    Ext.define("SYNOCOMMUNITY.RRManager.Setting.RrManagerConfigTab", {
        extend: "SYNO.SDS.Utils.FormPanel",
        constructor: function (e) {
            this.callParent([this.fillConfig(e)])
        },
        fillConfig: function (e) {
            this.suspendLcwPrompt = !1;
            const t = {
                title: "RR Manager Settings",
                items: [
                    new SYNO.ux.FieldSet({
                        title: 'RR Manager',
                        collapsible: true,
                        name: 'rrManager',
                        items: [
                            {
                                boxLabel: 'Check for updates on App Startup',
                                name: 'checkForUpdates',
                                xtype: 'syno_checkbox',
                            }
                        ]
                    })
                ]
            };
            return Ext.apply(t, e),
                t
        },
        initEvents: function () {
            this.mon(this, "activate", this.onActivate, this)
        },
        onActivate: function () {
        },
        loadForm: function (e) {
            this.getForm().setValues(e);
        },
        promptLcwDialog: function (e, t) {
            t && !this.suspendLcwPrompt && this.appWin.getMsgBox().show({
                title: this.title,
                msg: "ddd",
                buttons: {
                    yes: {
                        text: Ext.MessageBox.buttonText.yes,
                        btnStyle: "red"
                    },
                    no: {
                        text: Ext.MessageBox.buttonText.no
                    }
                },
                fn: function (e) {
                    "yes" !== e && this.form.findField("lcw_enabled").setValue(!1)
                },
                scope: this,
                icon: Ext.MessageBox.ERRORRED,
                minWidth: Ext.MessageBox.minWidth
            })
        }
    });