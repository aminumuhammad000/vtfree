#!/bin/bash

# Comprehensive API Testing Script for VTU App Backend
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"
TEST_RESULTS_FILE="comprehensive_api_test_results.log"
TIMESTAMP=$(date +%s)

# Clear previous results
> $TEST_RESULTS_FILE

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Variables for storing tokens and IDs
USER_TOKEN=""
ADMIN_TOKEN=""
USER_ID=""
USER_EMAIL="testuser${TIMESTAMP}@example.com"
USER_PHONE="080${TIMESTAMP:0:8}"
USER_PASSWORD="Test@123456"

# Function to log test results
log_test() {
    local endpoint=$1
    local status=$2
    local response=$3
    local http_code=$4
    
    echo "========================================" >> $TEST_RESULTS_FILE
    echo "Endpoint: $endpoint" >> $TEST_RESULTS_FILE
    echo "Status: $status" >> $TEST_RESULTS_FILE
    echo "HTTP Code: $http_code" >> $TEST_RESULTS_FILE
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
    local expect_auth_error=$6  # If "true", 401 is considered success
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[Test $TOTAL_TESTS]${NC} $description"
    echo -e "${YELLOW}$method${NC} $BASE_URL$endpoint"
    
    # Prepare curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method '$BASE_URL$endpoint'"
    
    if [ "$method" != "GET" ] && [ "$method" != "DELETE" ] && [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    # Execute curl command
    response=$(eval $curl_cmd)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Determine if test passed
    local test_passed=false
    
    if [ "$expect_auth_error" == "true" ]; then
        # For protected endpoints without auth, 401 is expected
        if [ "$http_code" == "401" ]; then
            test_passed=true
        fi
    else
        # For normal tests, 2xx or 3xx codes are success
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
            test_passed=true
        fi
    fi
    
    if [ "$test_passed" == "true" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - HTTP $http_code"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_test "$endpoint" "PASSED" "$body" "$http_code"
    else
        echo -e "${RED}✗ FAILED${NC} - HTTP $http_code"
        echo -e "${RED}Response: $body${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_test "$endpoint" "FAILED" "$body" "$http_code"
    fi
    
    echo ""
}

echo -e "${CYAN}===========================================${NC}"
echo -e "${CYAN}  VTU App Comprehensive API Testing${NC}"
echo -e "${CYAN}  Date: $(date)${NC}"
echo -e "${CYAN}===========================================${NC}"
echo ""

# =====================
# 1. HEALTH CHECKS
# =====================
echo -e "${YELLOW}=== 1. HEALTH CHECK ENDPOINTS ===${NC}"
test_endpoint "GET" "/health" "" "" "Health Check Endpoint"
test_endpoint "GET" "/" "" "" "Root Endpoint"
test_endpoint "GET" "/api/test-topupmate" "" "" "TopUpMate Service Test"

# =====================
# 2. AUTHENTICATION
# =====================
echo -e "${YELLOW}=== 2. AUTHENTICATION ENDPOINTS ===${NC}"

# Register a new user
echo -e "${CYAN}Registering new test user...${NC}"
REGISTER_DATA=$(cat <<EOF
{
  "email": "$USER_EMAIL",
  "password": "$USER_PASSWORD",
  "first_name": "Test",
  "last_name": "User",
  "phone_number": "$USER_PHONE"
}
EOF
)
test_endpoint "POST" "/api/auth/register" "$REGISTER_DATA" "" "User Registration"

# Try to register duplicate user (should fail)
test_endpoint "POST" "/api/auth/register" "$REGISTER_DATA" "" "Duplicate User Registration (should fail)"

# Resend OTP
RESEND_DATA=$(cat <<EOF
{
  "phone_number": "$USER_PHONE",
  "email": "$USER_EMAIL"
}
EOF
)
test_endpoint "POST" "/api/auth/resend-otp" "$RESEND_DATA" "" "Resend OTP"

# Verify OTP (will fail without correct OTP, but tests endpoint)
OTP_DATA=$(cat <<EOF
{
  "phone_number": "$USER_PHONE",
  "otp_code": "123456"
}
EOF
)
test_endpoint "POST" "/api/auth/verify-otp" "$OTP_DATA" "" "Verify OTP (with invalid code)"

# Login (may fail if OTP verification required)
LOGIN_DATA=$(cat <<EOF
{
  "email": "$USER_EMAIL",
  "password": "$USER_PASSWORD"
}
EOF
)
test_endpoint "POST" "/api/auth/login" "$LOGIN_DATA" "" "User Login"

# =====================
# 3. USER ENDPOINTS (Without Auth - Should Fail)
# =====================
echo -e "${YELLOW}=== 3. USER ENDPOINTS (Without Authentication) ===${NC}"
test_endpoint "GET" "/api/users/profile" "" "" "Get Profile (No Auth)" "true"
test_endpoint "PUT" "/api/users/profile" '{"first_name":"Updated"}' "" "Update Profile (No Auth)" "true"
test_endpoint "GET" "/api/users" "" "" "Get All Users (No Auth)" "true"
test_endpoint "POST" "/api/users/kyc" '{"document_type":"nin","document_number":"12345678901"}' "" "Upload KYC (No Auth)" "true"

# =====================
# 4. WALLET ENDPOINTS (Without Auth)
# =====================
echo -e "${YELLOW}=== 4. WALLET ENDPOINTS (Without Authentication) ===${NC}"
test_endpoint "GET" "/api/wallet" "" "" "Get Wallet (No Auth)" "true"
test_endpoint "POST" "/api/wallet/fund" '{"amount":1000}' "" "Fund Wallet (No Auth)" "true"
test_endpoint "GET" "/api/wallet/transactions" "" "" "Get Wallet Transactions (No Auth)" "true"
test_endpoint "POST" "/api/wallet/transfer" '{"amount":100,"recipient":"08012345678"}' "" "Transfer Funds (No Auth)" "true"

# =====================
# 5. TRANSACTION ENDPOINTS (Without Auth)
# =====================
echo -e "${YELLOW}=== 5. TRANSACTION ENDPOINTS (Without Authentication) ===${NC}"
test_endpoint "GET" "/api/transactions" "" "" "Get User Transactions (No Auth)" "true"
test_endpoint "GET" "/api/transactions/all" "" "" "Get All Transactions (No Auth)" "true"
test_endpoint "POST" "/api/transactions" '{"type":"airtime","amount":100}' "" "Create Transaction (No Auth)" "true"

# =====================
# 6. PAYMENT ENDPOINTS
# =====================
echo -e "${YELLOW}=== 6. PAYMENT ENDPOINTS ===${NC}"
test_endpoint "GET" "/api/payment/banks" "" "" "Get Banks (No Auth)" "true"
test_endpoint "POST" "/api/payment/initiate" '{"amount":1000}' "" "Initiate Payment (No Auth)" "true"
test_endpoint "GET" "/api/payment/virtual-account" "" "" "Get Virtual Account (No Auth)" "true"
test_endpoint "POST" "/api/payment/virtual-account" '{"accountNumber":"1234567890"}' "" "Create Virtual Account (No Auth)" "true"

# =====================
# 7. ADMIN ENDPOINTS
# =====================
echo -e "${YELLOW}=== 7. ADMIN ENDPOINTS ===${NC}"
ADMIN_LOGIN_DATA=$(cat <<EOF
{
  "email": "admin@example.com",
  "password": "Admin@123456"
}
EOF
)
test_endpoint "POST" "/api/admin/login" "$ADMIN_LOGIN_DATA" "" "Admin Login"
test_endpoint "GET" "/api/admin/dashboard" "" "" "Admin Dashboard (No Auth)" "true"
test_endpoint "GET" "/api/admin/users" "" "" "Admin Get All Users (No Auth)" "true"
test_endpoint "GET" "/api/admin/audit-logs" "" "" "Get Audit Logs (No Auth)" "true"

# =====================
# 8. NOTIFICATION ENDPOINTS (Without Auth)
# =====================
echo -e "${YELLOW}=== 8. NOTIFICATION ENDPOINTS (Without Authentication) ===${NC}"
test_endpoint "GET" "/api/notifications" "" "" "Get Notifications (No Auth)" "true"
test_endpoint "PUT" "/api/notifications/read-all" "" "" "Mark All Read (No Auth)" "true"

# =====================
# 9. PROMOTION ENDPOINTS (Without Auth)
# =====================
echo -e "${YELLOW}=== 9. PROMOTION ENDPOINTS (Without Authentication) ===${NC}"
test_endpoint "GET" "/api/promotions" "" "" "Get Active Promotions (No Auth)" "true"
test_endpoint "POST" "/api/promotions" '{"title":"Test Promo","discount":10}' "" "Create Promotion (No Auth)" "true"

# =====================
# 10. SUPPORT ENDPOINTS (Without Auth)
# =====================
echo -e "${YELLOW}=== 10. SUPPORT ENDPOINTS (Without Authentication) ===${NC}"
test_endpoint "GET" "/api/support" "" "" "Get Support Tickets (No Auth)" "true"
TICKET_DATA=$(cat <<EOF
{
  "subject": "Test Issue",
  "message": "This is a test support ticket",
  "priority": "medium"
}
EOF
)
test_endpoint "POST" "/api/support" "$TICKET_DATA" "" "Create Support Ticket (No Auth)" "true"
test_endpoint "GET" "/api/support/all" "" "" "Get All Tickets (No Auth)" "true"

# =====================
# SUMMARY
# =====================
echo ""
echo -e "${CYAN}===========================================${NC}"
echo -e "${CYAN}  Test Summary${NC}"
echo -e "${CYAN}===========================================${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
if [ $SKIPPED_TESTS -gt 0 ]; then
    echo -e "${YELLOW}Skipped: ${SKIPPED_TESTS}${NC}"
fi
echo ""
echo -e "Test User Email: ${USER_EMAIL}"
echo -e "Test User Phone: ${USER_PHONE}"
echo ""
echo -e "Detailed results saved to: ${TEST_RESULTS_FILE}"
echo ""

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Success Rate: ${SUCCESS_RATE}%"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo -e "${GREEN}✓ Excellent! Most APIs are working correctly.${NC}"
    elif [ $SUCCESS_RATE -ge 70 ]; then
        echo -e "${YELLOW}⚠ Good, but some APIs need attention.${NC}"
    else
        echo -e "${RED}✗ Multiple APIs have issues that need fixing.${NC}"
    fi
fi
echo ""
