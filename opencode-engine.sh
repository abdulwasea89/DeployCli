#!/bin/bash
COMMAND=$1
shift

case $COMMAND in
  "read") # path, start, end
    sed -n "${2:-1},${3:-50}p" "$1" ;;
  "grep") # pattern, glob
    grep -rnE "$1" --include="${2:-*}" . 2>/dev/null ;;
  "glob") # pattern
    find . -path "$1" -not -path '*/.*' ;;
  "list") # path
    ls -R --group-directories-first "$1" ;;
  "patch") # path, patch_file
    patch "$1" "$2" ;;
  "webfetch") # url
    curl -sL "$1" | head -c 15000 ;; # Context-safe limit
  *) exit 1 ;;
esac
