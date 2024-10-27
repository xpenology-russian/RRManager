PYTHON_DIR="/var/packages/python311/target/bin"
PACKAGE="rr-manager"
PATH="${SYNOPKG_PKGDEST}/env/bin:${SYNOPKG_PKGDEST}/bin:${SYNOPKG_PKGDEST}/usr/bin:${PYTHON_DIR}:${PATH}"
CFG_FILE="${SYNOPKG_PKGDEST}/app/config.txt"

service_postinst ()
{
    separator="===================================================="

    echo ${separator}
    install_python_virtualenv

    echo ${separator}
    install_python_wheels

    echo ${separator}
    echo "Install packages to the app/libs folder"
    ${SYNOPKG_PKGDEST}/env/bin/pip install --target ${SYNOPKG_PKGDEST}/app/scripts/libs/ -r ${SYNOPKG_PKGDEST}/share/wheelhouse/requirements.txt

    echo ${separator}
     if [ "${SYNOPKG_PKG_STATUS}" == "INSTALL" ]; then
        echo "Populate config.txt"
        sed -i -e "s|@this_is_upload_realpath@|${wizard_download_dir}|g" \
            -e "s|@this_is_sharename@|${wizard_download_share}|g" \
        "${CFG_FILE}"
    fi
}

service_preupgrade ()
{
 # Save configuration files
    rm -fr ${SYNOPKG_TEMP_UPGRADE_FOLDER}/${PACKAGE}
    mkdir -p ${SYNOPKG_TEMP_UPGRADE_FOLDER}/${PACKAGE}

      # Save package config
    mv "${CFG_FILE}" "${SYNOPKG_TEMP_UPGRADE_FOLDER}/${PACKAGE}/config.txt"
}

service_postupgrade ()
{
    rm -f "${CFG_FILE}"
    # Restore package config
    mv "${SYNOPKG_TEMP_UPGRADE_FOLDER}/${PACKAGE}/config.txt" "${CFG_FILE}"
    touch /tmp/rr_manager_installed
    rm -fr ${SYNOPKG_TEMP_UPGRADE_FOLDER}/${PACKAGE}
}

# Uninstall the package does not remove the tasks from the scheduler due to lack of permissions
service_postuninst ()
{
    echo "DELETE FROM task WHERE task_name='RunRrUpdate'" | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db
    echo "DELETE FROM task WHERE task_name='ApplyRRConfig'" | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db
    echo "DELETE FROM task WHERE task_name='SetRootPrivsToRrManager'" | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db
}