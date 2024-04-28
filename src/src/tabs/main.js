import SynoApiProvider from '../utils/synoApiProvider';
import UpdateAvailable from '../components/dialogs/updateAvailableDialog';
import PasswordConfirmDialog from '../components/dialogs/passwordConfirmDialog';
import UploadFileDialog from '../components/dialogs/uploadFileDialog';
export default
    Ext.define("SYNOCOMMUNITY.RRManager.Overview.Main", {
        extend: "SYNO.ux.Panel",
        helper: SYNOCOMMUNITY.RRManager.UpdateWizard.Helper,
        apiProvider: SYNOCOMMUNITY.RRManager.SynoApiProvider,
        formatString: function (str, ...args) {
            return str.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        },

        handleFileUpload: function (jsonData) {
            this.apiProvider._handleFileUpload(jsonData).then(x => {
                this.apiProvider.runScheduledTask('ApplyRRConfig');
                this.showMsg(this.helper.V('ui', 'rr_config_applied'));
                this.appWin.clearStatusBusy();
            });
        },
        constructor: function (e) {
            this.installed = false;
            this.appWin = e.appWin;
            this.appWin.handleFileUpload = this.handleFileUpload.bind(this);
            this.loaded = false;
            this.callParent([this.fillConfig(e)]);
            this.apiProvider.init(this.sendWebAPI.bind(this));
            this.mon(
                this,
                "data_ready",
                () => {
                    if (this.getActivePage)
                        this.getActivePage().fireEvent("data_ready");
                },
                this
            );
        },
        fillConfig: function (e) {
            this.panels = {
                healthPanel: new SYNOCOMMUNITY.RRManager.Overview.HealthPanel({
                    appWin: e.appWin,
                    owner: this,
                }),
            };
            const t = {
                layout: "vbox",
                cls: "blue-border",
                layoutConfig: { align: "stretch" },
                items: Object.values(this.panels),
                listeners: {
                    scope: this,
                    activate: this.onActivate,
                    deactivate: this.onDeactive,
                    data_ready: this.onDataReady,
                },
            };
            return Ext.apply(t, e), t;
        }, _getRrConfig: function () {
            const rrConfigJson = localStorage.getItem('rrConfig');
            return JSON.parse(rrConfigJson);
        },
        __checkDownloadFolder: function (callback) {
            var self = this;
            const rrConfig = this._getRrConfig();
            const config = rrConfig.rr_manager_config;
            self.apiProvider.getSharesList().then(x => {
                var shareName = `/${config['SHARE_NAME']}`;
                var sharesList = x.shares;
                localStorage.setItem('sharesList', JSON.stringify(sharesList));
                var downloadsShareMetadata = sharesList.find(x => x.path.toLowerCase() == shareName.toLowerCase());
                if (!downloadsShareMetadata) {
                    var msg = this.formatString(this.helper.V('ui', 'share_notfound_msg'), config['SHARE_NAME']);
                    self.appWin.setStatusBusy({ text: this.helper.V('ui', 'checking_dependencies_loader') });
                    self.showMsg(msg);
                    return;
                }
                if (callback) callback();
            });
        },

        __checkRequiredTasks: async function () {
            var self = this;
            var requiredTasks = [{
                name: "RunRrUpdate",
                createTaskCallback: self.createAndRunSchedulerTask.bind(this)
            }, {
                name: "SetRootPrivsToRrManager",
                createTaskCallback: self.createAndRunSchedulerTaskSetRootPrivilegesForRrManager.bind(this)
            }, {
                name: "ApplyRRConfig",
                createTaskCallback: self.createSchedulerTaskApplyRRConfig.bind(this)
            }];

            try {
                let response = await self.apiProvider.getTaskList();
                var tasks = response.tasks;
                var tasksToCreate = requiredTasks.filter(task => !tasks.find(x => x.name === task.name));
                if (tasksToCreate.length > 0) {
                    let tasksNames = tasksToCreate.map(task => task.name).join(', ');
                    async function craeteTasks() {
                        for (let task of tasksToCreate) {
                            if (task.createTaskCallback) {
                                var data = await self.showPasswordConfirmDialog(task.name);
                                task.createTaskCallback(data);
                            }
                        }
                        // After all tasks have been created, you might want to notify the user.
                        self.showMsg(self.helper.V('ui', 'tasks_created_msg'));
                        self.owner.clearStatusBusy();
                    }
                    self.appWin.getMsgBox().confirm(
                        "Confirmation",
                        self.formatString(
                            self.helper.formatString(self.helper.V('ui', 'required_tasks_is_missing'), tasksNames),
                            self.helper.V('ui', 'required_components_missing')),
                        (userResponse) => {
                            if ("yes" === userResponse) {
                                craeteTasks();
                            } else {
                                Ext.getCmp(self.id).getEl().mask(self.helper.formatString(self.helper.V('ui', 'required_components_missing_spinner_msg'), tasksNames), "x-mask-loading");
                            }
                        }, self,
                        {
                            cancel: { text: _T("common", "cancel") },
                            yes: { text: _T("common", "agree"), btnStyle: 'red' }
                        }, {
                        icon: "confirm-delete-icon"
                    }
                    );
                }
            } catch (error) {
                console.error('Error checking or creating tasks:', error);
            }
        },
        showPasswordConfirmDialog: function (taskName) {
            return new Promise((resolve, reject) => {
                var window = new SYNOCOMMUNITY.RRManager.Overview.PasswordConfirmDialog({
                    owner: this.appWin,
                    title: `${_T("common", "enter_password_to_continue")} for task: ${taskName}.`,
                    confirmPasswordHandler: resolve
                });
                window.open();
            });
        },
        createAndRunSchedulerTask: function (data) {
            this.apiProvider.getPasswordConfirm(data).then(data => {
                //TODO: remove hardcoded update.zip file name
                this.apiProvider.createTask("RunRrUpdate",
                    '.%20%2Fvar%2Fpackages%2Frr-manager%2Ftarget%2Fapp%2Fconfig.txt%20%26%26%20.%20%2Ftmp%2Frr_update_filename%20%26%26%20%2Fusr%2Fbin%2Frr-update.sh%20updateRR%20%22%24UPLOAD_DIR_PATH%24RR_TMP_DIR%22%2Fupdate.zip%20%2Ftmp%2Frr_update_progress',
                    data
                );
            });
        },
        createAndRunSchedulerTaskSetRootPrivilegesForRrManager: function (data) {
            self = this;
            this.apiProvider.getPasswordConfirm(data).then(data => {
                this.apiProvider.createTask("SetRootPrivsToRrManager",
                    "sed%20-i%20's%2Fpackage%2Froot%2Fg'%20%2Fvar%2Fpackages%2Frr-manager%2Fconf%2Fprivilege%20%26%26%20synopkg%20restart%20rr-manager",
                    data
                ).then(x => {
                    self.apiProvider.sendRunSchedulerTaskWebAPI(data);
                });
            });
        },
        createSchedulerTaskApplyRRConfig: function (data) {
            this.apiProvider.getPasswordConfirm(data).then(data => {
                this.apiProvider.createTask("ApplyRRConfig",
                    "cp%20%2Ftmp%2Fuser-config.yml%20%2Fmnt%2Fp1%2Fuser-config.yml%20%26%26%20cp%20%2Ftmp%2F.build%20%2Fmnt%2Fp1%2F.build",
                    data
                );
            });
        },
        showPrompt: function (title, message, text, yesCallback) {
            var window = new SYNOCOMMUNITY.RRManager.Overview.UpdateAvailableDialog({
                owner: this.appWin,
                title: title,
                message: message,
                msg: text,
                msgItemCount: 3,
                confirmCheck: true,
                btnOKHandler: yesCallback
            });
            window.open();
        },
        onActivate: function () {
            const self = this;
            if (this.loaded) return;
            self.appWin.setStatusBusy(null, null, 50);
            self.apiProvider.runScheduledTask('MountLoaderDisk');
            (async () => {
                const [systemInfo, packages, rrCheckVersion] = await Promise.all([
                    self.apiProvider.getSytemInfo(),
                    self.apiProvider.getPackagesList(),
                    //TODO: uncomment when RR version will be available
                    self.apiProvider.checkRRVersion()
                ]);

                if (systemInfo && packages) {
                    self.rrCheckVersion = rrCheckVersion;
                    self.systemInfoTxt = `Model: ${systemInfo?.model}, RAM: ${systemInfo?.ram} MB, DSM version: ${systemInfo?.version_string} `;
                    const rrManagerPackage = packages.packages.find((packageInfo) => packageInfo.id == 'rr-manager');
                    self.rrManagerVersionText = `🛡️RR Manager v.: ${rrManagerPackage?.version}`;
                    self.panels.healthPanel.fireEvent(
                        "select",
                        self.panels.healthPanel.clickedBox
                    );
                    await self.updateAllForm();
                    self.rrVersionText = self.rrConfig.rr_version;
                    if (!self.installed) {
                        //create rr tmp folder
                        self.rrManagerConfig = self.rrConfig.rr_manager_config;
                        SYNO.API.currentManager.requestAPI('SYNO.FileStation.CreateFolder', "create", "2", {
                            folder_path: `/${self.rrManagerConfig.SHARE_NAME}`,
                            name: self.rrManagerConfig.RR_TMP_DIR,
                            force_parent: false
                        });
                        self.installed = true;
                    }
                    self.panels.healthPanel.fireEvent("data_ready");
                    self.loaded = true;
                }

                if (self.isUpdateAvailable(rrCheckVersion)) {
                    self.showPrompt(self.helper.V('ui', 'prompt_update_available_title'),
                        self.helper.formatString(self.helper.V('ui', 'prompt_update_available_message'), rrCheckVersion.tag),
                        rrCheckVersion.notes, self.donwloadUpdate.bind(self));
                }
            })();
            self.__checkDownloadFolder(self.__checkRequiredTasks.bind(self));
        },
        isUpdateAvailable: function (rrCheckVersion) {
            return rrCheckVersion?.status == "update available"
                && rrCheckVersion?.tag != "null"
                && this.rrConfig.rr_version !== rrCheckVersion?.tag;
        },

        showMsg: function (msg) {
            this.owner.getMsgBox().alert("title", msg);
        },
        donwloadUpdate: function () {
            self = this;
            SYNO.API.currentManager.requestAPI('SYNO.DownloadStation2.Task', "create", "2", {
                type: "url",
                destination: `${self.rrManagerConfig.SHARE_NAME}/${self.rrManagerConfig.RR_TMP_DIR}`,
                create_list: true,
                url: [self.rrCheckVersion.updateAllUrl]
            });
        },
        updateAllForm: async function () {
            this.owner.setStatusBusy();
            try {
                const rrConfig = await this.getConf();
                var configName = 'rrConfig';

                this.appWin[configName] = rrConfig;
                this[configName] = rrConfig;

                localStorage.setItem(configName, JSON.stringify(rrConfig));
            } catch (e) {
                SYNO.Debug(e);
            } finally {
                this.owner.clearStatusBusy();
            }
        },

        getConf: function () {
            return this.apiProvider.callCustomScript('getConfig.cgi')
        },
        onDeactive: function () {
            this.panels.healthPanel.fireEvent(
                "deactivate",
                this.panels.healthPanel.clickedBox
            );
        },
        onDataReady: async function () {
            const e = this;
            e.loaded = true;
            // need to clean the spinner when form has been loaded
            e.appWin.clearStatusBusy();
        },
        getActivateOverviewPanel: function () {
            if (this.getActiveTab()) {
                return this.getActiveTab().overviewPanel;
            }
            return null;
        },
    });