#!/usr/bin/env bash

# Enable error reporting
set -e

# Content-Type header for JSON output
echo "Content-Type: application/json"
echo ""

# Check if required commands are available
for cmd in jq yq sudo /usr/bin/rr-loaderdisk.sh /usr/syno/synoman/webman/modules/authenticate.cgi; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "{\"error\": \"Required command $cmd not found\"}"
        exit 1
    fi
done

# Function to read user configuration from a YAML file
read_user_config() {
    local user_config_path="/mnt/p1/user-config.yml"
    if [[ -f "$user_config_path" ]]; then
        cat "$user_config_path" | yq eval -o=json
    else
        echo '{"error": "Error reading user-config.yml: File not found"}'
    fi
}

# Function to read manifests in subdirectories
read_manifests_in_subdirs() {
    local parent_directory=$1
    local user_config=$2
    local category=$3
    local manifests=()

    local addons=$(echo "$user_config" | jq -r '.addons | join(" ")')

    for subdir in "$parent_directory"/*/; do
        local manifest_path="${subdir}manifest.yml"
        if [[ -f "$manifest_path" ]]; then
            local manifest=$(cat "$manifest_path" | yq eval -o=json)
            if [[ $? -eq 0 ]]; then
                local subdir_name=$(basename "$subdir")
                local installed=$(echo "$addons" | grep -q "$subdir_name" && echo true || echo false)
                manifest=$(echo "$manifest" | jq --arg installed "$installed" '. + {installed: ($installed | test("true"))}')
                if [[ "$category" == "system" ]]; then
                    if [[ $(echo "$manifest" | jq '.system') == "true" ]]; then
                        manifests+=("$manifest")
                    fi
                else
                    manifests+=("$manifest")
                fi
            else
                echo "Error reading $manifest_path"
            fi
        fi
    done

    # Join array elements with commas
    local joined_manifests=$(IFS=,; echo "${manifests[*]}")
    echo "[$joined_manifests]"
}

# Function to call the rr-loaderdisk.sh script with the given action
call_mount_loader_script() {
    local action=$1
    sudo /usr/bin/rr-loaderdisk.sh "$action" >/dev/null 2>&1
}

# Function to mount the loader
mount_loader() {
    call_mount_loader_script "mountLoaderDisk"
}

# Function to unmount the loader
unmount_loader() {
    call_mount_loader_script "unmountLoaderDisk"
}

# Authenticate the user
USER=$(/usr/syno/synoman/webman/modules/authenticate.cgi)

# Initialize response
response='{}'

ADDONS_PATH='/mnt/p3/addons/'

if [ -n "$USER" ]; then
    {
        mount_loader

        # Extract category from query string
        category=$(echo "$QUERY_STRING" | grep -oP '(?<=category=)[^&]*')

        # Read user configuration
        user_config=$(read_user_config)
        if echo "$user_config" | jq . > /dev/null 2>&1; then
            # Read manifests
            addons=$(read_manifests_in_subdirs "$ADDONS_PATH" "$user_config" "$category")

            # Construct the response
            response=$(jq -n --argjson result "$addons" --argjson userConfig "$user_config" --arg success true --arg total "$(echo "$addons" | jq length)" '{"success": $success, "result": $result, "userConfig": $userConfig, "total": $total}')
        else
            response=$(jq -n --arg error "Error reading user-config.yml" '{"success": false, "error": $error}')
        fi

        unmount_loader
    } || {
        response=$(jq -n --arg error "An exception occurred: $?" '{"success": false, "error": $error}')
    }
else
    response=$(jq -n '{"status": "not authenticated"}')
fi

# Print the JSON response
echo "$response"