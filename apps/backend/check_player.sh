#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@simbrowser.com","password":"password123"}' | jq -r .access_token)

echo "Token: $TOKEN"

echo "Fetching Players..."
curl -s -X GET http://localhost:3000/players   -H "Authorization: Bearer $TOKEN" | jq .
