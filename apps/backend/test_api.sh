#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
SUBDOMAIN="fcporto"
EMAIL="admin@fcporto.pt"
PASSWORD="123456"

echo "==========================================="
echo "🧪 Testing Backend Endpoints"
echo "==========================================="

# 1. Test Club Resolution
echo "1. Fetching Club by Subdomain ($SUBDOMAIN)..."
response=$(curl -s -w "\n%{http_code}" $API_URL/clubs/by-subdomain/$SUBDOMAIN)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$status" -eq 200 ]; then
    echo "✅ Success! Club Name: $(echo $body | jq -r '.name')"
    CLUB_ID=$(echo $body | jq -r '.id')
else
    echo "❌ Failed to fetch club. Status: $status"
    echo "Body: $body"
    exit 1
fi

echo "-------------------------------------------"

# 2. Test Login
echo "2. Testing Authentication ($EMAIL)..."
response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$status" -eq 201 ]; then
    echo "✅ Login Successful!"
    TOKEN=$(echo $body | jq -r '.access_token')
    USER_ID=$(echo $body | jq -r '.user.id')
    echo "🔑 Token received!"
    echo "👤 User ID: $USER_ID"
else
    echo "❌ Login Failed. Status: $status"
    echo "Body: $body"
    exit 1
fi

echo "-------------------------------------------"

# 3. Create Team
# Check if exists first or just try create and handle error
echo "3. Creating Team 'Sub-15 A'..."
response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sub-15 A",
    "season": "2024/2025",
    "category": "Youth",
    "gender": "MALE"
  }')

status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$status" -eq 201 ]; then
    echo "✅ Team Created: $(echo $body | jq -r '.name')"
    TEAM_ID=$(echo $body | jq -r '.id')
else
    echo "⚠️  Failed to create team (likely exists). Status: $status"
    # Try to fetch teams to get an ID
    echo "   Fetching existing teams..."
    response_list=$(curl -s -w "\n%{http_code}" -X GET $API_URL/teams \
      -H "Authorization: Bearer $TOKEN")
    status_list=$(echo "$response_list" | tail -n1)
    body_list=$(echo "$response_list" | sed '$d')
    
    if [ "$status_list" -eq 200 ]; then
        # Take the first team ID
        TEAM_ID=$(echo $body_list | jq -r '.[0].id')
        TEAM_NAME=$(echo $body_list | jq -r '.[0].name')
        echo "   Using existing Team: $TEAM_NAME ($TEAM_ID)"
    else
        echo "❌ Failed to fetch teams list."
    fi
fi

echo "-------------------------------------------"

# 4. Create Player
if [ -z "$TEAM_ID" ] || [ "$TEAM_ID" == "null" ]; then
    echo "⚠️  Skipping Player creation because Team ID is missing."
else
    echo "4. Creating Player 'Joaozinho'..."
    response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/players \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"firstName\": \"Joaozinho\",
        \"lastName\": \"Silva\",
        \"birthDate\": \"2010-01-15T00:00:00Z\",
        \"parentId\": \"$USER_ID\",
        \"currentTeamId\": \"$TEAM_ID\",
        \"gender\": \"MALE\",
        \"jerseyNumber\": 10
      }")

    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status" -eq 201 ]; then
        echo "✅ Player Created: $(echo $body | jq -r '.firstName') $(echo $body | jq -r '.lastName')"
    elif [ "$status" -eq 500 ]; then
         echo "❌ Failed to create player (500). Body: $body"
    else
        echo "❌ Failed to create player. Status: $status"
        echo "Body: $body"
    fi
fi

echo "==========================================="
