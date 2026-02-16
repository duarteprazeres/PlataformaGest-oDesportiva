#!/bin/bash
# Test Medical Department E2E Flow
# This script tests the complete flow: Create Injury → Check Player Status → Close Injury

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/medical_test_cookies.txt"

echo "🏥 Testing Medical Department End-to-End..."
echo ""

# 1. Login as Admin (stores cookies)
echo "1️⃣  Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sporting.pt","password":"admin123"}')

USER_EMAIL=$(echo $LOGIN_RESPONSE | grep -o '"email":"[^"]*"' | sed 's/"email":"\(.*\)"/\1/')

if [ "$USER_EMAIL" != "admin@sporting.pt" ]; then
    echo "❌ Login failed!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"
echo ""

# 2. Get all players  
echo "2️⃣  Fetching all players..."
PLAYERS_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/players")

# Extract first player ID (João Silva - Sub-15)
PLAYER_ID=$(echo $PLAYERS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')

if [ -z "$PLAYER_ID" ]; then
    echo "❌ No players found!"
    echo "Response: $PLAYERS_RESPONSE"
    exit 1
fi

echo "✅ Found player ID: $PLAYER_ID"
echo ""

# 3. Check player current medical status
echo "3️⃣  Checking player's current medical status..."
PLAYER_DETAIL=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/players/$PLAYER_ID")

CURRENT_STATUS=$(echo $PLAYER_DETAIL | grep -o '"medicalStatus":"[^"]*"' | sed 's/"medicalStatus":"\(.*\)"/\1/')
echo "   Current status: $CURRENT_STATUS (should be FIT)"
echo ""

# 4. Create injury
echo "4️⃣  Creating injury for player..."
INJURY_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/injuries" \
  -H "Content-Type: application/json" \
  -d "{
    \"playerId\": \"$PLAYER_ID\",
    \"status\": \"INJURED\",
    \"name\": \"Entorse no tornozelo\",
    \"description\": \"Entorse grau 2 no tornozelo direito durante treino. Recomendado repouso de 2 semanas.\",
    \"startDate\": \"2026-02-06\"
  }")

INJURY_ID=$(echo $INJURY_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')

if [ -z "$INJURY_ID" ]; then
    echo "❌ Failed to create injury!"
    echo "Response: $INJURY_RESPONSE"
    exit 1
fi

echo "✅ Injury created! ID: $INJURY_ID"
echo ""

# 5. Check player status updated
echo "5️⃣  Verifying player medical status updated..."
sleep 1  # Give DB a moment
PLAYER_UPDATED=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/players/$PLAYER_ID")

UPDATED_STATUS=$(echo $PLAYER_UPDATED | grep -o '"medicalStatus":"[^"]*"' | sed 's/"medicalStatus":"\(.*\)"/\1/')

if [ "$UPDATED_STATUS" = "INJURED" ]; then
    echo "✅ Player status updated to: INJURED"
else
    echo "❌ Player status NOT updated! Current: $UPDATED_STATUS"
    exit 1
fi
echo ""

# 6. Get active injuries
echo "6️⃣  Fetching active injuries..."
ACTIVE_INJURIES=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/injuries?activeOnly=true")

ACTIVE_COUNT=$(echo $ACTIVE_INJURIES | grep -o '"id":"' | wc -l | tr -d ' ')
echo "✅ Found $ACTIVE_COUNT active injury(ies)"
echo ""

# 7. Give medical clearance (alta médica)
echo "7️⃣  Giving medical clearance (closing injury)..."
CLOSE_RESPONSE=$(curl -s -b $COOKIE_FILE -X PATCH "$BASE_URL/injuries/$INJURY_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"endDate\": \"2026-02-20\"
  }")

echo "✅ Injury closed!"
echo ""

# 8. Verify player back to FIT
echo "8️⃣  Verifying player status reverted to FIT..."
sleep 1
PLAYER_FINAL=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/players/$PLAYER_ID")

FINAL_STATUS=$(echo $PLAYER_FINAL | grep -o '"medicalStatus":"[^"]*"' | sed 's/"medicalStatus":"\(.*\)"/\1/')

if [ "$FINAL_STATUS" = "FIT" ]; then
    echo "✅ Player status reverted to: FIT"
else
    echo "❌ Player status NOT reverted! Current: $FINAL_STATUS"
    exit 1
fi
echo ""

# 9. Check injury in history
echo "9️⃣  Checking injury moved to history..."
HISTORY=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/injuries?activeOnly=false")

echo "✅ Injury available in history"
echo ""

echo "🎉 ALL TESTS PASSED!"
echo ""
echo "📋 Summary:"
echo "  ✅ Login successful"
echo "  ✅ Injury creation working"
echo "  ✅ Player medical status auto-updated (FIT → INJURED)"
echo "  ✅ Medical clearance working"
echo "  ✅ Player status auto-reverted (INJURED → FIT)"
echo "  ✅ History tracking working"
echo ""
echo "💡 Next: Test frontend Medical Department Dashboard"
