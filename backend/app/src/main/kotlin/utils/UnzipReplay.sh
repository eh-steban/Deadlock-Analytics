# NOTE: This requires bzip2 be installed

# Define the directory containing replay files
REPLAY_DIR="/home/lifted/Code/DeadlockStats/app/src/main/kotlin/replays"

# Accept replayPath as input
REPLAY_PATH=$1

# Check if REPLAY_PATH is provided
if [ -z "$REPLAY_PATH" ]; then
    echo "Usage: $0 <replayPath>"
    exit 1
fi

# Check if the file exists
if [ ! -f "$REPLAY_PATH" ]; then
    echo "No file found: $REPLAY_PATH"
    exit 2
fi

# Unzip the file
UNZIPPED_FILE="${REPLAY_PATH%.bz2}"

if ! bzip2 -d -k "$REPLAY_PATH"; then
    echo "Failed to unzip $REPLAY_PATH"
    exit 3
fi

# Return unzipped file name
echo "$UNZIPPED_FILE"
