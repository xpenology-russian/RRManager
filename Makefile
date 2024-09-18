SPK_NAME = rr-manager
SPK_VERS = 2.0
SPK_REV = 71
SPK_ICON = src/rr-manager.png

DSM_UI_DIR = ui
DSM_UI_CONFIG = src/ui/config
DSM_APP_NAME = SYNOCOMMUNITY.RRManager.AppInstance

PYTHON_PACKAGE = python311
SPK_DEPENDS = "python311>=3.11.5-8"

MAINTAINER = T-REX-XP

DESCRIPTION = RR Manager is a Redpill Recovery DSM application aimed to provide the ability to configure/update RR without booting to RR recovery. This package is for experienced users.
STARTABLE = no
DISPLAY_NAME = RR Manager

HOMEPAGE = https://github.com/T-REX-XP/RRManager

CONF_DIR = src/conf
SYSTEM_GROUP = http

SERVICE_USER   = auto
SERVICE_SETUP  = src/service-setup.sh
SSS_SCRIPT = src/dsm-control.sh
COPY_TARGET = nop
POST_STRIP_TARGET = rr-manager_extra_install


include ../../mk/spksrc.common.mk
include ../../mk/spksrc.directories.mk
SERVICE_WIZARD_SHARE = wizard_download_dir
WIZARDS_DIR = $(WORK_DIR)/generated-wizards
WIZARDS = install_uifile upgrade_uifile
SUPPORTED_LANGUAGES = fre

wizards: generated-wizards
include ../../mk/spksrc.spk.mk

.PHONY: generated-wizards
generated-wizards:
	@mkdir -p $(WIZARDS_DIR)
	@for template in $(WIZARDS); do \
		for suffix in '' $(patsubst %,_%,$(SUPPORTED_LANGUAGES)) ; do \
			{\
			  	echo "#!/bin/sh";\
				echo "";\
				cat src/wizard_templates/uifile_vars$${suffix} | sed -e 's/\\/\\\\/g' -e 's/\"/\\\"/g' -e 's/^\([^=]*\)=\\"\(.*\)\\"$$/\1="\2"/g';\
				echo "";\
				cat "$(SPKSRC_MK)spksrc.service.installer.functions";\
				echo "";\
				cat src/wizard_templates/shared_uifile_setup.sh;\
				echo "";\
				cat src/wizard_templates/$${template}.sh;\
			}>$(WIZARDS_DIR)/$${template}$${suffix}.sh;\
		done;\
	done

.PHONY: rr-manager_extra_install
rr-manager_extra_install:
	install -m 755 -d $(STAGING_DIR)/share $(STAGING_DIR)/var
	install -m 755 -d $(STAGING_DIR)/share/wheelhouse/
	install -m 644 src/requirements.txt $(STAGING_DIR)/share/wheelhouse/requirements.txt

	install -m 755 -d $(STAGING_DIR)/ui/
	install -m 755 -d $(STAGING_DIR)/ui/libs/	
	install -m 755 -d $(STAGING_DIR)/ui/scripts/	
	install -m 755 -d $(STAGING_DIR)/ui/images/
	install -m 755 -d $(STAGING_DIR)/ui/images/1x
		
	install -m 755 src/scripts/checkUpdateStatus.cgi $(STAGING_DIR)/ui/scripts/checkUpdateStatus.cgi
	install -m 755 src/scripts/getAddons.cgi $(STAGING_DIR)/ui/scripts/getAddons.cgi
	install -m 755 src/scripts/getAvailableUpdates.cgi $(STAGING_DIR)/ui/scripts/getAvailableUpdates.cgi	
	install -m 755 src/scripts/getConfig.cgi $(STAGING_DIR)/ui/scripts/getConfig.cgi
	install -m 755 src/scripts/getModules.cgi $(STAGING_DIR)/ui/scripts/getModules.cgi
	install -m 755 src/scripts/getNetworkInfo.cgi $(STAGING_DIR)/ui/scripts/getNetworkInfo.cgi
	install -m 755 src/scripts/getRrReleaseInfo.cgi $(STAGING_DIR)/ui/scripts/getRrReleaseInfo.cgi
	install -m 755 src/scripts/readUpdateFile.cgi $(STAGING_DIR)/ui/scripts/readUpdateFile.cgi
	install -m 755 src/scripts/uploadConfigFile.cgi $(STAGING_DIR)/ui/scripts/uploadConfigFile.cgi
	install -m 755 src/scripts/uploadUpdateFileInfo.cgi $(STAGING_DIR)/ui/scripts/uploadUpdateFileInfo.cgi

	install -m 644 src/ui/alias.syno-app-portal.RRM.conf $(STAGING_DIR)/ui/alias.syno-app-portal.RRM.conf
	install -m 644 src/ui/config $(STAGING_DIR)/ui/config
	install -m 755 src/ui/config.txt $(STAGING_DIR)/ui/config.txt	
	install -m 644 src/ui/helptoc.conf $(STAGING_DIR)/ui/helptoc.conf
	install -m 644 src/ui/index.conf $(STAGING_DIR)/ui/index.conf
	install -m 755 src/ui/install.sh $(STAGING_DIR)/ui/install.sh
	install -m 644 src/ui/rr-manager.js $(STAGING_DIR)/ui/rr-manager.js
	install -m 644 src/ui/rr-manager.widget.js $(STAGING_DIR)/ui/rr-manager.widget.js
	install -m 755 src/ui/style.css $(STAGING_DIR)/ui/style.css

	install -m 755 src/images/1x/cate_icn_addons.png $(STAGING_DIR)/ui/images/1x/cate_icn_addons.png
	install -m 755 src/images/1x/cate_icn_overview.png $(STAGING_DIR)/ui/images/1x/cate_icn_overview.png
	install -m 755 src/images/1x/cate_icn_setting.png $(STAGING_DIR)/ui/images/1x/cate_icn_setting.png	
	
	install -m 755 src/ui/tasks.sql $(STAGING_DIR)/ui/tasks.sql

	
	install -m 755 -d $(STAGING_DIR)/ui/help
	for language in enu fre; do \
		install -m 755 -d $(STAGING_DIR)/ui/help/$${language}; \
		install -m 644 src/ui/help/$${language}/simpleapp_index.html $(STAGING_DIR)/ui/help/$${language}/simpleapp_index.html; \
	done
	install -m 755 -d $(STAGING_DIR)/ui/texts
	for language in enu rus chs cht krn; do \
		install -m 755 -d $(STAGING_DIR)/ui/texts/$${language}; \
		install -m 644 src/ui/texts/$${language}/strings $(STAGING_DIR)/ui/texts/$${language}/strings; \
	done
