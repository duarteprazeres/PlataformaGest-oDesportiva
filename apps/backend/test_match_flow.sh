#!/bin/bash

# Test Match Management Flow
# This script validates the complete match management system

API_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=================================================="
echo "🔵 MATCH MANAGEMENT SYSTEM TEST"
echo "=================================================="

UNIQUE_ID=$(date +%s)

# 1. Register Club
echo -e "\n${BLUE}> 1. Registering Club...${NC}"
CLUB_RESPONSE=$(curl -s -X POST "$API_URL/clubs" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Match Test Club $UNIQUE_ID\",
    \"subdomain\": \"matchtest-$UNIQUE_ID\",
    \"email\": \"contact-$UNIQUE_ID@test.pt\",
    \"adminName\": \"Admin Test\",
    \"adminEmail\": \"admin-$UNIQUE_ID@test.pt\",
    \"adminPassword\": \"test123\"
  }")

CLUB_ID=$(echo $CLUB_RESPONSE | jq -r '.club.id')

if [ "$CLUB_ID" != "null" ] && [ "$CLUB_ID" != "" ]; then
    echo -e "${GREEN}✅ Club registered successfully: $CLUB_ID${NC}"
    # Now login to get token
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"admin-$UNIQUE_ID@test.pt\",
        \"password\": \"test123\"
      }")
    CLUB_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
else
    echo -e "${RED}❌ Failed to register club${NC}"
    echo "Response: $CLUB_RESPONSE"
    exit 1
fi

# 2. Create Season
echo -e "\n${BLUE}> 2. Creating Season...${NC}"
SEASON_RESPONSE=$(curl -s -X POST "$API_URL/seasons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLUB_TOKEN" \
  -d '{
    "name": "2025/2026",
    "startDate": "2025-09-01",
    "endDate": "2026-06-30"
  }')

SEASON_ID=$(echo $SEASON_RESPONSE | jq -r '.id')

if [ "$SEASON_ID" != "null" ]; then
    echo -e "${GREEN}✅ Season created: $SEASON_ID${NC}"
else
    echo -e "${RED}❌ Failed to create season${NC}"
    exit 1
fi

