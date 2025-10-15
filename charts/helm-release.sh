#!/bin/bash

set -e

# Default Helm repository URL (can be overridden by environment variable)
HELM_REPO_URL=${HELM_REPO_URL:-"oci://registry.hazerd.dev/deadlock-stats"}

# Check if chart name argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <chart-name>"
    echo ""
    echo "Example: $0 my-app"
    echo "This will process the chart in ./my-app/"
    echo ""
    echo "Environment variables:"
    echo "  HELM_REPO_URL - Helm repository URL (default: $HELM_REPO_URL)"
    exit 1
fi

CHART_NAME=$1
CHART_DIR="./$CHART_NAME"

# Check if chart directory exists
if [ ! -d "$CHART_DIR" ]; then
    echo "Error: Chart directory not found: $CHART_DIR"
    exit 1
fi

echo "========================================="
echo "Processing chart: $CHART_NAME"
echo "========================================="

cd "$CHART_DIR"

# Check if Chart.yaml exists
if [ ! -f "Chart.yaml" ]; then
    echo "Error: Chart.yaml not found in $CHART_DIR"
    exit 1
fi

# Extract current version
CURRENT_VERSION=$(grep '^version:' Chart.yaml | awk '{print $2}')
echo "Current version: $CURRENT_VERSION"

# Split version into major.minor.patch
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Increment patch version
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Update version in Chart.yaml
sed -i "s/^version: .*/version: $NEW_VERSION/" Chart.yaml
echo "Updated Chart.yaml with version $NEW_VERSION"

# Get chart name from Chart.yaml
CHART_NAME_FROM_YAML=$(grep '^name:' Chart.yaml | awk '{print $2}')

# Package the chart
echo "Packaging chart..."
helm package .

# Push to repository
echo "Pushing chart to $HELM_REPO_URL..."
helm push "${CHART_NAME_FROM_YAML}-${NEW_VERSION}.tgz" "$HELM_REPO_URL"
echo "Successfully pushed ${CHART_NAME_FROM_YAML}-${NEW_VERSION}.tgz"

cd - > /dev/null

echo ""
echo "Chart $CHART_NAME processed successfully!"
