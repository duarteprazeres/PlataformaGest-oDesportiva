#!/bin/bash
# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting Medical Dept Link Verification..."

BASE_URL="http://localhost:3000"
COOKIE_FILE="cookies.txt"

# 1. Login to get token (using a known user from seed or previous tests)
# Assuming email 'admin@club.com' and password 'password' from seed or similar
# Adjust if necessary based on your seeded data
EMAIL="admin@sporting.pt"
PASSWORD="password"

echo "Logging in as $EMAIL..."
LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

# Extract Token for Bearer auth if needed, though cookies should work
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [[ -z "$TOKEN" ]]; then
  echo -e "${RED}Login failed.${NC}"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo -e "${GREEN}Login successful.${NC}"

# 2. Get a Player ID
PLAYERS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/players")
PLAYER_ID=$(echo $PLAYERS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [[ -z "$PLAYER_ID" ]]; then
  echo -e "${RED}No players found. Cannot test injury creation.${NC}"
  exit 1
fi
echo -e "${GREEN}Found Player ID: $PLAYER_ID${NC}"

# 3. Create Injury
echo "Creating Injury for player..."
INJURY_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/injuries" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\": \"$PLAYER_ID\", \"status\": \"INJURED\", \"name\": \"Test Injury\", \"description\": \"Test Description\", \"startDate\": \"$(date +%Y-%m-%d)\"}")

INJURY_ID=$(echo $INJURY_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [[ -z "$INJURY_ID" ]]; then
  echo -e "${RED}Failed to create injury.${NC}"
  echo $INJURY_RESPONSE
  exit 1
fi
echo -e "${GREEN}Injury Created: $INJURY_ID${NC}"

# 4. Verify Player Status is INJURED
PLAYER_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/players/$PLAYER_ID")
MEDICAL_STATUS=$(echo $PLAYER_RESPONSE | grep -o '"medicalStatus":"[^"]*' | cut -d'"' -f4)

if [[ "$MEDICAL_STATUS" == "INJURED" ]]; then
    echo -e "${GREEN}Player Status Updated to INJURED. Verified.${NC}"
else
    echo -e "${RED}Player Status Verification Failed. Got: $MEDICAL_STATUS${NC}"
fi

# 5. Create Training
echo "Creating Training..."
TEAM_ID=$(echo $PLAYERS_RESPONSE | grep -o '"teamId":"[^"]*' | head -1 | cut -d'"' -f4) # Try to get team id from player or fetch teams
# If player doesn't have teamId in response (it's often nested), fetch teams
TEAMS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/teams")
TEAM_ID=$(echo $TEAMS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

TRAINING_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/trainings" \
  -H "Content-Type: application/json" \
  -d "{\"teamId\": \"$TEAM_ID\", \"scheduledDate\": \"$(date +%Y-%m-%d)\", \"startTime\": \"10:00\", \"endTime\": \"12:00\", \"location\": \"Test Field\", \"notes\": \"Verifying Details\"}")

# Trainings batch create returns count usually, but we need ID to test details.
# So we fetch trainings list to get the latest one.
LATEST_TRAINING_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/trainings?futureOnly=true")
TRAINING_ID=$(echo $LATEST_TRAINING_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}Training Created. ID: $TRAINING_ID${NC}"

# 6. Verify Training Details fetch includes Player Status
echo "Fetching Training Details..."
DETAILS_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/trainings/$TRAINING_ID")

# Check if response contains our player and "medicalStatus":"INJURED"
if echo "$DETAILS_RESPONSE" | grep -q "$PLAYER_ID" && echo "$DETAILS_RESPONSE" | grep -q "INJURED"; then
    echo -e "${GREEN}Training Details include Injured Player. Verified.${NC}"
else
     echo -e "${RED}Training Details verification failed.${NC}"
     # echo $DETAILS_RESPONSE
fi

# 7. Close Injury
echo "Closing Injury..."
CLOSE_RESPONSE=$(curl -s -b $COOKIE_FILE -X PATCH "$BASE_URL/injuries/$INJURY_ID" \
  -H "Content-Type: application/json" \
  -d "{\"endDate\": \"$(date +%Y-%m-%d)\"}")

# 8. Verify Player Status is FIT
PLAYER_RESPONSE_2=$(curl -s -b $COOKIE_FILE "$BASE_URL/players/$PLAYER_ID")
MEDICAL_STATUS_2=$(echo $PLAYER_RESPONSE_2 | grep -o '"medicalStatus":"[^"]*' | cut -d'"' -f4)

if [[ "$MEDICAL_STATUS_2" == "FIT" ]]; then
    echo -e "${GREEN}Player Status Reverted to FIT. Verified.${NC}"
else
    echo -e "${RED}Player Status Revert Failed. Got: $MEDICAL_STATUS_2${NC}"
fi

echo "Verification Complete."
rm $COOKIE_FILE
