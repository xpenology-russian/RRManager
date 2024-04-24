export default
    Ext.define("SYNOCOMMUNITY.RRManager.UpdateWizard.NewImagePanel", {
        extend: "SYNO.SDS.Utils.FormPanel",
        uploadTimeout: 86400000,
        helper: SYNOCOMMUNITY.RRManager.UpdateWizard.Helper,
        apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,
        exts: {
            zip: [".zip"],
        },
        constructor: function (a) {
            this.callParent([this.fillConfig(a)]);
            this.apiProvider.init(this);
        },
        fillConfig: function (a) {
            this.store = this.createStore();
            this.imageType = a.imageType;
            this.existNameList = this.createExistNameList(a.records);
            this.gridPanel = this.createGridPanel(a);
            this.tbar = this.createTBar(a);
            var b = {
                cls: "image-new-image-panel",
                tbar: this.tbar,
                labelWidth: 204,
                labelPad: 20,
                fileUpload: true,
                trackResetOnLoad: true,
                layout: "fit",
                items: [this.gridPanel],
            };
            Ext.apply(b, a);
            return b;
        },
        createTBar: function (a) {
            return new SYNO.ux.Toolbar({
                items: [
                    {
                        xtype: "syno_filebutton",
                        buttonOnly: true,
                        itemId: "btn_from_PC",
                        id: (this.form_pc_id = Ext.id()),
                        buttonText: this.helper.V("ui", "from_pc"),
                        listeners: {
                            scope: this,
                            afterrender: function (b) {
                                b.el.set({
                                    accept: this.getFileExtsByImageType().toString(),
                                    multiple: true,
                                });
                                this.mon(b.el, "change", this.onFromPC, this);
                            },
                        },
                    },
                    {
                        xtype: "syno_button",
                        itemId: "btn_from_DS",
                        id: (this.form_ds_id = Ext.id()),
                        text: this.helper.V("ui", "from_ds"),
                        handler: this.onFromDS,
                        scope: this,
                    },
                ],
            });
        },
        createStore: function () {
            var a = [
                { name: "name" },
                { name: "path" },
                { name: "get_patch_by" },
                { name: "action" },
                { name: "input_elm" },
                { name: "real_path" },
                { name: "file_size" },
                { name: "file" },
            ];
            return new Ext.data.JsonStore({
                autoDestroy: true,
                idProperty: "name",
                root: "",
                fields: a,
            });
        },
        createGridPanel: function (a) {
            this.nameTextField = new SYNO.ux.TextField({
                name: "name",
                allowBlank: false,
                itemId: "name_field",
                maxlength: 127,
                vtype: "taskname",
                selectOnFocus: true,
                listeners: {
                    scope: this,
                    focus: function () {
                        var b = this.gridPanel
                            .getView()
                            .getCell(this.nameTextField.gridEditor.row, 0);
                        var c = b.itip;
                        if (!c) {
                            this.nameTextField.clearInvalid();
                        } else {
                            this.nameTextField.markInvalid(c);
                        }
                    },
                },
            });
            return new SYNO.ux.EditorGridPanel({
                cls: "vm-textfield-grid",
                store: this.store,
                flex: 1,
                clicksToEdit: 1,
                enableHdMenu: false,
                enableColumnMove: false,
                colModel: new Ext.grid.ColumnModel({
                    defaults: { menuDisabled: true },
                    columns: [
                        {
                            header: this.helper.T("ui", "image_name"),
                            dataIndex: "name",
                            align: "left",
                            editor: this.nameTextField,
                        },
                        {
                            header: this.helper.T("common", "file"),
                            dataIndex: "real_path",
                            renderer: this.helper.toolTipRenderer,
                        },
                        {
                            header: this.helper.T("common", "size"),
                            dataIndex: "file_size",
                            renderer: function (b) {
                                if (0 >= b) {
                                    return "-";
                                }
                                return this.helper.diskSizeRenderer(b);
                            }.createDelegate(this),
                        },
                        {
                            xtype: "actioncolumn",
                            header: this.helper.T("common", "action"),
                            dataIndex: "action",
                            scope: this,
                            items: [
                                {
                                    iconCls: "vm-fileupload-delete-icon",
                                    handler: function (d, e, c) {
                                        var b = this.store.getAt(e).get("input_elm");
                                        this.store.removeAt(e);
                                        if (Ext.isObject(b)) {
                                            Ext.removeNode(Ext.getDom(b));
                                        }
                                        this.nameValidate();
                                    }.createDelegate(this),
                                },
                            ],
                            width: 40,
                            align: "center",
                        },
                    ],
                }),
                listeners: {
                    scope: this,
                    afteredit: function (b) {
                        this.nameValidate();
                    },
                },
            });
        },
        createExistNameList: function (b) {
            var c = [];
            var a = b.snapshot || b.data;
            a.items.forEach(function (d) {
                c.push(d.get("name"));
            });
            return c;
        },
        getFileExtsByImageType: function () {
            return this.exts[this.imageType];
        },
        getValues: function () {
            var a = [];
            for (var b = 0; b < this.store.getCount(); b++) {
                var c = this.store.getAt(b);
                a.push({
                    get_patch_by: c.get("get_patch_by"),
                    name: c.get("name"),
                    path: c.get("path"),
                    file: c.get("file"),
                    file_size: c.get("file_size"),
                });
            }
            return a;
        },
        addStore: function (a) {
            this.store.add(new Ext.data.Record(a));
            this.nameValidate();
        },
        isUniqueExistName: function (a) {
            if (-1 !== this.existNameList.indexOf(a)) {
                return false;
            }
            return true;
        },
        isUniqueNewName: function (a, c) {
            for (var b = 0; b < this.store.getCount(); b++) {
                if (b === c) {
                    continue;
                }
                if (a === this.store.getAt(b).get("name")) {
                    return false;
                }
            }
            return true;
        },
        nameValidate: function () {
            var isValid = true;
            var errorMessage;
            for (var index = 0; index < this.store.getCount(); index++) {
                var record = this.store.getAt(index);
                var cell = this.gridPanel.getView().getCell(index, 0);
                var invalidCharactersRegex = /([\\\{\}\|\^\[\]\?\=\:\+\/\*\(\)\$\!"#%&',;<>@`~])/;
                if (null !== record.get("name").match(invalidCharactersRegex)) {
                    errorMessage = this.helper.T("error", "invalid_name");
                } else {
                    if (!this.isUniqueExistName(record.get("name")) || !this.isUniqueNewName(record.get("name"), index)) {
                        errorMessage = this.helper.T("error", "name_conflict");
                    }
                }
                var cellFirstChild = Ext.get(Ext.getDom(cell).firstChild);
                cellFirstChild.removeClass("validCell");
                cellFirstChild.removeClass("invalidCell");
                if (errorMessage) {
                    cellFirstChild.addClass("invalidCell");
                    Ext.getDom(cell).setAttribute("ext:anchor", "top");
                    Ext.getDom(cell).itip = errorMessage;
                    isValid = false;
                } else {
                    cellFirstChild.addClass("validCell");
                    Ext.getDom(cell).itip = "";
                }
                errorMessage = "";
            }
            return isValid;
        },
        onFromPC: function (b, d, c) {
            var a = b.target.files;
            Ext.each(
                a,
                function (f) {
                    var e = {
                        input_elm: d,
                        name: f.name.substring(0, f.name.lastIndexOf(".")),
                        path: f.name,
                        real_path: f.name,
                        get_patch_by: "upload",
                        file_size: f.size,
                        file: f,
                    };
                    if (!this.preCheck(e)) {
                        return true;
                    }
                    this.addStore(e);
                },
                this
            );
            this.getTopToolbar().getComponent("btn_from_PC").reset();
        },
        onFromDS: function () {
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
                    title: this.helper.T("vm", "import_vm_from_ds"),
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
                                this.addStore(e);
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
        preCheck: function (a) {
            var b = a.path.substring(a.path.lastIndexOf("."));
            if (-1 === this.getFileExtsByImageType().indexOf(b)) {
                return false;
            }
            return true;
        },
        getNext: function () {
            return this.isValid();
        },
        isValid: function () {
            var c = true;
            var a = this.getValues();
            if (!this.nameValidate()) {
                this.appWin
                    .getMsgBox()
                    .alert(
                        this.helper.T("app", "displayname"),
                        this.helper.T("error", "invalid_name")
                    );
                return false;
            }
            if (0 === a.length) {
                this.appWin
                    .getMsgBox()
                    .alert(
                        this.helper.T("app", "displayname"),
                        this.helper.T("error", "error_nochoosefile")
                    );
                return false;
            }
            var d = { zip: this.exts.zip };
            var b = {
                zip: [".zip"],
            };
            a.forEach(function (i) {
                if ("upload" === i.get_patch_by || "from_ds" === i.get_patch_by) {
                    var e = i.path.substr(i.path.lastIndexOf("."));
                    var g = d.hasOwnProperty(this.imageType) ? d[this.imageType] : [];
                    var h = b.hasOwnProperty(this.imageType) ?
                        b[this.imageType] :
                        Object.values(b).reduce(function (k, j) {
                            return k.concat(j);
                        }, []);
                    var f = false;
                    g.forEach(function (j) {
                        if (e === j) {
                            f = true;
                        }
                    });
                    if (f === false) {
                        this.appWin.getMsgBox().alert(
                            this.helper.T("app", "displayname"),
                            String.format(
                                this.helper.T("error", "image_filename_bad_ext"),
                                h.join(", ")
                            )
                        );
                        c = false;
                        return false;
                    }
                }
            }, this);
            return c;
        },
        doCreate: function (a) {
            // this.sendWebAPI({
            //     api: "SYNO.Virtualization.Guest.Image",
            //     method: "create",
            //     version: 2,
            //     params: a,
            //     scope: this,
            //     callback: function (c, b) {
            //         if (!c) {
            //             this.owner.owner
            //                 .getMsgBox()
            //                 .alert("alert", this.helper.getError(b.code));
            //         }
            //         this.nonUploadTaskNum--;
            //         this.checkAllTaskDone();
            //     },
            // });
        },
        doUploadAndCreate: function (params, file) {
            let rrConfigJson = localStorage.getItem('rrConfig');
            let rrConfig = JSON.parse(rrConfigJson);
            let rrManagerConfig = rrConfig.rr_manager_config;
            this.opts.params.path = `/${rrManagerConfig.SHARE_NAME}/${rrManagerConfig.RR_TMP_DIR}`;
            let isChunkMode = false;
            if (-1 !== this.MAX_POST_FILESIZE && file.file_size > this.MAX_POST_FILESIZE && isChunkMode)
                this.onError({
                    errno: {
                        section: "error",
                        key: "upload_too_large"
                    }
                }, file);
            else {
                let formData = this.prepareStartFormdata(file);
                if (file.chunkmode) {
                    let chunkSize = this.opts.chunksize;
                    let totalChunks = Math.ceil(file.size / chunkSize);
                    this.onUploadPartailFile(formData, file, {
                        start: 0,
                        index: 0,
                        total: totalChunks
                    })
                } else
                    this.sendArray(formData, file)
            }
        },
        opts: {
            chunkmode: false,
            filefiledname: "file",
            file: function (file) {
                var createFileObject = function (file, params, id, dtItem) {
                    var modifiedParams = SYNO.SDS.copy(params || {});
                    var lastModifiedTime = SYNO.webfm.utils.getLastModifiedTime(file);

                    if (lastModifiedTime) {
                        modifiedParams = Ext.apply(modifiedParams, {
                            mtime: lastModifiedTime
                        });
                    }

                    return {
                        id: id,
                        file: file,
                        dtItem: dtItem,
                        name: file.name || file.fileName,
                        size: file.size || file.fileSize,
                        progress: 0,
                        status: "NOT_STARTED",
                        params: modifiedParams,
                        chunkmode: false
                    };
                }

                var lastModifiedTime = SYNO.webfm.utils.getLastModifiedTime(file);
                var fileObject = new createFileObject(file, { mtime: lastModifiedTime });
                return fileObject;
            },
            //TODO: remove hard coding
            params: {
                // populating from the config in onOpen
                path: '',
                overwrite: true
            }
        },
        prepareStartFormdata: function (file) {
            const isChunkMode = (-1 !== this.MAX_POST_FILESIZE && file.size > this.MAX_POST_FILESIZE);
            if (isChunkMode) {
                const boundary = `----html5upload-${new Date().getTime()}${Math.floor(65535 * Math.random())}`;
                let contentPrefix = "";

                if (this.opts.params) {
                    for (const paramName in this.opts.params) {
                        if (this.opts.params.hasOwnProperty(paramName)) {
                            contentPrefix += `--${boundary}\r\n`;
                            contentPrefix += `Content-Disposition: form-data; name="${paramName}"\r\n\r\n`;
                            contentPrefix += `${unescape(encodeURIComponent(this.opts.params[paramName]))}\r\n`;
                        }
                    }
                }

                if (file.params) {
                    for (const paramName in file.params) {
                        if (file.params.hasOwnProperty(paramName)) {
                            contentPrefix += `--${boundary}\r\n`;
                            contentPrefix += `Content-Disposition: form-data; name="${paramName}"\r\n\r\n`;
                            contentPrefix += `${unescape(encodeURIComponent(file.params[paramName]))}\r\n`;
                        }
                    }
                }

                const filename = unescape(encodeURIComponent(file.name));
                contentPrefix += `--${boundary}\r\n`;
                contentPrefix += `Content-Disposition: form-data; name="${this.opts.filefiledname || "file"}"; filename="${filename}"\r\n`;
                contentPrefix += 'Content-Type: application/octet-stream\r\n\r\n';

                return {
                    formData: contentPrefix,
                    boundary: boundary
                };
            } else {
                const formData = new FormData();

                if (this.opts.params) {
                    for (const paramName in this.opts.params) {
                        if (this.opts.params.hasOwnProperty(paramName)) {
                            formData.append(paramName, this.opts.params[paramName]);
                        }
                    }
                }

                if (file.params) {
                    for (const paramName in file.params) {
                        if (file.params.hasOwnProperty(paramName)) {
                            formData.append(paramName, file.params[paramName]);
                        }
                    }
                }

                return formData;
            }
        },
        onUploadPartailFile: function (e, t, i, o) {
            i.start = i.index * this.opts.chunksize;
            var chunkSize = Math.min(this.opts.chunksize, t.size - i.start);

            if ("PROCESSING" === t.status) {
                var fileSlice;

                if (window.File && File.prototype.slice) {
                    fileSlice = t.file.slice(i.start, i.start + chunkSize);
                } else if (window.File && File.prototype.webkitSlice) {
                    fileSlice = t.file.webkitSlice(i.start, i.start + chunkSize);
                } else if (window.File && File.prototype.mozSlice) {
                    fileSlice = t.file.mozSlice(i.start, i.start + chunkSize);
                } else {
                    this.onError({}, t);
                    return;
                }

                this.sendArray(e, t, fileSlice, i, o);
            }
        },
        _baseUrl: 'webapi/entry.cgi?',
        sendArray: function (formData, fileDetails, fileData, chunkDetails, tempFile) {
            var self = this;
            var headers = {}, requestParams = {};
            var uploadData;

            if (fileDetails.status !== "CANCEL") {
                if (fileDetails.chunkmode) {
                    headers = {
                        "Content-Type": "multipart/form-data; boundary=" + formData.boundary
                    };
                    requestParams = {
                        "X-TYPE-NAME": "SLICEUPLOAD",
                        "X-FILE-SIZE": fileDetails.size,
                        "X-FILE-CHUNK-END": chunkDetails.total <= 1 || chunkDetails.index === chunkDetails.total - 1 ? "true" : "false"
                    };
                    if (tempFile) {
                        Ext.apply(requestParams, {
                            "X-TMP-FILE": tempFile
                        });
                    }
                    if (window.XMLHttpRequest.prototype.sendAsBinary) {
                        uploadData = formData.formdata + (fileData !== "" ? fileData : "") + "\r\n--" + formData.boundary + "--\r\n";
                    } else if (window.Blob) {
                        var data = new Uint8Array(formData.formdata.length + fileData.length + "\r\n--" + formData.boundary + "--\r\n".length);
                        data.set(new TextEncoder().encode(formData.formdata + fileData + "\r\n--" + formData.boundary + "--\r\n"));
                        uploadData = data;
                    }
                } else {
                    formData.append("size", fileDetails.size);
                    fileDetails.name
                        ? formData.append(this.opts.filefiledname, fileDetails, fileDetails.name)
                        : formData.append(this.opts.filefiledname, fileDetails.file);

                    uploadData = formData;
                }
                this.conn = new Ext.data.Connection({
                    method: 'POST',
                    url: `${this._baseUrl}api=SYNO.FileStation.Upload&method=upload&version=2&SynoToken=${localStorage['SynoToken']}`,
                    defaultHeaders: headers,
                    timeout: null
                });
                var request = this.conn.request({
                    headers: requestParams,
                    html5upload: true,
                    chunkmode: fileDetails.chunkmode,
                    uploadData: uploadData,
                    success: (response) => {
                        this.uploadTaskNum--;
                        this.checkAllTaskDone();
                        // self.appWin.clearStatusBusy();
                        self.appWin.getMsgBox().confirmDelete(
                            self.appWin.title,
                            self.helper.V('ui', 'file_uploading_succesfull_msg'),
                            (result) => {
                                if (result === "yes") {
                                    self.onRunRrUpdateManuallyClick();
                                }
                            },
                            formData,
                            {
                                yes: {
                                    text: "Yes",
                                    btnStyle: "red",
                                },
                                no: { text: Ext.MessageBox.buttonText.no },
                            }
                        );
                    },
                    failure: (response) => {
                        self.appWin.clearStatusBusy();
                        self.showMsg(self.helper.V('ui', 'file_uploading_failed_msg'));
                        console.error(self.helper.V('ui', 'file_uploading_failed_msg'));
                        console.log(response);
                    },
                    progress: (progressEvent) => {
                        const percentage = ((progressEvent.loaded / progressEvent.total) * 100).toFixed(2);
                        self.appWin.clearStatusBusy();
                        self.appWin.setStatusBusy({ text: `${_T("common", "loading")}. ${self.helper.V("ui", "completed")} ${percentage}%.` }, percentage);
                    },
                });
            }
        },
        MAX_POST_FILESIZE: Ext.isWebKit ? -1 : window.console && window.console.firebug ? 20971521 : 4294963200,
        showMsg: function (msg) {
            this.owner.getMsgBox().alert("title", msg);
        },
        doImageCreate: function (fileInfo) {
            this.uploadTaskNum = 0;
            this.nonUploadTaskNum = 0;
            var fileList = this.getValues();
            this.waitingSendTaskNum = fileList.length;
            this.uploadTaskNum = fileList.filter(function (c) {
                return "upload" === c.get_patch_by;
            }).length;
            this.nonUploadTaskNum = fileList.length - this.uploadTaskNum;
            this.uploadErrorFile = [];
            // this.helper.maskLoading(this.appWin);
            //TODO: fix the issue with the mask
            this.helper.maskLoading(this.pollingWindow);//.getActivateOverviewPanel()
            fileList.forEach(function (c) {
                var d = {
                    type: this.imageType,
                    get_patch_by: c.get_patch_by,
                    name: c.name,
                    ds_file_path: c.path,
                };
                if (d.get_patch_by !== "upload") {
                    this.doCreate(d);
                    this.waitingSendTaskNum--;
                    this.checkAllTaskSend();
                } else {
                    this.reader(d, c.file).then(
                        function (e) {
                            this.doUploadAndCreate(e.params, e.file);
                            this.waitingSendTaskNum--;
                            this.checkAllTaskSend();
                        }.bind(this),
                        function (e) {
                            this.uploadErrorFile.push(e);
                            this.uploadTaskNum--;
                            this.waitingSendTaskNum--;
                            this.checkAllTaskSend();
                        }.bind(this)
                    );
                }
            }, this);
        },
        checkAllTaskSend: function () {
            if (0 !== this.waitingSendTaskNum) {
                return;
            }
            if (0 !== this.uploadErrorFile.length) {
                this.owner.owner
                    .getMsgBox()
                    .alert(
                        "alert",
                        String.format(
                            this.helper.T("image", "upload_file_missing"),
                            this.uploadErrorFile.join(", ")
                        )
                    );
            }
            this.helper.tryUnmaskAndReload(
                this,
                // this.pollingWindow.getActivateOverviewPanel(),
                // this.pollingWindow.pollingTask
            );
            this.helper.unmask(this.appWin);
            this.appWin.hide();
            this.checkAllTaskDone();
        },
        checkAllTaskDone: function () {
            if (0 === this.uploadTaskNum && 0 === this.nonUploadTaskNum) {
                this.appWin.close();
            }
        },
        reader: function (b, a) {
            return new Promise(function (f, e) {
                var d = a.slice(0, 4);
                if (0 >= d.size) {
                    e(b.name);
                    return;
                }
                var c = new FileReader();
                c.args = { params: b, file: a };
                c.addEventListener("load", function () {
                    f(this.args);
                });
                c.addEventListener("error", function () {
                    e(this.args.params.name);
                });
                c.readAsText(d);
            });
        },
        submit: function () {
            self = this;
            var selectedFiles = this.getValues();
            var size = 0;
            var fileToUpload = {};
            this.helper.maskLoading(this.appWin);
            selectedFiles.forEach(function (h) {
                size += h.file_size;
                fileToUpload.file_size = JSON.stringify(size);
                self.doImageCreate(selectedFiles);
            });
            this.helper.unmask(this.appWin);
        },
        runUpdate: async function () {
            const self = this;
            //show the spinner
            //TODO: fix the spinner
            // self.owner.getEl().mask(_T("common", "loading"), "x-mask-loading");
            self.apiProvider.runScheduledTask('RunRrUpdate');
            const maxCountOfRefreshUpdateStatus = 350;
            let countUpdatesStatusAttemp = 0;

            const updateStatusInterval = setInterval(async function () {
                const checksStatusResponse = await self.apiProvider.callCustomScript('checkUpdateStatus.cgi');
                //TODO: why it's crashing here?
                if (!checksStatusResponse?.success) {
                    clearInterval(updateStatusInterval);
                    self.helper.unmask(this.appWin);
                    self.showMsg(checksStatusResponse?.status);
                }
                const response = checksStatusResponse.result;
                self.owner.getEl()?.mask(self.helper.formatString(self.helper.V('ui', 'update_rr_progress_msg'), response?.progress ?? "--", response?.progressmsg ?? "--"), 'x-mask-loading');
                countUpdatesStatusAttemp++;
                if (countUpdatesStatusAttemp == maxCountOfRefreshUpdateStatus || response?.progress?.startsWith('-')) {
                    clearInterval(updateStatusInterval);
                    // self.owner.getEl()?.unmask();
                    self.showMsg(self.helper.formatString(self.helper.V('ui'), response?.progress, response?.progressmsg));
                } else if (response?.progress == '100') {
                    // self.owner.getEl()?.unmask();
                    clearInterval(updateStatusInterval);
                    self.showMsg(self.helper.V('ui', 'update_rr_completed'));
                }
            }, 1500);
        },
        onRunRrUpdateManuallyClick: function () {
            const self = this;
            const rrConfigJson = localStorage.getItem('rrConfig');
            const rrConfig = JSON.parse(rrConfigJson);
            const rrManagerConfig = rrConfig.rr_manager_config;
            //TODO: remove hardcoded update.zip file name
            const url = `${rrManagerConfig?.UPLOAD_DIR_PATH}${rrManagerConfig?.RR_TMP_DIR}/update.zip`;
            this.apiProvider.getUpdateFileInfo(url).then((responseText) => {
                if (!responseText.success) {
                    self.owner.getEl()?.unmask();
                    this.owner.getMsgBox().alert("Error", self.helper.formatString(self.helper.V('ui', 'unable_update_rr_msg'), responseText?.error ?? "No response from the readUpdateFile.cgi script."));
                    // this.showMsg();
                    return;
                }
                const configName = 'rrUpdateFileVersion';
                self.owner[configName] = responseText;
                const currentRrVersion = rrConfig.rr_version;
                const updateRrVersion = self.owner[configName].updateVersion;

                self.appWin.getMsgBox().confirmDelete(
                    "Confirmation",
                    self.helper.formatString(self.helper.V('ui', 'update_rr_confirmation'), currentRrVersion, updateRrVersion),
                    (userResponse) => {
                        if ("yes" === userResponse) {
                            self.runUpdate();
                        }
                    },
                    e,
                    {
                        yes: {
                            text: "Proceed",
                            btnStyle: "red",
                        },
                        no: { text: "Cancel" },
                    }
                );
            }).catch(error => {
                this.owner.getMsgBox().alert(`Error. ${error}`);
            });
        },
    });
