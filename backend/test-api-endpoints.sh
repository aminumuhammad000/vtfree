#!/bin/bash

# API Testing Script for VTU App Backend
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"
TEST_RESULTS_FILE="api_test_results.log"

# Clear previous results
> $TEST_RESULTS_FILE

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test results
log_test() {
    local endpoint=$1
    local status=$2
    local response=$3
    
    echo "========================================" >> $TEST_RESULTS_FILE
    echo "Endpoint: $endpoint" >> $TEST_RESULTS_FILE
    echo "Status: $status" >> $TEST_RESULTS_FILE
    echo "Response: $response" >> $TEST_RESULTS_FILE
    echo "========================================" >> $TEST_RESULTS_FILE
    echo "" >> $TEST_RESULTS_FILE
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}$method${NC} $BASE_URL$endpoint"
    
    if [ "$method" == "GET" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" -H "Authorization: Bearer $token")
        fi
    elif [ "$method" == "POST" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        fi
    elif [ "$method" == "PUT" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        fi
    elif [ "$method" == "DELETE" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
        echo -e "${GREEN}✓ PASSED${NC} - HTTP $http_code"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_test "$endpoint" "PASSED (HTTP $http_code)" "$body"
    else
        echo -e "${RED}✗ FAILED${NC} - HTTP $http_code"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_test "$endpoint" "FAILED (HTTP $http_code)" "$body"
    fi
    
    echo ""
}

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  VTU App Backend API Testing${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Variables for storing tokens and IDs
USER_TOKEN=""
ADMIN_TOKEN=""
USER_ID=""

# 1. Health Check
echo -e "${YELLOW}=== HEALTH CHECK ===${NC}"
test_endpoint "GET" "/health" "" "" "Health Check"
test_endpoint "GET" "/" "" "" "Root Endpoint"

# 2. Authentication Endpoints
echo -e "${YELLOW}=== AUTHENTICATION ENDPOINTS ===${NC}"

# Register a test user
REGISTER_DATA='{
  "email": "testuser'$(date +%s)'@example.com",
  "password": "Test@123456",
  "firstName": "Test",
  "lastName": "User",
  "phone": "080'$(date +%s | cut -c 1-8)'"
}'
test_endpoint "POST" "/api/auth/register" "$REGISTER_DATA" "" "User Registration"

# Login (will fail without proper verification, but tests endpoint)
LOGIN_DATA='{
  "email": "testuser@example.com",
  "password": "Test@123456"
}'
test_endpoint "POST" "/api/auth/login" "$LOGIN_DATA" "" "User Login"

# Verify OTP (will fail without valid OTP)
OTP_DATA='{
  "email": "testuser@example.com",
  "otp": "123456"
}'
test_endpoint "POST" "/api/auth/verify-otp" "$OTP_DATA" "" "Verify OTP"

# Resend OTP
RESEND_DATA='{
  "email": "testuser@example.com"
}'
test_endpoint "POST" "/api/auth/resend-otp" "$RESEND_DATA" "" "Resend OTP"

# 3. User Endpoints (without token - should fail with 401)
echo -e "${YELLOW}=== USER ENDPOINTS (Without Token) ===${NC}"
test_endpoint "GET" "/api/users/profile" "" "" "Get Profile (No Auth)"
test_endpoint "PUT" "/api/users/profile" '{"firstName":"Updated"}' "" "Update Profile (No Auth)"
test_endpoint "GET" "/api/users" "" "" "Get All Users (No Auth)"

# 4. Wallet Endpoints (without token)
echo -e "${YELLOW}=== WALLET ENDPOINTS (Without Token) ===${NC}"
test_endpoint "GET" "/api/wallet" "" "" "Get Wallet (No Auth)"
test_endpoint "POST" "/api/wallet/fund" '{"amount":1000}' "" "Fund Wallet (No Auth)"
test_endpoint "GET" "/api/wallet/transactions" "" "" "Get Wallet Transactions (No Auth)"

# 5. Transaction Endpoints (without token)
echo -e "${YELLOW}=== TRANSACTION ENDPOINTS (Without Token) ===${NC}"
test_endpoint "GET" "/api/transactions" "" "" "Get Transactions (No Auth)"
test_endpoint "GET" "/api/transactions/all" "" "" "Get All Transactions (No Auth)"

# 6. Admin Endpoints
echo -e "${YELLOW}=== ADMIN ENDPOINTS ===${NC}"
ADMIN_LOGIN_DATA='{
  "email": "admin@example.com",
  "password": "Admin@123"
}'
test_endpoint "POST" "/api/admin/login" "$ADMIN_LOGIN_DATA" "" "Admin Login"
test_endpoint "GET" "/api/admin/dashboard" "" "" "Admin Dashboard (No Auth)"
test_endpoint "GET" "/api/admin/users" "" "" "Admin Get All Users (No Auth)"
test_endpoint "GET" "/api/admin/audit-logs" "" "" "Admin Get Audit Logs (No Auth)"

# 7. Payment Endpoints
echo -e "${YELLOW}=== PAYMENT ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/payment/banks" "" "" "Get Banks (No Auth)"
test_endpoint "POST" "/api/payment/initiate" '{"amount":1000}' "" "Initiate Payment (No Auth)"
test_endpoint "GET" "/api/payment/virtual-account" "" "" "Get Virtual Account (No Auth)"

# 8. Notification Endpoints (without token)
echo -e "${YELLOW}=== NOTIFICATION ENDPOINTS (Without Token) ===${NC}"
test_endpoint "GET" "/api/notifications" "" "" "Get Notifications (No Auth)"
test_endpoint "PUT" "/api/notifications/read-all" "" "" "Mark All Read (No Auth)"

# 9. Promotion Endpoints (without token)
echo -e "${YELLOW}=== PROMOTION ENDPOINTS (Without Token) ===${NC}"
test_endpoint "GET" "/api/promotions" "" "" "Get Promotions (No Auth)"

# 10. Support Endpoints (without token)
echo -e "${YELLOW}=== SUPPORT ENDPOINTS (Without Token) ===${NC}"
test_endpoint "GET" "/api/support" "" "" "Get Support Tickets (No Auth)"
TICKET_DATA='{
  "subject": "Test Issue",
  "message": "This is a test ticket",
  "priority": "medium"
}'
test_endpoint "POST" "/api/support" "$TICKET_DATA" "" "Create Support Ticket (No Auth)"

# 11. TopUpMate Test Endpoint
echo -e "${YELLOW}=== TOPUPMATE SERVICE TEST ===${NC}"
test_endpoint "GET" "/api/test-topupmate" "" "" "TopUpMate Service Test"

# Summary
echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""
echo -e "Detailed results saved to: ${TEST_RESULTS_FILE}"
echo ""
