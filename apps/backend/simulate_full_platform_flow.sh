#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
UNIQUE_ID=$(date +%s)
SUBDOMAIN="club-sim-${UNIQUE_ID}"
ADMIN_EMAIL="admin-${UNIQUE_ID}@sim.com"
PARENT_EMAIL="parent-${UNIQUE_ID}@sim.com"
PASS="password123"

echo "==================================================="
echo "🚀 STARTING FULL PLATFORM SIMULATION (v2)"
echo "Unique ID: $UNIQUE_ID"
echo "Club Subdomain: $SUBDOMAIN"
echo "Admin: $ADMIN_EMAIL"
echo "Parent: $PARENT_EMAIL"
echo "==================================================="

# Helper function
check_success() {
    if [[ $1 == *"id"* ]] || [[ $1 == *"access_token"* ]] || [[ $1 == *"publicId"* ]]; then
        echo "✅ Success"
    else
        echo "❌ Failed"
        echo "Response: $1"
        exit 1
    fi
}

check_id() {
    echo "DEBUG: Checking ID value: '$1'"
    if [ "$1" != "null" ] && [ -n "$1" ]; then
        echo "✅ ID Retrieved: $1"
    else
        echo "❌ Failed to retrieve ID"
        exit 1
    fi
}

# 1. Register Club
echo ""
echo "👉 1. Registering Club..."
CLUB_RESP=$(curl -s -X POST "$API_URL/clubs" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Simulation Club ${UNIQUE_ID}\",
    \"subdomain\": \"$SUBDOMAIN\",
    \"email\": \"contact-${UNIQUE_ID}@sim.com\",
    \"adminName\": \"Sim Admin\",
    \"adminEmail\": \"$ADMIN_EMAIL\",
    \"adminPassword\": \"$PASS\"
  }")
echo "DEBUG RESPONSE: $CLUB_RESP"
check_success "$CLUB_RESP"
CLUB_ID=$(echo $CLUB_RESP | jq -r '.club.id')
check_id "$CLUB_ID"

# 2. Login Admin
echo ""
echo "👉 2. Logging in as Admin..."
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$PASS\"}")
echo "DEBUG LOGIN RESPONSE: $LOGIN_RESP"
check_success "$LOGIN_RESP"
ADMIN_TOKEN=$(echo $LOGIN_RESP | jq -r '.access_token')
echo "DEBUG ADMIN TOKEN: $ADMIN_TOKEN"

# 3. Create Season & team
echo ""
echo "👉 3. Creating Season & Team..."
SEASON_RESP=$(curl -s -X POST "$API_URL/seasons" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"2024/2025\",
    \"startDate\": \"2024-09-01\",
    \"endDate\": \"2025-06-30\",
    \"isActive\": true
  }")
echo "DEBUG SEASON RESPONSE: $SEASON_RESP"
SEASON_ID=$(echo $SEASON_RESP | jq -r '.id')
check_id "$SEASON_ID"

TEAM_RESP=$(curl -s -X POST "$API_URL/teams" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Sim Team U15\",
    \"seasonId\": \"$SEASON_ID\",
    \"category\": \"Under-15\",
    \"gender\": \"MALE\"
  }")
TEAM_ID=$(echo $TEAM_RESP | jq -r '.id')
check_id "$TEAM_ID"

# 4. Create Training
echo ""
echo "👉 4. Creating Training for Tomorrow..."
TOMORROW=$(date -v+1d +%Y-%m-%d)
TRAINING_RESP=$(curl -s -X POST "$API_URL/trainings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM_ID\",
    \"scheduledDate\": \"${TOMORROW}T18:00:00Z\",
    \"startTime\": \"18:00\",
    \"endTime\": \"19:30\",
    \"location\": \"Sim Stadium\",
    \"type\": \"TACTICAL\",
    \"title\": \"Tactical Prep\",
    \"description\": \"Focus on defense\"
  }")
TRAINING_ID=$(echo $TRAINING_RESP | jq -r '.id')
check_id "$TRAINING_ID"

# 5. Register Global Parent & Athlete
echo ""
echo "👉 5. Registering Global Parent & Athlete..."
PARENT_RESP=$(curl -s -X POST "$API_URL/auth/global/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$PARENT_EMAIL\",
    \"password\": \"$PASS\",
    \"firstName\": \"Global\",
    \"lastName\": \"Parent\"
  }")
