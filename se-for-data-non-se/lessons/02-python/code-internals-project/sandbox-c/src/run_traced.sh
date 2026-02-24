#!/bin/bash
set -e

CODE_FILE="$1"
if [ -z "$CODE_FILE" ]; then
    echo "Usage: run_traced.sh <source.c>" >&2
    exit 1
fi

OUTPUT="/tmp/program"
TRACE_FILE="/tmp/trace.json"

gcc -g -o "$OUTPUT" "$CODE_FILE" 2>&1
LD_PRELOAD=/sandbox/lib/malloc_wrapper.so "$OUTPUT" 2>"$TRACE_FILE"
cat "$TRACE_FILE"
