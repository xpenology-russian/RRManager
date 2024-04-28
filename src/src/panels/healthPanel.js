import synoApiProvider from "../utils/synoApiProvider";
export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.HealthPanel", {
        extend: "SYNO.ux.Panel",
        apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,
        constructor: function (e) {
            this.appWin = e.appWin;
            this.owner = e.owner;
            this.helper = e.owner.helper;
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
        createActionsSection: function () {
            return new SYNO.ux.FieldSet({
                title: this.helper.V('ui', 'section_rr_actions'),
                items: [
                    {
                        xtype: 'syno_panel',
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
                                    text: this.helper.V('health_panel', 'btn_from_pc'),
                                    handler: this.onFromPC.bind(this)
                                },
                                {
                                    xtype: 'syno_button',
                                    btnStyle: 'blue',
                                    text: this.helper.V('health_panel', 'btn_from_ds'),
                                    handler: this.onFromDS.bind(this)
                                }]
                            },
                        ],
                        deferredRender: true
                    },
                ]
            });
        },
        preCheck: function (a) {
            var b = a.path.substring(a.path.lastIndexOf("."));
            if (-1 === this.getFileExtsByImageType().indexOf(b)) {
                return false;
            }
            return true;
        },
        exts: {
            zip: [".zip"],
        },
        imageType: "zip",
        getFileExtsByImageType: function () {
            return this.exts[this.imageType];
        },
        onFromPC: function () {
            this.uploadFileDialog.open();
        },
        onFromDS: function () {
            self = this;
            if (!Ext.isDefined(this.dialog)) {
                var a = this.getFileExtsByImageType().toString().replace(/\./g, "");
                this.dialog = new SYNO.SDS.Utils.FileChooser.Chooser({
                    parent: this,
                    owner: this.appWin,
                    closeOwnerWhenNoShare: true,
                    closeOwnerNumber: 0,
                    enumRecycle: true,
                    superuser: true,
                    usage: { type: "open", multiple: true },
                    title: this.helper.T("upload_file_dialog", "choose_file_title"),
                    folderToolbar: true,
                    getFilterPattern: function () {
                        return a;
                    },
                    treeFilter: this.helper.VMMDSChooserTreeFilter,
                    listeners: {
                        scope: this,
                        choose: function (d, b, c) {
                            b.records.forEach(function (f) {
                                var e = {
                                    name: f
                                        .get("path")
                                        .substring(
                                            f.get("path").lastIndexOf("/") + 1,
                                            f.get("path").lastIndexOf(".")
                                        ),
                                    path: f.get("path"),
                                    real_path: _S("hostname") + f.get("path"),
                                    get_patch_by: "from_ds",
                                    file_size: f.get("filesize"),
                                };
                                if (!this.preCheck(e)) {
                                    return true;
                                }
                                self.uploadFileDialog.updateFileInfoHandler(e);
                            }, this);
                            this.dialog.close();
                        },
                        close: function () {
                            delete this.dialog;
                        },
                    },
                });
            }
            this.dialog.show();
        },
        fillConfig: function (e) {
            this.poolLinkId = Ext.id();
            this.iconTemplate = this.createIconTpl();
            this.titleTemplate = this.createTitleTpl();
            this.upperPanel = this.createUpperPanel();
            this.lowerPanel = this.createLowerPanel();
            this.uploadFileDialog = this.createUplaodFileDialog();

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
        createUplaodFileDialog: function () {
            return new SYNOCOMMUNITY.RRManager.Overview.UploadFileDialog({
                parent: this,
                owner: this.appWin,
                helper: this.helper,
                id: "upload_file_dialog",
                title: this.helper.V("ui", "upload_file_dialog_title"),
                apiProvider: this.apiProvider
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