#!/usr/bin/env bash
# GitHub ubuntu runners ship google-chrome apt sources. When Google's Packages
# index is mid-publish, `apt-get update` fails with Hash Sum mismatch and
# aborts postgresql-client / playwright --with-deps installs.
set -euo pipefail

sudo rm -f \
  /etc/apt/sources.list.d/google-chrome*.list \
  /etc/apt/sources.list.d/google-chrome*.list.save \
  /etc/apt/sources.list.d/google*.list \
  /etc/apt/sources.list.d/chrome*.list \
  2>/dev/null || true

if [[ -f /etc/apt/sources.list ]]; then
  sudo sed -i '/dl\.google\.com\/linux\/chrome/d' /etc/apt/sources.list || true
fi
