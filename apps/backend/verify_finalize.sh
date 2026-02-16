#!/bin/bash
API_URL="http://localhost:3000"
AUTH_URL="$API_URL/auth"
COOKIE_FILE="cookies.txt"

# 1. Login to get cookie
echo "1. Logging in..."
curl -s -c $COOKIE_FILE -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sporting.pt","password":"admin123"}' > /dev/null
echo "✅ Logged in"

# 2. Get Active Team (Sub-15) and Players
echo "2. Fetching Team and Players..."
# Hardcoded from seed knowledge or fetch dynamically. Let's fetch dynamic.
SEASONS=$(curl -s -b $COOKIE_FILE "$API_URL/seasons")
ACTIVE_SEASON_ID=$(echo $SEASONS | jq -r '.[0].id')
TEAMS=$(curl -s -b $COOKIE_FILE "$API_URL/teams?seasonId=$ACTIVE_SEASON_ID")
TEAM_ID=$(echo $TEAMS | jq -r '.[0].id')

echo "   Team ID: $TEAM_ID"

PLAYERS_RESP=$(curl -s -b $COOKIE_FILE "$API_URL/players")
PLAYER_ID=$(echo $PLAYERS_RESP | jq -r '.[0].id')
echo "   Player ID: $PLAYER_ID"

# 3. Create a Scheduled Match
echo "3. Creating Scheduled Match..."
MATCH_DATA="{\"teamId\":\"$TEAM_ID\",\"opponentName\":\"Benfica Sub-15\",\"competition\":\"Campeonato\",\"matchDate\":\"2026-05-20\",\"location\":\"Academia\",\"isHomeMatch\":true}"
MATCH_RESP=$(curl -s -b $COOKIE_FILE -X POST "$API_URL/matches" \
  -H "Content-Type: application/json" \
  -d "$MATCH_DATA")
MATCH_ID=$(echo $MATCH_RESP | jq -r '.id')
echo "   Match Created: $MATCH_ID"

# 4. Add Callup
echo "4. Adding Callup..."
curl -s -b $COOKIE_FILE -X POST "$API_URL/matches/$MATCH_ID/callups/$PLAYER_ID" > /dev/null
echo "   Callup Added"

# 5. Confirm Callup
echo "5. Confirming Callup..."
curl -s -b $COOKIE_FILE -X POST "$API_URL/matches/$MATCH_ID/callups/$PLAYER_ID/confirm" > /dev/null
echo "   Callup Confirmed"

# 6. Add Stats (Played=true, 1 Goal)
echo "6. Adding Stats (1 Goal)..."
STATS_DATA="{\"played\":true,\"minutesPlayed\":90,\"goalsScored\":1,\"coachRating\":8,\"yellowCards\":0,\"redCard\":false}"
curl -s -b $COOKIE_FILE -X PATCH "$API_URL/matches/$MATCH_ID/callups/$PLAYER_ID/stats" \
  -H "Content-Type: application/json" \
  -d "$STATS_DATA" > /dev/null
echo "   Stats Updated"

# 7. Finalize Match
echo "7. Finalizing Match (Result: WIN 3-1)..."
FINALIZE_DATA="{\"result\":\"WIN\",\"goalsFor\":3,\"goalsAgainst\":1,\"notes\":\"Great victory\"}"
FINALIZE_RESP=$(curl -s -b $COOKIE_FILE -X POST "$API_URL/matches/$MATCH_ID/finalize" \
  -H "Content-Type: application/json" \
  -d "$FINALIZE_DATA")

echo "Finalize Response:"
echo $FINALIZE_RESP | jq '.'

MATCH_RESULT=$(echo $FINALIZE_RESP | jq -r '.match.result')

if [ "$MATCH_RESULT" == "WIN" ]; then
    echo "✅ Match finalized successfully as WIN"
else
    echo "❌ Match finalization failed"
    exit 1
fi

rm $COOKIE_FILE
