#!/bin/bash

# Configuration
API_URL="http://localhost:3000"

echo "==============================================="
echo "🛠️  OPS: RESET & TEST SEQUENCE"
echo "==============================================="

# 1. KILL
echo ""
echo "🛑 [1/5] Killing process on port 3000..."
PID=$(lsof -ti:3000)
if [ -n "$PID" ]; then
  echo "   Killing PID $PID on port 3000"
  kill -9 $PID
else
  echo "   No process found on port 3000"
fi
sleep 2

# 2. BUILD
echo ""
echo "🧹 [2/5] Cleaning and Building Project..."
rm -rf dist
if npm run build; then
    echo "✅ Build Successful"
else
    echo "❌ Build Failed"
    exit 1
fi

# 3. START
echo ""
echo "🚀 [3/5] Starting Backend Service..."
npm run start > backend_ops.log 2>&1 &
SERVER_PID=$!
echo "   Wrapper PID: $SERVER_PID"

# 4. WAIT
echo ""
echo "⏳ [4/5] Waiting for Server Health Check..."
UP=0
for i in {1..40}; do
    # Try connecting to the port/root
    if curl -s "$API_URL" > /dev/null || curl -s "$API_URL/clubs" > /dev/null; then
        echo ""
        echo "✅ Server is UP and Listening!"
        UP=1
        break
    fi
    echo -n "."
    sleep 2
done

if [ $UP -eq 0 ]; then
    echo ""
    echo "❌ Server failed to start within timeout."
    echo "   Check backend_ops.log for details."
    exit 1
fi

# 5. SIMULATE
echo ""
echo "🧪 [5/5] Running End-to-End Simulation..."
./simulate_full_flow.sh
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "🏆 SEQUENCE COMPLETED SUCCESSFULLY"
else
    echo "💥 SIMULATION FAILED"
fi

exit $EXIT_CODE
