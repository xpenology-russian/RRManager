export default
    SYNOCOMMUNITY.RRManager.UpdateHelper = {
        init: function (apiProvider, findAppWindow) {
          this.apiProvider = apiProvider;
          this.appWin = findAppWindow.appWin;
          this.helper = findAppWindow.helper;
          this.showMsg = findAppWindow.showMsg.bind(findAppWindow);
        },
        updateFileInfoHandler: function (fileInfo) {
            if (!fileInfo) {
                this.showMsg("File path is not provided");
                return;
            }
            let sharesList = JSON.parse(localStorage.getItem('sharesList'));
            let shareName = fileInfo.path.split("/")[1];
            let shareInfo = sharesList.find(share => share.name.toLocaleLowerCase() === shareName.toLocaleLowerCase());
            if (!shareInfo) {
                this.showMsg("Share not found");
                return;
            }
            var shareRealPath = shareInfo.additional.real_path;
            var fileInfo = shareRealPath.replace(shareName, fileInfo.path.slice(1));
            this.apiProvider.callCustomScript(`uploadUpdateFileInfo.cgi?file=${encodeURIComponent(fileInfo)}`).then(() => {
                this.onRunRrUpdateManuallyClick(fileInfo);
                this.apiProvider.runScheduledTask("RunRrUpdate");
            });
        },
        MAX_POST_FILESIZE: Ext.isWebKit ? -1 : window.console && window.console.firebug ? 20971521 : 4294963200,
        onRunRrUpdateManuallyClick: function (updateFilePath) {
            const self = this;
            const rrConfigJson = localStorage.getItem('rrConfig');
            const rrConfig = JSON.parse(rrConfigJson);

            function runUpdate() {
                self.apiProvider.getUpdateFileInfo(updateFilePath).then((responseText) => {
                    if (!responseText.success) {
                        self.helper.unmask(self.owner);
                        self.showMsg(self.helper.formatString(self.helper.V('upload_file_dialog', 'unable_update_rr_msg'), responseText?.error ?? "No response from the scripts/readUpdateFile.cgi script."));
                        return;
                    }
                    const configName = 'rrUpdateFileVersion';
                    self[configName] = responseText;
                    const currentRrVersion = rrConfig.rr_version;
                    const updateRrVersion = self[configName].updateVersion;

                    async function runUpdate() {
                        //show the spinner
                        self.helper.mask(self.appWin);
                        self.apiProvider.runScheduledTask('RunRrUpdate');
                        const maxCountOfRefreshUpdateStatus = 350;
                        let countUpdatesStatusAttemp = 0;

                        const updateStatusInterval = setInterval(async function () {
                            const checksStatusResponse = await self.apiProvider.callCustomScript('checkUpdateStatus.cgi?filename=rr_update_progress');
                            if (!checksStatusResponse?.success) {
                                clearInterval(updateStatusInterval);
                                self.helper.unmask(self.appWin);
                                self.showMsg(checksStatusResponse?.status);
                            }
                            const response = checksStatusResponse.result;
                            self.helper.mask(self.appWin, self.helper.formatString(self.helper.V('upload_file_dialog', 'update_rr_progress_msg'), response?.progress ?? "--", response?.progressmsg ?? "--"), 'x-mask-loading');
                            countUpdatesStatusAttemp++;
                            if (countUpdatesStatusAttemp == maxCountOfRefreshUpdateStatus || response?.progress?.startsWith('-')) {
                                clearInterval(updateStatusInterval);
                                self.helper.unmask(self.appWin);
                                self.showMsg(self.helper.formatString(self.helper.V('upload_file_dialog', 'update_rr_progress_msg'), response?.progress, response?.progressmsg));
                            } else if (response?.progress == '100') {
                                self.helper.unmask(self.appWin);
                                clearInterval(updateStatusInterval);
                                self.showMsg(self.helper.V('upload_file_dialog', 'update_rr_completed'));
                            }
                        }, 1500);
                    }
                    self.helper.unmask(self.owner);
                    self.appWin.getMsgBox().confirmDelete(
                        "Confirmation",
                        self.helper.formatString(self.helper.V('upload_file_dialog', 'update_rr_confirmation'), currentRrVersion, updateRrVersion),
                        (userResponse) => {
                            if ("yes" === userResponse) {
                                runUpdate();
                            }
                        },
                        e,
                        {
                            yes: {
                                text: self.helper.V('upload_file_dialog', 'btn_proceed'),
                                btnStyle: "red",
                            },
                            no: { text: self.helper.T("common", "cancel") },
                        }
                    );
                }).catch(error => {
                    self.showMsg(`Error. ${error}`);
                });
            }
            self.appWin.getMsgBox().confirmDelete(
                "Confirm",
                self.helper.V('upload_file_dialog', 'file_uploading_succesfull_msg'),
                (result) => {
                    if (result === "yes") {
                        runUpdate();
                    }
                },
                e,
                {
                    yes: {
                        text: self.helper.T("common", "yes"),
                        btnStyle: "red",
                    },
                    no: { text: Ext.MessageBox.buttonText.no },
                }
            ); 
        },
    }