#!/bin/bash

BASE_URL="http://localhost:5000/api/v1"

RANDOM_VAL=$RANDOM
echo "Testing Register..."
REGISTER_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"testuser_$RANDOM_VAL@example.com\",
    \"phone_number\": \"080$RANDOM_VAL\",
    \"password\": \"password123\",
    \"first_name\": \"Shell\",
    \"last_name\": \"Test\",
    \"app_id\": \"vtfree\"
  }")
echo $REGISTER_RES | jq .

echo -e "\nTesting Login..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"testuser_$RANDOM_VAL@example.com\",
    \"password\": \"password123\"
  }")
echo $LOGIN_RES | jq .

TOKEN=$(echo $LOGIN_RES | jq -r '.data.token')

if [ "$TOKEN" != "null" ]; then
  echo -e "\nTOKEN: $TOKEN"
  
  echo -e "\nTesting Profile..."
  curl -s -X GET "$BASE_URL/users/profile" \
    -H "Authorization: Bearer $TOKEN" | jq .

  echo -e "\nTesting Wallet..."
  curl -s -X GET "$BASE_URL/wallet/" \
    -H "Authorization: Bearer $TOKEN" | jq .

  echo -e "\nTesting Networks..."
  curl -s -X GET "$BASE_URL/billpayment/networks" \
    -H "Authorization: Bearer $TOKEN" | jq .

  echo -e "\nTesting Admin Login (Dashboard)..."
  # Note: This might fail if there is no admin user in the DB
  ADMIN_LOGIN_RES=$(curl -s -X POST "$BASE_URL/dashboard/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "password": "password123",
      "app_id": "dashboard"
    }')
  echo $ADMIN_LOGIN_RES | jq .
else
  echo -e "\nLogin Failed, skipping protected routes."
fi
