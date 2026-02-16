#!/bin/bash
HOST="http://localhost:3000"
EMAIL="admin@sporting.pt"
PASS="admin123"

echo "🔹 1. Login..."
# Use cookie jar
rm -f cookies.txt
LOGIN_RES=$(curl -s -c cookies.txt -X POST "$HOST/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")

userId=$(echo $LOGIN_RES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
clubId=$(echo $LOGIN_RES | grep -o '"clubId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$userId" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Logged in as $userId"

echo "🔹 2. Getting Team..."
TEAMS_RES=$(curl -s -b cookies.txt -X GET "$HOST/teams?activeOnly=true")
teamId=$(echo $TEAMS_RES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$teamId" ]; then
    echo "❌ No team found. Please seed DB first."
    exit 1
fi
echo "✅ Found Team: $teamId"

echo "🔹 3. Creating Dummy Training Plan..."
echo "This is a tactical plan." > tactical_plan.txt

echo "🔹 4. Uploading Training..."
# Curl multipart
UPLOAD_RES=$(curl -s -b cookies.txt -X POST "$HOST/trainings" \
  -F "teamId=$teamId" \
  -F "scheduledDate=2024-05-20" \
  -F "startTime=19:00" \
  -F "endTime=20:30" \
  -F "location=Campo Teste" \
  -F "notes=Treino Tatico com Upload" \
  -F "file=@tactical_plan.txt")

echo "Response: $UPLOAD_RES"

if [[ $UPLOAD_RES == *"planFileUrl"* ]]; then
    echo "✅ Training Created with File URL!"
    
    fileUrl=$(echo $UPLOAD_RES | grep -o '"planFileUrl":"[^"]*"' | cut -d'"' -f4)
    echo "URL: $fileUrl"
    
    echo "🔹 5. Verifying File Access..."
    FILE_CONTENT=$(curl -s "$HOST$fileUrl")
    if [[ "$FILE_CONTENT" == "This is a tactical plan." ]]; then
        echo "✅ File content verified!"
    else
        echo "❌ File content mismatch or not found."
        echo "Got: $FILE_CONTENT"
        exit 1
    fi
    
else
    echo "❌ Failed to create training or missing file URL."
    exit 1
fi

rm tactical_plan.txt
