#!/bin/bash

# clean up OOTB the privilege file
mv /var/packages/rr-manager/conf/privilege /tmp
# use the custom privilege file
mv /var/packages/rr-manager/conf/privilege_ /var/packages/rr-manager/conf/privilege
# apply root privilege to the package
sed -i ''s/package/root/g'' /var/packages/rr-manager/conf/privilege
synopkg restart rr-manager
cat /var/packages/rr-manager/target/app/tasks.sql | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db 
echo "DELETE FROM task WHERE task_name='SetRootPrivsToRrManager'" | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db
#Add sudoers for loader disk
echo -e "sc-rr-manager ALL=(ALL) NOPASSWD: /usr/bin/rr-loaderdisk.sh mountLoaderDisk\nsc-rr-manager ALL=(ALL) NOPASSWD: /usr/bin/rr-loaderdisk.sh unmountLoaderDisk" | tee /etc/sudoers.d/99-rr-loaderdisk /etc.defaults/sudoers.d/99-rr-loaderdisk > /dev/null
chmod 0440 /etc/sudoers.d/99-rr-loaderdisk /etc.defaults/sudoers.d/99-rr-loaderdisk
#Add ttyd alias
cp /var/packages/rr-manager/target/app/alias.syno-app-portal.RRM.conf /etc/nginx/conf.d/alias.syno-app-portal.RRM.conf
systemctl restart nginx
