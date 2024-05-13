export default
    SYNOCOMMUNITY.RRManager.SynoApiProvider = {
        sendWebAPI: null,
        _prefix: '/webman/3rdparty/rr-manager/',
        init: function (sendWebAPI, findAppWindow) {
            this.sendWebAPI = sendWebAPI;
        },
        getSytemInfo: function () {
            that = this;
            return new Promise((resolve, reject) => {
                let args = {
                    api: 'SYNO.DSM.Info',
                    method: 'getinfo',
                    version: 2,
                    callback: function (success, message) {
                        success ? resolve(message) : reject('Unable to get getSytemInfo!');
                    }
                };
                that.sendWebAPI(args);
            });
        },
        getPackagesList: function () {
            that = this;
            return new Promise((resolve, reject) => {
                let params = {
                    additional: ["description", "description_enu", "dependent_packages", "beta", "distributor", "distributor_url", "maintainer", "maintainer_url", "dsm_apps", "dsm_app_page", "dsm_app_launch_name", "report_beta_url", "support_center", "startable", "installed_info", "support_url", "is_uninstall_pages", "install_type", "autoupdate", "silent_upgrade", "installing_progress", "ctl_uninstall", "updated_at", "status", "url", "available_operation", "install_type"],
                    ignore_hidden: false,
                };
                let args = {
                    api: 'SYNO.Core.Package',
                    method: 'list',
                    version: 2,
                    params: params,
                    callback: function (success, message) {
                        success ? resolve(message) : reject('Unable to get packages!');
                    }
                };
                that.sendWebAPI(args);
            });
        },
        getTaskList: function () {
            that = this;
            return new Promise((resolve, reject) => {
                let params = {
                    sort_by: "next_trigger_time",
                    sort_direction: "ASC",
                    offset: 0,
                    limit: 50
                };
                let args = {
                    api: 'SYNO.Core.TaskScheduler',
                    method: 'list',
                    version: 3,
                    params: params,
                    callback: function (success, message) {
                        success ? resolve(message) : reject('Unable to get packages!');
                    }
                };
                that.sendWebAPI(args);
            });
        },
        getSharesList: function () {
            that = this;
            return new Promise((resolve, reject) => {
                let params = {
                    filetype: 'dir', // URL-encode special characters if needed
                    sort_by: 'name',
                    check_dir: true,
                    additional: ["real_path"],
                    enum_cluster: false,
                    node: 'fm_root'
                };
                let args = {
                    api: 'SYNO.FileStation.List',
                    method: 'list_share',
                    version: 2,
                    params: params,
                    callback: function (success, message) {
                        success ? resolve(message) : reject('Unable to get getSharesList!');
                    }
                };
                that.sendWebAPI(args);
            });
        },
        runScheduledTask: function (taskName) {
            that = this;
            return new Promise((resolve, reject) => {
                let params = {
                    task_name: taskName
                };
                let args = {
                    api: 'SYNO.Core.EventScheduler',
                    method: 'run',
                    version: 1,
                    params: params,
                    stop_when_error: false,
                    mode: 'sequential',
                    callback: function (success, message) {
                        success ? resolve(message) : reject('Unable to get packages!');
                    }
                };
                that.sendWebAPI(args);
            });
        },
        _handleFileUpload: function (jsonData) {
            let url = `${this._prefix}uploadConfigFile.cgi`;
            return new Promise((resolve, reject) => {
                Ext.Ajax.request({
                    url: url,
                    method: 'POST',
                    jsonData: jsonData,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    success: function (response) {
                        resolve(Ext.decode(response.responseText));
                    },
                    failure: function (response) {
                        reject('Failed with status: ' + response.status);
                    }
                });
            });
        },
        getPasswordConfirm: function (data) {
            self = this;
            return new Promise((resolve, reject) => {
                let args = {
                    api: "SYNO.Core.User.PasswordConfirm",
                    method: "auth",
                    version: 2,
                    params: {
                        password: data
                    }, callback: function (success, message) {
                        success ? resolve(message?.SynoConfirmPWToken)
                            : reject('Unable to create task!');
                    },
                };
                self.sendWebAPI(args);
            });
        },
        createTask: function (task_name, operation, token) {
            that = this;
            return new Promise((resolve, reject) => {
                let params = {
                    task_name: task_name,
                    owner: { 0: "root" },
                    event: "bootup",
                    enable: false,
                    depend_on_task: "",
                    notify_enable: false,
                    notify_mail: "",
                    notify_if_error: false,
                    operation_type: "script",
                    operation: decodeURIComponent(operation)
                };

                if (token != "") {
                    params.SynoConfirmPWToken = token
                }

                let args = {
                    api: token != "" ? "SYNO.Core.EventScheduler.Root" : "SYNO.Core.EventScheduler",
                    method: "create",
                    version: 1,
                    params: params,
                    callback: function (success, message) {
                        success ? resolve(message) : reject('Unable to create task!');
                    },
                    scope: this,
                };
                that.sendWebAPI(args);
            });
        },
        sendRunSchedulerTaskWebAPI: function (token) {
            args = {
                api: "SYNO.Core.EventScheduler",
                method: "run",
                version: 1,
                params: {
                    task_name: "SetRootPrivsToRrManager",
                },
                callback: function (success, message, data) {
                    if (!success) {
                        console.log("error run EventScheduler task");
                        return;
                    }
                },
                scope: this,
            };

            if (token != "") {
                args.params.SynoConfirmPWToken = token
            }
            this.sendWebAPI(args);
        },
        checkRRVersion: function () {
            return this.callCustomScript('getRrReleaseInfo.cgi');
        },
        getUpdateFileInfo: function (file) {
            return new Promise((resolve, reject) => {
                Ext.Ajax.request({
                    url: `${this._prefix}readUpdateFile.cgi`,
                    method: 'GET',
                    timeout: 60000,
                    params: {
                        file: file
                    },
                    headers: {
                        'Content-Type': 'text/html'
                    },
                    success: function (response) {
                        // if response text is string need to decode it
                        if (typeof response?.responseText === 'string' && response?.responseText != "") {
                            resolve(Ext.decode(response?.responseText));
                        } else {
                            resolve(response?.responseText);
                        }
                    },
                    failure: function (result) {
                        if (typeof result?.responseText === 'string' && result?.responseText) {
                            var response = Ext.decode(result?.responseText);
                            reject(response?.error);
                        }
                        else {
                            reject('Failed with status: ' + response?.status);
                        }
                    }
                });
            });
        },
        callCustomScript: function (scriptName) {

            return new Promise((resolve, reject) => {
                Ext.Ajax.request({
                    url: `${this._prefix}${scriptName}`,
                    method: 'GET',
                    timeout: 60000,
                    headers: {
                        'Content-Type': 'text/html'
                    },
                    success: function (response) {
                        // if response text is string need to decode it
                        if (typeof response?.responseText === 'string') {
                            resolve(Ext.decode(response?.responseText));
                        } else {
                            resolve(response?.responseText);
                        }
                    },
                    failure: function (result) {
                        if (typeof result?.responseText === 'string' && result?.responseText && !result?.responseText.startsWith('<')) {
                            var response = Ext.decode(result?.responseText);
                            reject(response?.error);
                        }
                        else {
                            reject('Failed with status: ' + result?.status);
                        }
                    }
                });
            });
        },
    }