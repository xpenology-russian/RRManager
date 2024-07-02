-- Remove the task if it already exists
DELETE FROM task WHERE task_name='RunRrUpdate';
DELETE FROM task WHERE task_name='ApplyRRConfig';
-- insert new tasks
INSERT INTO task VALUES('RunRrUpdate', '', 'bootup', '', 0, 0, 0, 0, '', 0, '. /var/packages/rr-manager/target/ui/config.txt && . /tmp/rr_update_filename && /usr/bin/rr-loaderdisk.sh mountLoaderDisk && /usr/bin/rr-update.sh updateRR "$UPDATE_FILE" /tmp/rr_update_progress && /usr/bin/rr-loaderdisk.sh unmountLoaderDisk', 'script', '{}', '', '', '{}', '{}');
INSERT INTO task VALUES('ApplyRRConfig', '', 'bootup', '', 0, 0, 0, 0, '', 0, 'cp /tmp/user-config.yml /mnt/p1/user-config.yml && cp /tmp/.build /mnt/p1/.build', 'script', '{}', '', '', '{}', '{}');
