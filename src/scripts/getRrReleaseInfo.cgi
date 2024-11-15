#!/usr/bin/env bash
# Assuming jq is installed on your system for parsing and generating JSON
# Content-Type header for JSON output
echo "Content-type: application/json"
echo ""

USER=$(/usr/syno/synoman/webman/modules/authenticate.cgi)

if [ "${USER}" = "" ]; then
  echo '{"error": "Security: user not authenticated"}'
else
  # Get DSM proxy configuration
  proxy_response=$(synowebapi --exec api=SYNO.Core.Network.Proxy method=get version=1)
  proxy_enable=$(echo "${proxy_response}" | jq -r '.data.enable')
  proxy_host=$(echo "${proxy_response}" | jq -r '.data.http_host')
  proxy_port=$(echo "${proxy_response}" | jq -r '.data.http_port')
  proxy_username=$(echo "${proxy_response}" | jq -r '.data.username')
  proxy_password=$(echo "${proxy_response}" | jq -r '.data.password')
  # Define the URL for GitHub API
  URL="https://api.github.com/repos/RROrg/rr/releases/latest"

  # Construct proxy string if proxy is enabled
  if [ "${proxy_enable}" = "true" ]; then
    if [ -n "${proxy_username}" ] && [ -n "${proxy_password}" ]; then
      proxy="http://${proxy_username}:${proxy_password}@${proxy_host}:${proxy_port}"
    else
      proxy="http://${proxy_host}:${proxy_port}"
    fi
    response=$(curl -s "${URL}" --proxy "${proxy}")
    proxy_used=true
  else
    response=$(curl -s "${URL}")
    proxy_used=false
  fi

  # Extract the tag name from the response
  TAG=$(echo "${response}" | jq -r '.tag_name')
  RELEASE_LINK=$(echo "${response}" | jq -r '.html_url')
  # Read local version
  LOCALTAG=$(cat /usr/rr/VERSION 2>/dev/null | grep LOADERVERSION | cut -d'=' -f2)
  # Construct the download link
  DOWNLOAD_LINK="https://github.com/RROrg/rr/releases/download/${TAG}/updateall-${TAG}.zip"

  # Check if LOCALTAG is empty
  if [ -z "${LOCALTAG}" ]; then
    # Generate error message using jq
    echo "{}" | jq --arg message "Unknown bootloader version!" '.error = $message'
    exit 0
  fi

  # Generate output JSON
  if [ "${TAG}" = "${LOCALTAG}" ]; then
    # Use jq to generate JSON for up-to-date status
    echo "{}" | jq --arg tag "$TAG" --arg url "$RELEASE_LINK" --arg updateAllUrl "$DOWNLOAD_LINK" --arg message "Actual version is ${TAG}" --argjson proxyUsed "$proxy_used" \
      '.status = "up-to-date" | .tag = $tag | .message = $message | .url = $url | .updateAllUrl = $updateAllUrl | .proxyUsed = $proxyUsed'
  else
    # Use jq to generate JSON for update available, including release notes
    # Fetch and escape release notes from GitHub API response
    releaseNotes=$(echo "${response}" | jq '.body')
    
    # Use jq to build the JSON response
    echo "{}" | jq --arg tag "$TAG" --argjson notes "$releaseNotes" --arg url "$RELEASE_LINK" --arg updateAllUrl "$DOWNLOAD_LINK" --argjson proxyUsed "$proxy_used" \
      '.status = "update available" | .tag = $tag | .notes = $notes | .url = $url | .updateAllUrl = $updateAllUrl | .proxyUsed = $proxyUsed'
  fi

fi