check_success "$PARENT_RESP"
PARENT_TOKEN=$(echo $PARENT_RESP | jq -r '.access_token')

ATHLETE_RESP=$(curl -s -X POST "$API_URL/athletes" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Global\",
    \"lastName\": \"Athlete\",
    \"birthDate\": \"2010-01-01T00:00:00Z\",
    \"gender\": \"MALE\"
  }")
check_success "$ATHLETE_RESP"
ATHLETE_ID=$(echo $ATHLETE_RESP | jq -r '.id')
PUBLIC_ID=$(echo $ATHLETE_RESP | jq -r '.publicId')
check_id "$ATHLETE_ID"
echo "   Public ID: $PUBLIC_ID"

# 6. Association Flow (Transfer)
echo ""
echo "👉 6. Associating Athlete with Club..."
# Club requests
TRANSFER_RESP=$(curl -s -X POST "$API_URL/athletes/transfer-request" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"publicId\": \"$PUBLIC_ID\"}")
check_success "$TRANSFER_RESP"
REQUEST_ID=$(echo $TRANSFER_RESP | jq -r '.id')

# Parent approves
APPROVE_RESP=$(curl -s -X PATCH "$API_URL/athletes/transfers/$REQUEST_ID/approve" \
  -H "Authorization: Bearer $PARENT_TOKEN")
check_success "$APPROVE_RESP"
PLAYER_ID=$(echo $APPROVE_RESP | jq -r '.id')
check_id "$PLAYER_ID"
echo "   Player ID: $PLAYER_ID"

# Update player to combine with team
UPDATE_PLAYER_RESP=$(curl -s -X PATCH "$API_URL/players/$PLAYER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentTeamId\": \"$TEAM_ID\", \"status\": \"ACTIVE\"}")
check_success "$UPDATE_PLAYER_RESP"
echo "   Player added to Team U15"

# 7. Parent Submits Absence Notice
echo ""
echo "👉 7. Parent Submitting Absence Notice..."
NOTICE_RESP=$(curl -s -X POST "$API_URL/absence-notices" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"athleteId\": \"$ATHLETE_ID\",
    \"trainingId\": \"$TRAINING_ID\",
    \"type\": \"ABSENCE\",
    \"reason\": \"Sore throat and fever\"
  }")
check_success "$NOTICE_RESP"
NOTICE_ID=$(echo $NOTICE_RESP | jq -r '.id')
check_id "$NOTICE_ID"
echo "   Notice Submitted: $NOTICE_ID"

# 8. Admin/Coach Validates Notice
echo ""
echo "👉 8. Coach Validating Absence Notice (Create Injury)..."
VALIDATE_RESP=$(curl -s -X PATCH "$API_URL/absence-notices/$NOTICE_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"createInjury\": true,
    \"injuryData\": {
        \"name\": \"Flu\",
        \"severity\": \"MILD\",
        \"estimatedRecoveryDays\": 3
    },
    \"reviewNotes\": \"Get well soon\"
  }")
check_success "$VALIDATE_RESP"
echo "✅ Notice Approved & Injury Created"

# 9. Verify Final State
echo ""
echo "👉 9. Verifying Final State..."
# Check Notice Status
NOTICE_FINAL=$(curl -s -H "Authorization: Bearer $PARENT_TOKEN" "$API_URL/absence-notices/parent")
STATUS=$(echo $NOTICE_FINAL | jq -r ".[0].status")
if [ "$STATUS" == "APPROVED" ]; then
    echo "✅ Notice Status: APPROVED"
else
    echo "❌ Notice Status Mismatch: $STATUS"
fi

# Check Injury Created
INJURIES_RESP=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/injuries?playerId=$PLAYER_ID")
INJURY_NAME=$(echo $INJURIES_RESP | jq -r ".[0].name")
if [ "$INJURY_NAME" == "Flu" ]; then
    echo "✅ Injury Validated: Flu"
else
    echo "❌ Injury Not Found"
fi

echo ""
echo "==================================================="
echo "🎉 FULL PLATFORM SIMULATION COMPLETE!"
echo "==================================================="
