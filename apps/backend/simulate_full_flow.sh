#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
UNIQUE_ID=$(date +%s)
SUBDOMAIN="sim-${UNIQUE_ID}"
ADMIN_EMAIL="admin-${UNIQUE_ID}@sim.com"
ADMIN_PASS="password123"
CLUB_NAME="Simulation Club ${UNIQUE_ID}"

echo "==================================================="
echo "🚀 STARTING END-TO-END SIMULATION"
echo "Club: $CLUB_NAME"
echo "Subdomain: $SUBDOMAIN"
echo "Admin: $ADMIN_EMAIL"
echo "==================================================="


# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s "$API_URL" > /dev/null; then
        echo "✅ Server is UP!"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# 1. REGISTER CLUB AND ADMIN
echo "👉 1. Registering Club & Admin..."
RESPONSE=$(curl -s -X POST "$API_URL/clubs" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$CLUB_NAME\",
    \"subdomain\": \"$SUBDOMAIN\",
    \"email\": \"contact-${UNIQUE_ID}@sim.com\",
    \"adminName\": \"Sim Admin\",
    \"adminEmail\": \"$ADMIN_EMAIL\",
    \"adminPassword\": \"$ADMIN_PASS\"
  }")

# Check for success (simple check if 'id' exists in response)
if [[ $RESPONSE == *"id"* ]]; then
    echo "✅ Registration Successful!"
    # echo "Response: $RESPONSE"
else
    echo "❌ Registration Failed"
    echo "Response: $RESPONSE"
    exit 1
fi

# 2. LOGIN
echo ""
echo "👉 2. Logging in as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASS\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Login Successful! Token received."
else
    echo "❌ Login Failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# 3. GET PROFILE (Verify Club ID)
echo ""
echo "👉 3. Fetching Admin Profile..."
PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/users/profile")
CLUB_ID=$(echo $PROFILE_RESPONSE | jq -r '.clubId')
echo "✅ Club ID: $CLUB_ID"

# 3b. CREATE SEASON
echo ""
echo "👉 3b. Creating Season '2024/2025'..."
SEASON_RESPONSE=$(curl -s -X POST "$API_URL/seasons" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"2024/2025\",
    \"startDate\": \"2024-09-01\",
    \"endDate\": \"2025-06-30\",
    \"isActive\": true
  }")
SEASON_ID=$(echo $SEASON_RESPONSE | jq -r '.id')
if [ "$SEASON_ID" != "null" ]; then
    echo "✅ Season Created: $SEASON_ID"
else
    echo "❌ Season Creation Failed"
    echo "Response: $SEASON_RESPONSE"
    exit 1
fi

# 4. CREATE TEAM
echo ""
echo "👉 4. Creating Team 'Sim Team A'..."
TEAM_RESPONSE=$(curl -s -X POST "$API_URL/teams" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Sim Team A\",
    \"seasonId\": \"$SEASON_ID\",
    \"category\": \"Under-15\",
    \"gender\": \"MALE\"
  }")

TEAM_ID=$(echo $TEAM_RESPONSE | jq -r '.id')
if [ "$TEAM_ID" != "null" ]; then
    echo "✅ Team Created: $TEAM_ID"
else
    echo "❌ Team Creation Failed"
    echo "Response: $TEAM_RESPONSE"
    exit 1
fi

# 5. CREATE PARENT USER
echo ""
echo "👉 5. Creating Parent User..."
PARENT_EMAIL="parent-${UNIQUE_ID}@sim.com"
PARENT_RESPONSE=$(curl -s -X POST "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Sim\",
    \"lastName\": \"Parent\",
    \"email\": \"$PARENT_EMAIL\",
    \"password\": \"password123\",
    \"role\": \"PARENT\"
  }")

PARENT_ID=$(echo $PARENT_RESPONSE | jq -r '.id')
if [ "$PARENT_ID" != "null" ]; then
    echo "✅ Parent Created: $PARENT_ID ($PARENT_EMAIL)"
else
    echo "❌ Parent Creation Failed"
    echo "Response: $PARENT_RESPONSE"
    exit 1
fi

# 6. CREATE PLAYER (ASSOCIATE WITH TEAM AND PARENT)
echo ""
echo "👉 6. Creating Player & Associating..."
PLAYER_RESPONSE=$(curl -s -X POST "$API_URL/players" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Sim\",
    \"lastName\": \"Player\",
    \"birthDate\": \"2012-05-20T00:00:00Z\",
    \"gender\": \"MALE\",
    \"parentId\": \"$PARENT_ID\",
    \"currentTeamId\": \"$TEAM_ID\",
    \"jerseyNumber\": 10
  }")

PLAYER_ID=$(echo $PLAYER_RESPONSE | jq -r '.id')
if [ "$PLAYER_ID" != "null" ]; then
    echo "✅ Player Created: $PLAYER_ID"
    echo "   - Associated with Team: $TEAM_ID"
    echo "   - Associated with Parent: $PARENT_ID"
else
    echo "❌ Player Creation Failed"
    echo "Response: $PLAYER_RESPONSE"
    exit 1
fi

echo ""
echo "==================================================="
echo "🎉 SIMULATION COMPLETED SUCCESSFULLY!"
echo "All systems operational."
echo "==================================================="
