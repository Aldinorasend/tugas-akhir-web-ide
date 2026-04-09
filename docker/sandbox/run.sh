#!/bin/bash

# This script compiles and runs a single Java file
FILE_PATH=$1

if [ -z "$FILE_PATH" ]; then
    echo "Error: No file path provided."
    exit 1
fi

# Extract filename without extension for running
FILENAME=$(basename -- "$FILE_PATH")
CLASSNAME="${FILENAME%.*}"

# Compile
javac "$FILE_PATH"
if [ $? -ne 0 ]; then
    echo "Compilation Failed."
    exit 1
fi

# Execute
java "$CLASSNAME"
