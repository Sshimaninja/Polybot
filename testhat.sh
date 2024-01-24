#!/bin/bash
# Kill any existing Hardhat node process
pkill -f "hardat"


# Start the Hardhat node in the background
npx hardhat node & hardhat_pid=$!

# Wait for the node to launch
sleep 10

# Run the deployment script
npx hardhat run --network hardhat scripts/deployTest.ts

# # Prompt the user to stop the node
echo "Press any key to stop the Hardhat node..."
read -n 1 -s

# Stop the Hardhat node
kill $hardhat_pid
