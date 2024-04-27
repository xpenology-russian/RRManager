export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.PasswordConfirmDialog", {
        extend: "SYNO.SDS.ModalWindow",
        constructor: function (a) {
            this.confirmPasswordHandler = a.confirmPasswordHandler;
            this.callParent([this.fillConfig(a)]);
        },
        fillConfig: function (a) {
            var b = {
                id: "confirm_password_dialog",
                width: 500,
                height: 200,
                resizable: false,
                layout: "fit",
                buttons: [
                    {
                        xtype: "syno_button",
                        text: _T("common", "alt_cancel"),
                        scope: this,
                        handler: function () {
                            Ext.getCmp("confirm_password_dialog").close();
                        },
                    },
                    {
                        xtype: "syno_button",
                        text: _T("common", "submit"),
                        btnStyle: "blue",
                        scope: this,
                        handler: this.onClickSubmit.bind(this),
                    },
                ],
                items: [
                    {
                        xtype: "syno_formpanel",
                        id: "password_form_panel",
                        bodyStyle: "padding: 0",
                        items: [
                            {
                                xtype: "syno_displayfield",
                                value: String.format(_T("common", "enter_user_password")),
                            },
                            {
                                xtype: "syno_textfield",
                                fieldLabel: _T("common", "password"),
                                textType: "password",
                                id: "confirm_password",
                            },
                        ],
                    },
                ]
            };
            Ext.apply(b, a);
            return b;
        },
        onClickSubmit: function () {
            const passwordValue = Ext.getCmp("confirm_password").getValue();
            Ext.getCmp("confirm_password_dialog").close();
            this.confirmPasswordHandler(passwordValue);
        }
    });