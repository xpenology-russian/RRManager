#!/usr/bin/python

import os
import json
import sys,time
import cgi
import subprocess
from pathlib import Path
path_root = Path(__file__).parents[1]
sys.path.append(str(path_root)+'/libs')

import libs.yaml as yaml
print("Content-type: application/json\n")

arguments = cgi.FieldStorage()
category = arguments.getvalue('category')
#Function to read user configuration from a YAML file
def read_user_config():
    userConfigPath = "/mnt/p1/user-config.yml"
    try:
        with open(userConfigPath, 'r') as file:
            return yaml.safe_load(file)  # Load and parse the YAML file
    except IOError as e:
        return f"Error reading user-config.yml: {e}"
    except e:
        return "{}"



def read_manifests_in_subdirs(parent_directory, userConfig, category=None):
    manifests = []
#    addons = userConfig.get('addons')
    try:
        subdirs = next(os.walk(parent_directory))[1]
    except Exception as e:
        print(f"Error walking the directory {parent_directory}: {e}")
        return manifests

    for subdir in subdirs:  # Iterates through each subdirectory
        try:
            manifest_path = os.path.join(parent_directory, subdir, 'manifest.yml')
            if os.path.exists(manifest_path):  # Check if manifest.yml exists in the subdir
                with open(manifest_path, 'r') as file:
                    try:
                        manifest = yaml.safe_load(file)
                        #manifest['installed'] = subdir in userConfig['addons']
                        # Filter by category if specified
                        if category == "system":
                            # Ensure 'system' key exists and is boolean True
                            if manifest.get('system') is True:
                                manifests.append(manifest)
                        else:
                            manifests.append(manifest)
                    except yaml.YAMLError as exc:
                        print(f"Error reading {manifest_path}: {exc}")
        except Exception as e:
            print(f"Error processing subdir {subdir}: {e}")

    return manifests

# Authenticate the user
f = os.popen('/usr/syno/synoman/webman/modules/authenticate.cgi', 'r')
user = f.read().strip()
ADDONS_PATH = '/mnt/p3/addons/'
response = {}

def callMountLoaderScript(action):
    process = subprocess.Popen(['/usr/bin/rr-loaderdisk.sh', action],
                                stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL)
def mountLoader():
    callMountLoaderScript('mountLoaderDisk')

def unmountLoader():
    callMountLoaderScript('unmountLoaderDisk')

if True: #len(user) > 0:
    try:
    # call function to mount the loader by calling the following bash /usr/bin/rr-loaderdisk.sh mountLoaderDisk
        mountLoader()
        # time.sleep(2)
        response['test']='fff'
        userConfig = read_user_config()
        addons = read_manifests_in_subdirs(ADDONS_PATH,userConfig,category)
        response['result'] = addons
        response['userConfig'] = userConfig
    #response['success'] = True
    #response['total'] = len(addons)
    # call function to unmount the loader by calling the following bash /usr/bin/rr-loaderdisk.sh unmountLoaderDisk
        unmountLoader()
    except Exception as e:
        response['error'] = 'An exception occurred: {}'.format(e)
else:
    response["status"] = "not authenticated"

# Print the JSON response
print(json.dumps(response))