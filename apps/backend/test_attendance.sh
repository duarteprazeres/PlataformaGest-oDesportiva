#!/bin/bash
# Test Attendance Marking Flow
# Usage: ./test_attendance.sh

set -e  # Exit on error

API_URL="http://localhost:3000"

echo "🧪 Testing Attendance Marking System"
echo "========================================="

# 1. Login as admin
echo ""
echo "1️⃣  Logging in as admin..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sporting.pt","password":"admin123"}' \
  | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi
echo "✅ Login successful (token: ${TOKEN:0:20}...)"

# 2. Get teams to find team ID
echo ""
echo "2️⃣  Getting teams..."
TEAMS_RESPONSE=$(curl -s -X GET "$API_URL/teams" \
  -H "Authorization: Bearer $TOKEN")

TEAM_ID=$(echo "$TEAMS_RESPONSE" | jq -r '.[0].id')
TEAM_NAME=$(echo "$TEAMS_RESPONSE" | jq -r '.[0].name')
echo "✅ Using team: $TEAM_NAME ($TEAM_ID)"

# 3. Get players from that team
echo ""
echo "3️⃣  Getting players from team..."
TEAM_DETAILS=$(curl -s -X GET "$API_URL/teams/$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN")

PLAYER_1_ID=$(echo "$TEAM_DETAILS" | jq -r '.players[0].id')
PLAYER_1_NAME=$(echo "$TEAM_DETAILS" | jq -r '.players[0].firstName + " " + .players[0].lastName')
PLAYER_1_STATUS=$(echo "$TEAM_DETAILS" | jq -r '.players[0].medicalStatus')

PLAYER_2_ID=$(echo "$TEAM_DETAILS" | jq -r '.players[1].id')
PLAYER_2_NAME=$(echo "$TEAM_DETAILS" | jq -r '.players[1].firstName + " " + .players[1].lastName')
PLAYER_2_STATUS=$(echo "$TEAM_DETAILS" | jq -r '.players[1].medicalStatus')

echo "   Player 1: $PLAYER_1_NAME ($PLAYER_1_STATUS)"
echo "   Player 2: $PLAYER_2_NAME ($PLAYER_2_STATUS)"

# 4. Create a training
echo ""
echo "4️⃣  Creating training session..."
TRAINING_RESPONSE=$(curl -s -X POST "$API_URL/trainings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM_ID\",
    \"scheduledDate\": \"2026-02-10\",
    \"startTime\": \"18:00\",
    \"endTime\": \"19:30\",
    \"location\": \"Campo 1\",
    \"notes\": \"Teste de presenças\"
  }")

echo "$TRAINING_RESPONSE" | jq '.'

# Get first training ID (since createMany returns count)
echo ""
echo "5️⃣  Getting created training..."
TRAININGS_LIST=$(curl -s -X GET "$API_URL/trainings?futureOnly=true" \
  -H "Authorization: Bearer $TOKEN")

TRAINING_ID=$(echo "$TRAININGS_LIST" | jq -r '[.[] | select(.notes == "Teste de presenças")] | .[0].id')

if [ "$TRAINING_ID" == "null" ] || [ -z "$TRAINING_ID" ]; then
    echo "❌ Training creation failed or not found"
    exit 1
fi
echo "✅ Training created: $TRAINING_ID"

# 6. Mark attendance for valid players
echo ""
echo "6️⃣  Marking attendance (valid scenario)..."
ATTENDANCE_RESPONSE=$(curl -s -X POST "$API_URL/trainings/$TRAINING_ID/attendance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"attendance\": [
      {\"playerId\": \"$PLAYER_1_ID\", \"status\": \"PRESENT\"},
      {\"playerId\": \"$PLAYER_2_ID\", \"status\": \"ABSENT\", \"justification\": \"Motivos pessoais\"}
    ]
  }")

echo "$ATTENDANCE_RESPONSE" | jq '.'

if echo "$ATTENDANCE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Attendance marked successfully"
else
    echo "❌ Attendance marking failed"
fi

# 7. Verify attendance was saved
echo ""
echo "7️⃣  Verifying saved attendance..."
TRAINING_DETAILS=$(curl -s -X GET "$API_URL/trainings/$TRAINING_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$TRAINING_DETAILS" | jq '.attendance'

ATTENDANCE_COUNT=$(echo "$TRAINING_DETAILS" | jq '.attendance | length')
echo "✅ Found $ATTENDANCE_COUNT attendance records"

# 8. Test injured player validation (if we have injuries)
echo ""
echo "8️⃣  Testing injured player validation..."
echo "   Creating test injury for $PLAYER_1_NAME..."

INJURY_RESPONSE=$(curl -s -X POST "$API_URL/injuries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"playerId\": \"$PLAYER_1_ID\",
    \"status\": \"INJURED\",
    \"name\": \"Teste - Lesão fictícia\",
    \"description\": \"Para teste de validação de presenças\",
    \"startDate\": \"2026-02-06\"
  }")

echo "$INJURY_RESPONSE" | jq '.'

# Try to mark injured player as present (should fail)
echo ""
echo "   Attempting to mark injured player as PRESENT (should fail)..."
INVALID_ATTENDANCE=$(curl -s -X POST "$API_URL/trainings/$TRAINING_ID/attendance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"attendance\": [
      {\"playerId\": \"$PLAYER_1_ID\", \"status\": \"PRESENT\"}
    ]
  }")

if echo "$INVALID_ATTENDANCE" | jq -e '.statusCode == 400' > /dev/null; then
    echo "✅ Validation working! Injured player cannot be marked present"
    echo "$INVALID_ATTENDANCE" | jq '.message'
else
    echo "⚠️  Validation may not be working as expected"
    echo "$INVALID_ATTENDANCE" | jq '.'
fi

echo ""
echo "========================================="
echo "🎉 Attendance system tests completed!"
echo ""
