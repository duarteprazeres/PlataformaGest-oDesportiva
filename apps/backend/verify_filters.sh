#!/bin/bash
API_URL="http://localhost:3000"
EMAIL="admin@sporting.pt"
PASSWORD="admin123"

# Check if server is up
echo "Checking server status..."
curl -I $API_URL > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Server is NOT reachable at $API_URL"
    exit 1
fi
echo "✅ Server is up"

echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "Login Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed to extract token"
  exit 1
fi
echo "✅ Login successful"

echo "2. Fetching Active Season..."
ACTIVE_SEASON_RESPONSE=$(curl -s -X GET $API_URL/seasons/active -H "Authorization: Bearer $TOKEN")
echo "Active Season Response: $ACTIVE_SEASON_RESPONSE"

ACTIVE_SEASON_ID=$(echo $ACTIVE_SEASON_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACTIVE_SEASON_ID" ]; then
  echo "❌ Failed to get active season"
  exit 1
fi
echo "✅ Active Season ID: $ACTIVE_SEASON_ID"

echo "3. Fetching Teams (Active Season Filter: $ACTIVE_SEASON_ID)..."
TEAMS_ACTIVE=$(curl -s -X GET "$API_URL/teams?seasonId=$ACTIVE_SEASON_ID" \
  -H "Authorization: Bearer $TOKEN")
COUNT_ACTIVE=$(echo $TEAMS_ACTIVE | jq length)
echo "   Count: $COUNT_ACTIVE"

if [ "$COUNT_ACTIVE" -eq "3" ]; then
    echo "✅ Correctly found 3 teams for active season"
else
    echo "❌ Expected 3 teams, found $COUNT_ACTIVE"
fi

# Check inactive season (should be 0 for this season ID if we filter by inactive season, but let's just trust valid count for now)
echo "DONE"
