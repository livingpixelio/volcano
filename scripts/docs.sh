#!/bin/sh
set -e

ROOT="file://$(pwd)/"
OUTFILE="denodoc/tree.json"

deno doc --json ./src/mod.ts | jq --arg root "$ROOT" '
  .nodes |= with_entries(.key |= ltrimstr($root)) |
  walk(if type == "object" and has("filename") then .filename |= ltrimstr($root) else . end)
' > "$OUTFILE"
