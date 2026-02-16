#!/bin/bash
API_URL="http://localhost:3000/auth"
COOKIE_FILE="cookies.txt"

# 1. Login
echo "1. Attempting Login..."
curl -s -c $COOKIE_FILE -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sporting.pt","password":"admin123"}' > login_response.json

echo "Login Response:"
cat login_response.json
echo ""

# Check if cookie exists
if grep -q "Authentication" $COOKIE_FILE; then
  echo "✅ Authentication cookie found in jar"
else
  echo "❌ Authentication cookie NOT found"
  exit 1
fi

# 2. Verify Session (/me)
echo "2. Verifying Session (/me)..."
ME_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$API_URL/me")
echo "Me Response: $ME_RESPONSE"

if [[ "$ME_RESPONSE" == *"email"* ]]; then
  echo "✅ Session verified successfully"
else
  echo "❌ Failed to verify session"
  exit 1
fi

# 3. Logout
echo "3. Logging Out..."
curl -s -b $COOKIE_FILE -c $COOKIE_FILE -X POST "$API_URL/logout" > logout_response.json
echo "Logout done."

# 4. Verify Session Expired
echo "4. Verifying Session Expired..."
EXPIRED_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$API_URL/me")
echo "Expired Response: $EXPIRED_RESPONSE"

if [[ "$EXPIRED_RESPONSE" == *"Unauthorized"* ]]; then
  echo "✅ Session correctly expired (Unauthorized)"
else
  echo "❌ Session still active or unexpected error: $EXPIRED_RESPONSE"
fi

rm $COOKIE_FILE login_response.json logout_response.json
