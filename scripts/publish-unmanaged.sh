#!/usr/bin/env bash
set -euo pipefail

# Publish this PCF control as an unmanaged Dataverse solution.
#
# Prerequisites:
# - Power Platform CLI (`pac`) installed and authenticated (`pac auth create`).
# - .NET SDK / MSBuild available (for `dotnet build` packaging).
# - Node dependencies installed for the control project.
#
# Usage:
#   scripts/publish-unmanaged.sh \
#     --publisher-name "Contoso" \
#     --publisher-prefix "cts" \
#     --solution-name "EntityKeywordTags" \
#     --solution-version "1.0.0.0" \
#     --environment-url "https://org.crm.dynamics.com"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTROL_DIR="${ROOT_DIR}/EntityListAsKeywordControl"
DIST_DIR="${ROOT_DIR}/dist"

PUBLISHER_NAME=""
PUBLISHER_PREFIX=""
SOLUTION_NAME=""
SOLUTION_VERSION="1.0.0.0"
ENVIRONMENT_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --publisher-name) PUBLISHER_NAME="$2"; shift 2 ;;
    --publisher-prefix) PUBLISHER_PREFIX="$2"; shift 2 ;;
    --solution-name) SOLUTION_NAME="$2"; shift 2 ;;
    --solution-version) SOLUTION_VERSION="$2"; shift 2 ;;
    --environment-url) ENVIRONMENT_URL="$2"; shift 2 ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "${PUBLISHER_NAME}" || -z "${PUBLISHER_PREFIX}" || -z "${SOLUTION_NAME}" || -z "${ENVIRONMENT_URL}" ]]; then
  echo "Missing required options." >&2
  echo "Required: --publisher-name --publisher-prefix --solution-name --environment-url" >&2
  exit 1
fi

echo "==> Building PCF control"
pushd "${CONTROL_DIR}" >/dev/null
npm ci
npm run build
popd >/dev/null

echo "==> Creating temporary solution workspace"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT
pushd "${TMP_DIR}" >/dev/null

pac solution init \
  --publisher-name "${PUBLISHER_NAME}" \
  --publisher-prefix "${PUBLISHER_PREFIX}" \
  --outputDirectory .

pac solution add-reference --path "${CONTROL_DIR}"

echo "==> Packing unmanaged solution zip"
dotnet build --configuration Release

mkdir -p "${DIST_DIR}"
UNMANAGED_ZIP="$(find . -type f -name "*_unmanaged.zip" | head -n 1)"
if [[ -z "${UNMANAGED_ZIP}" ]]; then
  echo "Could not find unmanaged solution zip after build." >&2
  exit 1
fi

TARGET_ZIP="${DIST_DIR}/${SOLUTION_NAME}_${SOLUTION_VERSION}_unmanaged.zip"
cp "${UNMANAGED_ZIP}" "${TARGET_ZIP}"

echo "==> Selecting Dataverse environment"
pac org select --environment "${ENVIRONMENT_URL}"

echo "==> Importing unmanaged solution"
pac solution import \
  --path "${TARGET_ZIP}" \
  --force-overwrite true \
  --publish-changes true

echo "==> Done"
echo "Imported unmanaged solution: ${TARGET_ZIP}"

