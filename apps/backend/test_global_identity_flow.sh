#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
UNIQUE_ID=$(date +%s)
SUBDOMAIN_A="club-a-${UNIQUE_ID}"
SUBDOMAIN_B="club-b-${UNIQUE_ID}"
ADMIN_EMAIL="admin-a-${UNIQUE_ID}@sim.com"
ADMIN_B_EMAIL="admin-b-${UNIQUE_ID}@sim.com"
PARENT_EMAIL="global-parent-${UNIQUE_ID}@sim.com"
PASS="password123"

echo "==================================================="
echo "🚀 STARTING GLOBAL IDENTITY SIMULATION"
echo "Unique ID: $UNIQUE_ID"
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

# 1. Register Club A
echo ""
echo "👉 1. Registering Club A..."
CLUB_A_RESP=$(curl -s -X POST "$API_URL/clubs" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Club A ${UNIQUE_ID}\",
    \"subdomain\": \"$SUBDOMAIN_A\",
    \"email\": \"contact-a-${UNIQUE_ID}@sim.com\",
    \"adminName\": \"Admin A\",
    \"adminEmail\": \"$ADMIN_EMAIL\",
    \"adminPassword\": \"$PASS\"
  }")
check_success "$CLUB_A_RESP"
CLUB_A_ID=$(echo $CLUB_A_RESP | jq -r '.id')

# 2. Login Admin A
echo ""
echo "👉 2. Login Admin A..."
LOGIN_A_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$PASS\"}")
check_success "$LOGIN_A_RESP"
TOKEN_A=$(echo $LOGIN_A_RESP | jq -r '.access_token')

# 3. Register Global Parent
echo ""
echo "👉 3. Registering Global Parent..."
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
PARENT_ID=$(echo $PARENT_RESP | jq -r '.user.id')
echo "   Global Parent ID: $PARENT_ID"

# 4. Create Athlete Passport
echo ""
echo "👉 4. Creating Athlete Passport..."
ATHLETE_RESP=$(curl -s -X POST "$API_URL/athletes" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Global\",
    \"lastName\": \"Athlete\",
    \"birthDate\": \"2010-01-01T00:00:00Z\",
    \"gender\": \"MALE\",
    \"citizenCard\": \"12345678\",
    \"taxId\": \"999999999\"
  }")
check_success "$ATHLETE_RESP"
ATHLETE_ID=$(echo $ATHLETE_RESP | jq -r '.id')
PUBLIC_ID=$(echo $ATHLETE_RESP | jq -r '.publicId')
echo "   Athlete Created: $ATHLETE_ID"
echo "   Public ID: $PUBLIC_ID"

# 5. Register Club B
echo ""
echo "👉 5. Registering Club B..."
CLUB_B_RESP=$(curl -s -X POST "$API_URL/clubs" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Club B ${UNIQUE_ID}\",
    \"subdomain\": \"$SUBDOMAIN_B\",
    \"email\": \"contact-b-${UNIQUE_ID}@sim.com\",
    \"adminName\": \"Admin B\",
    \"adminEmail\": \"$ADMIN_B_EMAIL\",
    \"adminPassword\": \"$PASS\"
  }")
check_success "$CLUB_B_RESP"
CLUB_B_ID=$(echo $CLUB_B_RESP | jq -r '.id')

# 6. Login Admin B
echo ""
echo "👉 6. Login Admin B..."
LOGIN_B_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_B_EMAIL\", \"password\": \"$PASS\"}")
check_success "$LOGIN_B_RESP"
TOKEN_B=$(echo $LOGIN_B_RESP | jq -r '.access_token')

# 7. Club B Lookups Athlete
echo ""
echo "👉 7. Club B Looking up Athlete ($PUBLIC_ID)..."
LOOKUP_RESP=$(curl -s -X GET "$API_URL/athletes/lookup/$PUBLIC_ID" \
  -H "Authorization: Bearer $TOKEN_B")
check_success "$LOOKUP_RESP"
echo "   Athlete Found!"

# 8. Club B Requests Transfer
echo ""
echo "👉 8. Club B Requesting Transfer..."
TRANSFER_REQ_RESP=$(curl -s -X POST "$API_URL/athletes/transfer-request" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d "{\"publicId\": \"$PUBLIC_ID\"}")
check_success "$TRANSFER_REQ_RESP"
REQUEST_ID=$(echo $TRANSFER_REQ_RESP | jq -r '.id')
echo "   Transfer Request Created: $REQUEST_ID"

# 9. Global Parent Approves Transfer
echo ""
echo "👉 9. Parent Approving Transfer..."
APPROVE_RESP=$(curl -s -X PATCH "$API_URL/athletes/transfers/$REQUEST_ID/approve" \
  -H "Authorization: Bearer $PARENT_TOKEN")
check_success "$APPROVE_RESP"
PLAYER_ID=$(echo $APPROVE_RESP | jq -r '.id')
NEW_PARENT_USER_ID=$(echo $APPROVE_RESP | jq -r '.parentId')

echo "✅ Transfer Approved!"
echo "   New Local Player ID: $PLAYER_ID"
echo "   New Local Parent User ID: $NEW_PARENT_USER_ID"

# 10. Verify Player in Club B
echo ""
echo "👉 10. Verifying Player in Club B..."
PLAYER_GET_RESP=$(curl -s -X GET "$API_URL/players/$PLAYER_ID" \
  -H "Authorization: Bearer $TOKEN_B")
check_success "$PLAYER_GET_RESP"
echo "✅ Player verified in Club B system!"

echo ""
echo "==================================================="
echo "🎉 GLOBAL IDENTITY FLOW SUCCESSFUL!"
echo "==================================================="
