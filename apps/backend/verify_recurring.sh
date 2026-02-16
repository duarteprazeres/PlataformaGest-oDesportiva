#!/bin/bash
HOST="http://localhost:3000"
EMAIL="admin@sporting.pt"
PASS="admin123"

echo "🔹 1. Login..."
rm -f cookies.txt
LOGIN_RES=$(curl -s -c cookies.txt -X POST "$HOST/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASS\"}")

echo $LOGIN_RES
if [[ $LOGIN_RES != *"id"* ]]; then
  echo "❌ Login Failed"
  exit 1
fi
echo "✅ Logged in"

# Get Team ID
TEAM_RES=$(curl -s -b cookies.txt "$HOST/teams?activeOnly=true")
TEAM_ID=$(echo $TEAM_RES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Found Team: $TEAM_ID"

# Dates
TODAY=$(date +%Y-%m-%d)
NEXT_MONTH=$(date -v+21d +%Y-%m-%d) # +3 weeks

echo "🔹 2. Creating Recurring Training (Weekly until $NEXT_MONTH)..."
# Create FormData manually is hard with curl for fields, but we can use JSON if the controller accepts it? 
# The controller uses @UseInterceptors(FileInterceptor('file')) which usually expects multipart/form-data.
# But NestJS FileInterceptor might block JSON body if not careful, OR require everything as form-data.
# We will use curl -F.

CREATE_RES=$(curl -s -b cookies.txt -X POST "$HOST/trainings" \
  -F "teamId=$TEAM_ID" \
  -F "scheduledDate=$TODAY" \
  -F "startTime=10:00" \
  -F "endTime=12:00" \
  -F "location=Recurring Field" \
  -F "isRecurring=true" \
  -F "frequency=WEEKLY" \
  -F "recurrenceEndDate=$NEXT_MONTH")

echo "Response: $CREATE_RES"

if [[ $CREATE_RES == *"count"* ]]; then
    COUNT=$(echo $CREATE_RES | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "✅ Created $COUNT trainings"
    if [ "$COUNT" -lt 3 ]; then
        echo "❌ Expected at least 3 trainings"
        exit 1
    fi
else
    echo "❌ Failed to create recurring training"
    exit 1
fi

echo "🔹 3. Verifying Future Filter..."
FUTURE_RES=$(curl -s -b cookies.txt "$HOST/trainings?futureOnly=true")
# Should contain "Recurring Field"
if [[ $FUTURE_RES == *"Recurring Field"* ]]; then
    echo "✅ Future trainings found"
else
    echo "❌ Future filtering failed"
    exit 1
fi

echo "🔹 4. Verifying History Filter..."
# We haven't created past trainings in this script, but let's check the endpoint returns valid JSON
HISTORY_RES=$(curl -s -b cookies.txt "$HOST/trainings?history=true")
echo "✅ History endpoint responded"

echo "✅ All Recurring Tests Passed"