# 3. Create Team
echo -e "\n${BLUE}> 3. Creating Team...${NC}"
TEAM_RESPONSE=$(curl -s -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLUB_TOKEN" \
  -d "{
    \"name\": \"Sub-15 Masculino\",
    \"category\": \"SUB15\",
    \"gender\": \"MALE\",
    \"seasonId\": \"$SEASON_ID\"
  }")

TEAM_ID=$(echo $TEAM_RESPONSE | jq -r '.id')

if [ "$TEAM_ID" != "null" ]; then
    echo -e "${GREEN}✅ Team created: $TEAM_ID${NC}"
else
    echo -e "${RED}❌ Failed to create team${NC}"
    exit 1
fi

# 4. Register Global Parent
echo -e "\n${BLUE}> 4. Registering Global Parent...${NC}"
PARENT_RESPONSE=$(curl -s -X POST "$API_URL/global-auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Maria",
    "lastName": "Silva",
    "email": "maria@example.com",
    "password": "password123"
  }')

PARENT_TOKEN=$(echo $PARENT_RESPONSE | jq -r '.access_token')

if [ "$PARENT_TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Parent registered${NC}"
else
    echo -e "${RED}❌ Failed to register parent${NC}"
    exit 1
fi

# 5. Create Athletes
echo -e "\n${BLUE}> 5. Creating Athletes...${NC}"
ATHLETE_RESPONSE=$(curl -s -X POST "$API_URL/athletes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -d '{
    "firstName": "João",
    "lastName": "Silva",
    "birthDate": "2010-05-15",
    "gender": "MALE"
  }')

ATHLETE_ID=$(echo $ATHLETE_RESPONSE | jq -r '.id')
PUBLIC_ID=$(echo $ATHLETE_RESPONSE | jq -r '.publicId')

if [ "$ATHLETE_ID" != "null" ]; then
    echo -e "${GREEN}✅ Athlete created: $PUBLIC_ID${NC}"
else
    echo -e "${RED}❌ Failed to create athlete${NC}"
    exit 1
fi

# 6. Register Player in Club
echo -e "\n${BLUE}> 6. Registering Player in Team...${NC}"
PLAYER_RESPONSE=$(curl -s -X POST "$API_URL/players" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLUB_TOKEN" \
  -d "{
    \"athleteId\": \"$ATHLETE_ID\",
    \"teamId\": \"$TEAM_ID\",
    \"jerseyNumber\": 10,
    \"position\": \"MIDFIELDER\"
  }")

PLAYER_ID=$(echo $PLAYER_RESPONSE | jq -r '.id')

if [ "$PLAYER_ID" != "null" ]; then
    echo -e "${GREEN}✅ Player registered: $PLAYER_ID${NC}"
else
    echo -e "${RED}❌ Failed to register player${NC}"
    exit 1
fi

# 7. Create Match
echo -e "\n${BLUE}> 7. Creating Match...${NC}"
MATCH_RESPONSE=$(curl -s -X POST "$API_URL/matches" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLUB_TOKEN" \
  -d "{
    \"teamId\": \"$TEAM_ID\",
    \"opponentName\": \"FC Porto Sub-15\",
    \"competition\": \"Campeonato Distrital\",
    \"matchDate\": \"2026-02-15\",
    \"matchTime\": \"15:00\",
    \"location\": \"Estádio José Alvalade\",
    \"isHomeMatch\": true
  }")

MATCH_ID=$(echo $MATCH_RESPONSE | jq -r '.id')

if [ "$MATCH_ID" != "null" ]; then
    echo -e "${GREEN}✅ Match created: $MATCH_ID${NC}"
else
    echo -e "${RED}❌ Failed to create match${NC}"
    echo "Response: $MATCH_RESPONSE"
    exit 1
fi

# 8. Add Callup
echo -e "\n${BLUE}> 8. Adding Player to Callup...${NC}"
CALLUP_RESPONSE=$(curl -s -X POST "$API_URL/matches/$MATCH_ID/callups/$PLAYER_ID" \
  -H "Authorization: Bearer $CLUB_TOKEN")

CALLUP_ID=$(echo $CALLUP_RESPONSE | jq -r '.id')

if [ "$CALLUP_ID" != "null" ]; then
    echo -e "${GREEN}✅ Player called up: $CALLUP_ID${NC}"
else
    echo -e "${RED}❌ Failed to add callup${NC}"
    exit 1
fi

# 9. Parent Confirms Callup
echo -e "\n${BLUE}> 9. Parent Confirming Attendance...${NC}"
CONFIRM_RESPONSE=$(curl -s -X POST "$API_URL/matches/$MATCH_ID/callups/$PLAYER_ID/confirm" \
  -H "Authorization: Bearer $PARENT_TOKEN")

CONFIRMED=$(echo $CONFIRM_RESPONSE | jq -r '.confirmedByParent')

if [ "$CONFIRMED" == "true" ]; then
    echo -e "${GREEN}✅ Parent confirmed attendance${NC}"
else
    echo -e "${RED}❌ Failed to confirm callup${NC}"
    exit 1
fi

# 10. Update Player Stats
echo -e "\n${BLUE}> 10. Recording Player Stats (2 goals, 90 min, rating 8.5)...${NC}"
STATS_RESPONSE=$(curl -s -X PATCH "$API_URL/matches/$MATCH_ID/callups/$PLAYER_ID/stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLUB_TOKEN" \
  -d '{
    "played": true,
    "minutesPlayed": 90,
    "goalsScored": 2,
    "yellowCards": 0,
    "redCard": false,
    "coachRating": 8.5
  }')

GOALS=$(echo $STATS_RESPONSE | jq -r '.goalsScored')

if [ "$GOALS" == "2" ]; then
    echo -e "${GREEN}✅ Stats recorded successfully${NC}"
else
    echo -e "${RED}❌ Failed to update stats${NC}"
    exit 1
fi

# 11. Update Match Result
echo -e "\n${BLUE}> 11. Updating Match Result (3-1 Win)...${NC}"
RESULT_RESPONSE=$(curl -s -X PATCH "$API_URL/matches/$MATCH_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLUB_TOKEN" \
  -d '{
    "result": "FINISHED",
    "goalsFor": 3,
    "goalsAgainst": 1
  }')

RESULT=$(echo $RESULT_RESPONSE | jq -r '.result')

if [ "$RESULT" == "FINISHED" ]; then
    echo -e "${GREEN}✅ Match result updated${NC}"
else
    echo -e "${RED}❌ Failed to update result${NC}"
    exit 1
fi

# 12. Finalize Match
echo -e "\n${BLUE}> 12. Finalizing Match...${NC}"
FINALIZE_RESPONSE=$(curl -s -X POST "$API_URL/matches/$MATCH_ID/finalize" \
  -H "Authorization: Bearer $CLUB_TOKEN")

MESSAGE=$(echo $FINALIZE_RESPONSE | jq -r '.message')

if [[ "$MESSAGE" == *"successful"* ]]; then
    echo -e "${GREEN}✅ Match finalized${NC}"
else
    echo -e "${RED}❌ Failed to finalize match${NC}"
    exit 1
fi

# 13. Get Athlete Stats (should reflect the game)
echo -e "\n${BLUE}> 13. Checking Athlete Stats...${NC}"
STATS=$(curl -s -X GET "$API_URL/athletes/$ATHLETE_ID/stats" \
  -H "Authorization: Bearer $PARENT_TOKEN")

TOTAL_MATCHES=$(echo $STATS | jq -r '.totalMatches')
TOTAL_GOALS=$(echo $STATS | jq -r '.totalGoals')
AVG_RATING=$(echo $STATS | jq -r '.avgCoachRating')

echo "   📊 Total Matches: $TOTAL_MATCHES"
echo "   ⚽ Total Goals: $TOTAL_GOALS"
echo "   ⭐ Avg Rating: $AVG_RATING"

if [ "$TOTAL_MATCHES" == "1" ] && [ "$TOTAL_GOALS" == "2" ]; then
    echo -e "${GREEN}✅ Stats correctly aggregated!${NC}"
else
    echo -e "${RED}❌ Stats not matching expected values${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 MATCH MANAGEMENT TEST SUCCESSFUL!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  ✅ Match created and configured"
echo "  ✅ Player called up"
echo "  ✅ Parent confirmed attendance"
echo "  ✅ Stats recorded (2 goals, 90 min, 8.5 rating)"
echo "  ✅ Match finalized"
echo "  ✅ Stats aggregated correctly"
echo ""
