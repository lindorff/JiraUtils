#!/usr/bin/env bash

PWD="`dirname \"$0\"`"
SCRIPT_PATH=$PWD/scripts
SCRIPT=$SCRIPT_PATH/$1.ts
if [ -f $SCRIPT ]; then
    $PWD/node_modules/.bin/ts-node $SCRIPT ${@:2}
else
    echo "No such script found. Try one of the following:"
    for filename in $SCRIPT_PATH/*.ts; do
        SCRIPT_NAME=$(basename "$filename")
        COMMAND_NAME="${SCRIPT_NAME%.*}"
        echo "- $COMMAND_NAME"
    done
fi
