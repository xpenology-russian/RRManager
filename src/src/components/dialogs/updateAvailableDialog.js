
export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.UpdateAvailableDialog", {
        extend: "SYNO.SDS.ModalWindow",
        helper: SYNOCOMMUNITY.RRManager.UpdateWizard.Helper,
        constructor: function (a) {
            this.callParent([this.fillConfig(a)]);
        },
        fillConfig: function (a) {
            this.panel = this.createPanel(a);
            this.btnBar = this.createBtnBar(a);
            var c = (a.initHeight || 250) + 200 * (a.msgItemCount || 0);
            var b = {
                cls: "vmm-modal-window",
                width: a.width || 650,
                height: Math.min(c, 650),
                border: false,
                resizable: false,
                layout: "fit",
                items: this.panel,
                fbar: this.btnBar,
            };
            Ext.apply(b, a);
            return b;
        },
        createBtnBar: function (a) {
            if (a.confirmCheck) {
                return {
                    xtype: "toolbar",
                    buttonAlign: "right",
                    cls: "normal-toolbar",
                    items: [
                        {
                            xtype: "syno_button",
                            btnStyle: "grey",
                            text: this.helper.T("common", "cancel"),
                            scope: this,
                            handler: this.close,
                        },
                        {
                            xtype: "syno_button",
                            btnStyle: "red",
                            text: this.helper.T("common", "ok"),
                            scope: this,
                            width: 134,
                            handler: this.onOKClick,
                        },
                    ],
                };
            } else {
                return {
                    xtype: "toolbar",
                    buttonAlign: "center",
                    cls: "center-toolbar",
                    items: [
                        {
                            xtype: "syno_button",
                            btnStyle: "blue",
                            text: this.helper.T("common", "ok"),
                            scope: this,
                            width: 134,
                            handler: this.onOKClick,
                        },
                    ],
                };
            }
        },
        createPanel: function (a) {
            return new SYNO.ux.Panel({
                width: a.width ? a.width : 650,
                items: [
                    {
                        xtype: "label",
                        autoHeight: true,
                        id: (this.msgId = Ext.id()),
                        indent: 1,
                        style: "line-height: 25px;",
                        html: a.message,
                    },
                    {
                        // Display the changelog in a scrollable view
                        xtype: 'box',
                        autoEl: { tag: 'div', html: a.msg.replace(/\n/g, '<br>') },
                        style: 'margin: 10px; overflow-y: auto; border: 1px solid #ccc; padding: 5px;',
                        height: '75%', // Fixed height for the scrollable area
                        anchor: '100%'
                    },{
                        xtype: "syno_checkbox",
                        id: "confirmCheck",
                        boxLabel: this.helper.V("update_available_dialog", "checkbox_dont_show_again"),
                        checked: false,
                        hidden: !a.confirmCheck,
                        indent: 1,
                        style: "line-height: 25px;"
                    }      
                ],
            });
        },
        onOKClick: function () {
            if (this.btnOKHandler) {
                this.btnOKHandler();
            }
            this.close();
        },
    });