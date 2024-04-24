import synoApiProvider from "../utils/synoApiProvider";
export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.HealthPanel", {
        extend: "SYNO.ux.Panel",
        helper: SYNOCOMMUNITY.RRManager.UpdateWizard.Helper,
        apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,
        constructor: function (e) {
            this.appWin = e.appWin;
            this.owner = e.owner;
            this.apiProvider.init(this);
            this.callParent([this.fillConfig(e)]);
        },
        onDataReady: function () {
            let status = "normal";
            this.iconTemplate.overwrite(this.getComponent("icon").getEl(), { status: status }),
                this.titleTemplate.overwrite(this.upperPanel.getComponent("title").getEl(), {
                    status: status,
                }),
                this.updateDescription("current");
            this.getComponent("rrActionsPanel")?.setVisible(true);
            this.owner.fireEvent("data_ready");
        },
        createUploadPannel: function () {
            var myFormPanel = new Ext.form.FormPanel({
                title: this.helper.V("ui", "lb_select_update_file"),
                fileUpload: true,
                name: 'upload_form',
                border: !1,
                bodyPadding: 10,
                items: [{
                    xtype: 'syno_filebutton',
                    text: this.helper.V('ui', 'select_file'),
                    name: 'filename',
                    allowBlank: false,
                }],
            });
            this["upload_form"] = myFormPanel;
            return myFormPanel;
        },
        showMsg: function (msg) {
            //TODO: use native alerts
            alert(msg);
        },

        createActionsSection: function () {
            return new SYNO.ux.FieldSet({
                title: this.helper.V('ui', 'section_rr_actions'),
                items: [
                    {
                        xtype: 'syno_panel',
                        // cls: 'panel-with-border',
                        activeTab: 0,
                        plain: true,
                        items: [
                            {
                                xtype: 'syno_compositefield',
                                hideLabel: true,
                                items: [{
                                    xtype: 'syno_displayfield',
                                    value: this.helper.V('ui', 'run_update'),
                                    width: 140
                                },
                                {
                                    xtype: 'syno_button',
                                    btnStyle: 'green',
                                    text: "New Upload Update",
                                    handler: this.showUpdateUploadWizard.bind(this)
                                }]
                            },
                        ],
                        deferredRender: true
                    },
                ]
            });
        },
        tabType: "zip",
        showUpdateUploadWizard: function () {
            var a = new SYNOCOMMUNITY.RRManager.UpdateWizard.Wizard({
                owner: this.appWin,
                //TODO: use localized text
                title: "Add Update*.zip file",
                imageType: this.tabType,
                pollingWindow: this.owner,
                records: {
                    data: {
                        items: []
                    }
                } //this.overviewPanel.store,
            });
            a.open();
        },
        fillConfig: function (e) {
            this.poolLinkId = Ext.id();
            this.iconTemplate = this.createIconTpl();
            this.titleTemplate = this.createTitleTpl();
            this.upperPanel = this.createUpperPanel();
            this.lowerPanel = this.createLowerPanel();

            this.descriptionMapping = {
                normal: this.helper.V('ui', 'greetings_text'),
                target_abnormal: []
            };

            const panelConfig = {
                layout: "hbox",
                cls: "iscsi-overview-health-panel",
                autoHeight: true,
                items: [
                    { xtype: "box", itemId: "icon", cls: "health-icon-block" },
                    {
                        xtype: "syno_panel",
                        itemId: "rightPanel",
                        cls: "health-text-block",
                        flex: 1,
                        height: 180,
                        layout: "vbox",
                        layoutConfig: { align: "stretch" },
                        items: [this.upperPanel, this.lowerPanel],
                    },
                    {
                        xtype: "syno_panel",
                        itemId: "rrActionsPanel",
                        flex: 1,
                        height: 96,
                        hidden: true,
                        layout: "vbox",
                        layoutConfig: { align: "stretch" },
                        items: [this.createActionsSection()],
                    },
                ],
                listeners: { scope: this, data_ready: this.onDataReady },
            };
            return Ext.apply(panelConfig, e), panelConfig;

        },
        createIconTpl: function () {
            return new Ext.XTemplate('<div class="health-icon {status}"></div>', {
                compiled: !0,
                disableFormats: !0,
            });
        },
        createTitleTpl: function () {
            return new Ext.XTemplate(
                '<div class="health-text-title {status}">{[this.getStatusText(values.status)]}</div>',
                {
                    compiled: !0,
                    disableFormats: !0,
                    statusText: {
                        normal: "Healthy",
                        warning: "Warning",
                        error: "Error"
                    },
                    getStatusText: function (e) {
                        return this.statusText[e];
                    },
                }
            );
        },
        createUpperPanel: function () {
            return new SYNO.ux.Panel({
                layout: "hbox",
                items: [
                    {
                        xtype: "box",
                        itemId: "title",
                        flex: 1,
                        cls: "iscsi-overview-health-title-block",
                    },
                    {
                        xtype: "syno_button",
                        itemId: "leftBtn",
                        hidden: !0,
                        cls: "iscsi-overview-health-prev-btn",
                        scope: this,
                        handler: this.onLeftBtnClick,
                        text: " ",
                    },
                    {
                        xtype: "syno_button",
                        itemId: "rightBtn",
                        hidden: !0,
                        cls: "iscsi-overview-health-next-btn",
                        scope: this,
                        handler: this.onRightBtnClick,
                        text: " ",
                    },
                ],
            });
        },
        createLowerPanel: function () {
            return new SYNO.ux.Panel({
                flex: 1,
                items: [
                    {
                        xtype: "syno_displayfield",
                        itemId: "desc",
                        cls: "health-text-content",
                        htmlEncode: !1,
                    },
                    {
                        xtype: "syno_displayfield",
                        itemId: "desc2",
                        cls: "health-text-content",
                        htmlEncode: !1,
                    },
                    {
                        xtype: "syno_displayfield",
                        itemId: "desc3",
                        cls: "health-text-content",
                        htmlEncode: !1,
                    },
                ],
            });
        },
        updateDescription: function (status) {
            const self = this;
            this.descriptions = [];
            let description,
                statusDescription,
                index = -1;
            const
                descriptionCount = this.descriptions.length,
                rightPanel = this.getComponent("rightPanel"),
                descriptionField = this.lowerPanel.getComponent("desc"),
                versionField = this.lowerPanel.getComponent("desc3"),
                rrVersionField = this.lowerPanel.getComponent("desc2"),
                leftButton = this.upperPanel.getComponent("leftBtn"),
                rightButton = this.upperPanel.getComponent("rightBtn"),
                initialHeight = descriptionField.getHeight();
            let panelHeight = rightPanel.getHeight(),
                isHeightChanged = false;
            statusDescription = this.descriptionMapping.normal;
            descriptionField.setValue(self.owner.systemInfoTxt);
            versionField.setValue(self.owner.rrManagerVersionText);
            rrVersionField.setValue(`💊RR v. ${self.owner.rrVersionText}`);

            const updatedHeight = descriptionField.getHeight();
            if (
                (updatedHeight !== initialHeight && ((panelHeight = panelHeight - initialHeight + updatedHeight), (isHeightChanged = true)),
                    isHeightChanged && ((rightPanel.height = panelHeight), this.doLayout(), this.owner.doLayout()),
                    this.descriptions.length <= 1)
            )
                return leftButton.hide(), void rightButton.hide();
            (leftButton.hidden || rightButton.hidden) && (leftButton.show(), rightButton.show(), this.doLayout());
        },
        prepareSummaryStatus: function (status, data) {
            // Function body goes here
        },
    });