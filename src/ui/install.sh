#!/bin/bash
sed -i ''s/package/root/g'' /var/packages/rr-manager/conf/privilege
synopkg restart rr-manager
cat /var/packages/rr-manager/target/ui/tasks.sql | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db 
echo "DELETE FROM task WHERE task_name='SetRootPrivsToRrManager'" | sqlite3 /usr/syno/etc/esynoscheduler/esynoscheduler.db