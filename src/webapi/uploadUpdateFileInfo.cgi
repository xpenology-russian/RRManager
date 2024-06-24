#!/usr/bin/python

import os
import json
import sys
import cgi

from http import cookies
from pathlib import Path
from urllib.parse import parse_qs, unquote
path_root = Path(__file__).parents[1]
sys.path.append(str(path_root)+'/libs')

import libs.yaml as yaml
print("Content-type: application/json\n")

response = {}
response['success'] = False
# Authenticate the user
f = os.popen('/usr/syno/synoman/webman/modules/authenticate.cgi', 'r')
user = f.read().strip()
message =""

if len(user) > 0:
    # Read the request body to get the JSON data
    ctype, pdict = cgi.parse_header(os.environ["CONTENT_TYPE"])
        # Extract query string from environment variable
    query_string = os.environ.get('QUERY_STRING', '')
    query_params = parse_qs(query_string)
    file_name_encoded = query_params.get('file', [None])[0]
    file_name = unquote(file_name_encoded) 
    message ='after write build'      
    try:
        with open('/tmp/rr_update_filename', 'w') as build_file:
            build_file.write('UPDATE_FILE='+file_name+'\n')
            message ='after write build'
            response['success'] = True
            response['file_name'] = file_name
    except Exception as e:
        response["error"] = str(e)
    response['message'] = message
else:
    response["status"] = "not authenticated"

# Print the JSON response
print(json.dumps(response))
