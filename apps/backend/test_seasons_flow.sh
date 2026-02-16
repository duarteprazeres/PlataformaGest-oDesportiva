#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
UNIQUE_ID=$(date +%s)
SUBDOMAIN="sea-${UNIQUE_ID}"
ADMIN_EMAIL="admin-${UNIQUE_ID}@sea.com"
ADMIN_PASS="password123"
CLUB_NAME="Season Club ${UNIQUE_ID}"

echo "==================================================="
echo "🍂 TESTING SEASONS FLOW"
echo "Club: $CLUB_NAME"
echo "==================================================="

# 1. REGISTER CLUB
echo ""
echo "👉 1. Registering Club..."
RESPONSE=$(curl -s -X POST "$API_URL/clubs" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$CLUB_NAME\",
    \"subdomain\": \"$SUBDOMAIN\",
    \"email\": \"contact-${UNIQUE_ID}@sea.com\",
    \"adminName\": \"Season Admin\",
    \"adminEmail\": \"$ADMIN_EMAIL\",
    \"adminPassword\": \"$ADMIN_PASS\"
  }")

if [[ $RESPONSE != *"id"* ]]; then
    echo "❌ Registration Failed"
    echo $RESPONSE
    exit 1
fi
echo "✅ Club Registered"

# 2. LOGIN
echo ""
echo "👉 2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASS\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
if [ "$TOKEN" == "null" ]; then
    echo "❌ Login Failed"
    exit 1
fi
echo "✅ Logged In"

# 3. CREATE SEASON
echo ""
echo "👉 3. Creating Season '2024/2025'..."
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
if [ "$SEASON_ID" == "null" ]; then
    echo "❌ Season Creation Failed"
    echo $SEASON_RESPONSE
    exit 1
fi
echo "✅ Season Created: $SEASON_ID"

# 4. CREATE TEAM WITH SEASON
echo ""
echo "👉 4. Creating Team Linked to Season..."
TEAM_RESPONSE=$(curl -s -X POST "$API_URL/teams" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Season Team A\",
    \"seasonId\": \"$SEASON_ID\", 
    \"category\": \"Senior\",
    \"gender\": \"MALE\"
  }")

TEAM_ID=$(echo $TEAM_RESPONSE | jq -r '.id')
TEAM_SEASON_ID=$(echo $TEAM_RESPONSE | jq -r '.seasonId')

if [ "$TEAM_ID" != "null" ] && [ "$TEAM_SEASON_ID" == "$SEASON_ID" ]; then
    echo "✅ Team Created: $TEAM_ID"
    echo "✅ Team correctly linked to Season: $TEAM_SEASON_ID"
else
    echo "❌ Team Creation Failed or Not Linked"
    echo $TEAM_RESPONSE
    exit 1
fi

echo ""
echo "🎉 SEASONS FLOW VERIFIED!"
