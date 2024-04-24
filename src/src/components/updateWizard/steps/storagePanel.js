export default
    Ext.define("SYNOCOMMUNITY.RRManager.UpdateWizard.StoragePanel", {
        extend: "SYNOCOMMUNITY.RRManager.UpdateWizard.Utils.Step",
        helper: SYNOCOMMUNITY.RRManager.UpdateWizard.Helper,
        selectedVolume: {},
        constructor: function (a) {
            this.callParent([this.fillConfig(a)]);
        },
        fillConfig: function (a) {
            this.store = this.createStore(a);
            this.gridPanel = this.createGridPanel(a);
            var b = {
                //TODO: fix localization
                headline: "Please select the update file to install.",//this.helper.T("host", "select_storage_desc_new"),
                layout: "fit",
                items: [this.gridPanel],
                listeners: { scope: this, activate: this.onActivate },
            };
            Ext.apply(b, a);
            return b;
        },
        createGridPanel: function (a) {
            return new SYNO.ux.GridPanel({
                cls: "vmm-panel-no-padding",
                flex: 1,
                store: this.store,
                enableHdMenu: false,
                colModel: new Ext.grid.ColumnModel({
                    defaults: { sortable: true, width: 120 },
                    columns: [
                        { header: "File Name", dataIndex: "fileName" },
                        {
                            header: "File Version",
                            dataIndex: "fileVersion",
                            // renderer: this.helper.diskSizeRenderer,
                        },
                        {
                            header: "File Size (Mb)",
                            dataIndex: "fileSize",
                            // renderer: SYNO.SDS.Utils.StorageUtils.VolumeNameRenderer,
                        }
                    ],
                }),
                selModel: new Ext.grid.RowSelectionModel({ singleSelect: true }),
                viewConfig: { trackResetOnLoad: false },
            });
        },
        createStore: function (a) {
            return new SYNO.API.JsonStore({
                autoDestroy: true,
                appWindow: this.appWin,
                restful: true,
                root: "result",
                url: "/webman/3rdparty/rr-manager/getAvailableUpdates.cgi",
                idProperty: "fileName",
                fields: [{
                    name: 'fileName',
                    type: 'string'
                }, {
                    name: 'fileSize',
                    type: 'number'
                }, {
                    name: 'fileVersion',
                    type: 'string'
                }, {
                    name: 'filePath',
                    type: 'string'
                }],
                listeners: {
                    scope: this,
                    exception: this.onStoreException,
                    beforeload: this.onStoreBeforeLoad,
                    load: this.onStoreLoad,
                }
            });
        },
        getSelection: function () {
            return this.gridPanel.getSelectionModel().getSelected();
        },
        saveSelectedVolume: function () {
            var a = this.getSelection();
            if (!a) {
                this.selectedVolume = {};
                return;
            }
            this.selectedVolume = this.getValues();
        },
        onStoreException: function () {
            this.helper.unmask(this.owner);
            this.helper.mask(
                this.gridPanel,
                this.helper.T("error", "cluster_not_ready")
            );
            this.owner.getButton("next").disable();
        },
        onStoreBeforeLoad: function (a, b) {
            this.saveSelectedVolume();
        },
        onStoreLoad: function (b) {
            this.helper.unmask(this.owner);
            if (0 !== b.getTotalCount()) {
                this.helper.unmask(this.owner);
                if (
                    !this.selectedVolume.hasOwnProperty("host_id") ||
                    !this.selectedVolume.hasOwnProperty("volume_path")
                ) {
                    return;
                }
                var a = b.findBy(
                    function (c) {
                        return (
                            c.get("host_id") === this.selectedVolume.host_id &&
                            c.get("volume_path") === this.selectedVolume.volume_path
                        );
                    }.createDelegate(this)
                );
                if (a !== -1) {
                    this.gridPanel.getSelectionModel().selectRow(a);
                }
                this.owner.getButton("next").enable();
            } else {
                this.helper.mask(
                    this.gridPanel,
                    this.helper.T("storage", "no_available_storage")
                );
                this.owner.getButton("next").disable();
            }
        },
        onActivate: function () {
            this.helper.unmask(this.gridPanel);
            this.helper.maskLoading(this.owner);
            this.store.load();
            this.owner.getButton("next").enable();
        },
        validate: function () {
            var a = this.getSelection();
            if (!a) {
                this.owner
                    .getMsgBox()
                    //TODO: fix localization
                    .alert("alert", "No update file selected."); //this.helper.T("error", "no_storage_error")
                return false;
            }
            return true;
        },
        getValues: function () {
            return this.data;
        },
        getNext: function () {
            if (!this.validate()) {
                return false;
            }
            this.saveSelectedVolume();
            this.owner.goNext(this.nextId);
            return false;
        },
    });