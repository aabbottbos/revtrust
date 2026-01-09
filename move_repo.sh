#!/bin/bash

# 1. Define paths (using quotes to handle spaces in "Google Drive")
SOURCE_PATH="/Users/andrewabbott/Google Drive/My Drive/Andrew/RevOps/v2/revtrust"
DEST_PARENT="/Users/andrewabbott/Development"
DEST_FINAL="$DEST_PARENT/revtrust"

echo "---------------------------------------------------"
echo "Moving 'revtrust' from Google Drive to Local Dev..."
echo "---------------------------------------------------"

# 2. Safety Check: Does the source actually exist?
if [ ! -d "$SOURCE_PATH" ]; then
    echo "❌ Error: Source folder not found at:"
    echo "$SOURCE_PATH"
    exit 1
fi

# 3. Preparation: Create the destination parent folder if it doesn't exist
if [ ! -d "$DEST_PARENT" ]; then
    echo "Creating directory: $DEST_PARENT"
    mkdir -p "$DEST_PARENT"
fi

# 4. Safety Check: Does the target folder already exist?
# We do not want to accidentally overwrite or merge folders.
if [ -d "$DEST_FINAL" ]; then
    echo "❌ Error: A folder named 'revtrust' already exists in:"
    echo "$DEST_PARENT"
    echo "Please rename or delete the existing folder before running this script."
    exit 1
fi

# 5. Execute the copy 
cp "$SOURCE_PATH" "$DEST_PARENT/"

echo "copy completed"
