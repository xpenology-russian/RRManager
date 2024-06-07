#!/bin/bash

# clean up OOTB the privilege file
mv /var/packages/rr-manager/conf/privilege /tmp
# use the custom privilege file
mv /var/packages/rr-manager/conf/privilege_ /var/packages/rr-manager/conf/privilege
# apply root privilege to the package
sed -i ''s/package/root/g'' /var/packages/rr-manager/conf/privilege
synopkg restart rr-manager
cat /var/packages/rr-manager/target/ui/tasks.sql | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db 
echo "DELETE FROM task WHERE task_name='SetRootPrivsToRrManager'" | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db