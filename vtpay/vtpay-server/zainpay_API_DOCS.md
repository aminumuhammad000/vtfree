
# Prompt: Build a Payment Gateway and Virtual Account Provider Using Zainpay API

You are an expert software architect and fintech engineer.
Your task is to design and guide the development of a full **Payment Gateway + Virtual Account Provider (VAP)** system using **Zainpay API**.

Use the Zainpay API documentation that will be provided separately.
Your output must be technical, complete, and follow fintech engineering best practices.

## 1. System Objective

Design and build a robust platform that allows merchants and mobile apps to:

* Generate customer-specific virtual bank accounts.
* Receive automated payment notifications (webhooks).
* Handle settlements, reconciliations, and transaction status checks.
* Support multiple payment channels (bank transfer, USSD, card, etc.).
* Provide a developer-friendly API gateway for third-party integrations.

## 2. Core Features Required

List all necessary features under these categories:

### A. Virtual Account Provider (VAP)

* Create static virtual accounts per user.
* Create dynamic virtual accounts per transaction.
* Assign BVN-linked virtual accounts (if supported).
* Generate bank details (bank name, account number, reference).
* Automated linking of virtual accounts to wallet IDs.
* Validate incoming bank transfers.
* Real-time credit alerts via webhook.
* Transaction reference matching.
* Chargeback and dispute support.

### B. Wallet System

* Create wallet per user.
* Ledger-based accounting.
* Balance tracking.
* Transaction history.
* Debit/credit operations.
* Locked balance (hold funds for KYC or pending transfer).
* Reconciliation ledger.

### C. Payment Gateway

* Accept bank transfers.
* Accept card payments (if Zainpay supports).
* Accept USSD payments.
* Support QR-pay (optional).
* Instant payment verification.
* Retry logic for delayed bank notifications.
* Webhooks for:

  * Successful payment
  * Failed payment
  * Pending transaction
* API to check transaction status manually.

### D. Merchant Dashboard (Admin and Client)

* Merchant onboarding.
* API key generation (public and secret keys).
* Whitelist IPs.
* View all virtual accounts.
* View all transactions.
* Filter by date, user, channel, status.
* Settlement overview.
* Download CSV/Excel reports.
* Real-time notifications.

### E. KYC & Compliance

* Tiered KYC levels.
* NIN, BVN, phone, email verification support.
* Freeze/unfreeze user wallet.
* Regulatory audit logs.
* Fraud monitoring rules (velocity check, duplicate transfers, unusual patterns).

### F. Settlements & Payouts

* Manual and automated settlement to banks.
* Support single and bulk payouts.
* Wallet-to-bank transfer.
* Wallet-to-wallet transfer (internal).
* Settlement schedule (T+0, T+1).
* Settlement export logs.
* Beneficiary validation (NIP name enquiry).

### G. Security & Infrastructure

* JWT + API key authentication.
* HMAC signature validation for webhooks.
* Encryption at rest and in transit.
* Role-based access (RBAC).
* Audit trail.
* Rate limiting and fraud throttling.
* Cloud infrastructure (AWS or similar):

  * Load balancer
  * Auto scaling groups
  * Managed PostgreSQL
  * Redis for caching
  * Queue system for processing webhooks (SQS, RabbitMQ)

### H. Developer API

Document the following endpoints:

* Create virtual account
* Resolve account (verify bank transfer)
* Fetch account details
* Create checkout payment
* Verify transaction
* List transactions
* Create payout
* Verify payout
* Wallet operations (credit, debit, balance)

Include:

* Request/response format
* Example payloads
* Error codes
* Signature validation steps

### I. Audit & Reconciliation

* Daily reconciliation with Zainpay.
* Reconcile virtual account credits.
* Automated mismatch detection.
* Manual adjustment interface.
* Downloadable reconciliation reports.

---

## 3. System Architecture

Request the model to produce:

* High-level architecture diagram.
* Microservices breakdown.
* Database schema (users, wallets, virtual_accounts, transactions, settlements, payouts).
* Queue design for webhook processing.
* State machine for payment lifecycle.
* Security flow diagrams (KYC, webhook signing, API key use).

---

## 4. Development Deliverables

Specify that you want the model to return:

* Full backend architecture.
* Detailed API endpoints with TypeScript or Rust examples.
* Database models (PostgreSQL).
* Webhook signature validation logic.
* Unit and integration testing plan.
* Deployment strategy.
* Logging and observability setup (OpenTelemetry).

---

## 5. Output Format

Tell the model to output:

1. System overview
2. Feature breakdown
3. Architecture diagram (ASCII)
4. Database schema
5. API endpoints
6. Webhook flow
7. Security model
8. KYC tiers
9. Settlement logic
10. Error codes
11. Testing plan
12. Deployment plan

---

If you want, I can also generate:

* Developer documentation
* Sample code for Zainpay integration
* Admin dashboard UI structure
* Wallet ledger design
* Webhook processing code (Node.js, Rust, TS)

Just tell me.



zainpay documentaion:

Overview
Welcome to Zainpay API Documentation.
Build seamless payments experiences with our simple and robusts APIs.The flexibility provided by Zainpay enables easy integration of products to fully customize user experiences.

Learn how to accept bank payments, manage accounts, and integrate products in your most preferred language/framework.

Authentication
A test public/private key pair will be provided to you once you sign up. Similar keys will be provided to you for your live transactions once your account has been verified and approved. You must include the public key as a bearer authorization header for each request. An example is given below when fetching zainboxes list using axios.
Zainpay Base URLs
BASE_URL(Sandbox): https://api.zainpay.ng
BASE_URL(Live): https://api.zainpay.ng

Request Payload
MethodGET

      

axios.get('https://api.zainpay.ng/zainbox/list', {
      headers: {
        'Authorization': `Bearer {public_key}`,
      }
})                
           
      

       
Create Zainbox
USE: Create a zainbox. A zainbox is a virtual bucket that allows a merchant to create unlimited multiple virtual accounts.
URL : host/zainbox /virtual-account/create/request
Sandbox Query : https://api.zainpay.ng/zainbox/create/request
Live Query : https://api.zainpay.ng/zainbox/create/request
Required Payload Properties: name, callbackUrl
Optional Payload Properties: emailNotification, description, tags, codeNamePrefix, allowAutoInternalTransfer

Auto Internal Transfer
The Auto Internal Transfer feature in Zainpay simplifies fund settlement by automatically consolidating deposits from all virtual accounts within a Zainbox into a single Internal Settlement Account. This account is automatically generated when the Zainbox is created.

Funds deposited into any virtual account within the Zainbox are automatically transferred to the Internal Settlement Account. Additionally, card payments are also settled directly into this account, providing a unified view of all payment collections within the Zainbox.

The Internal Settlement Account serves as the sole source of payouts or settlements. By consolidating funds into one account, discrepancies and errors during settlement are minimized.

By default, the "allowAutoInternalSettlement "is set to false, meaning it is turned off. This ensures that auto-internal transfers are only initiated when intentionally enabled.

To activate, set allowAutoInternalSettlement to true:

{
    "allowAutoInternalSettlement": true
  }
Once enabled, funds deposited into virtual accounts will begin transferring automatically to the Internal Settlement Account.

Request Payload
MethodPOST

      

{
  "name": "Example Merchant",
  "callbackUrl": "https://example.com/callback",
  "emailNotification": "notify@example.com",
  "description": "This is an example merchant",
  "tags": "tag1, tag2",
  "codeNamePrefix": "EXM",
  "allowAutoInternalTransfer": true
}             
           
      

       
JSON Response

      

{
  "code": "00",
  "data": [
    {
    "callbackUrl": "https://example.com/webhook/zainpay ",
    "codeName": "THbfnDvK5o",
    "emailNotification": "myemail@example.com",
    "name": "test-box",
    "tags": "land, management"
    },
  {
    "callbackUrl": "https://example.com/webhook/zainpay ",
    "codeName": "Zbx9022334",
    "emailNotification": "myemail2@example.com",
    "name": "test-box-2",
    "tags": "charity"
  }
  ],
  "description": "successful",
  "status": "200 OK"
}               
           
      

       
Get all Zainboxes
USE: Get all your created zainboxes
Call Method: GET
URL : host/zainbox/list
Sandbox Query : https://api.zainpay.ng/zainbox/list
Live Query : https://api.zainpay.ng/zainbox/list
Parameter:

JSON Response :

      

{
"code": "00",
    "data": 
[
    {
        "callbackUrl": "https://example.com/webhook/zainpay ",
        "codeName": "THbfnDvK5o",
        "name": "test-box",
        "tags": "land, management"
    },
    {
    "callbackUrl": "https://example.com/webhook/zainpay ",
    "codeName": "rAqwjnYO5chL3QuV7yk0",
    "name": "powershop8",
    "tags": "discos, kedco, aedc"
    }
],
    "description": "successful",
    "status": "Success"
}                           
           
      

       
Update Zainbox
USE: This endpoint is used to update a Zainbox.
URL : host/zainbox/update
Sandbox Query : https://api.zainpay.ng/zainbox/update
Live Query : https://api.zainpay.ng/zainbox/update
Parameter : ZainboxCode(Required), callbackUrl(optional), name(Required), emailNotification(optional)

Request Payload
MethodPATCH

      

{
  "name":"Test One", 
  "tags": "testUpdate",
  "callbackUrl": "https://example.com/ ", 
  "emailNotification": "test@example.com",
  "codeName": "ze73kjdiurwej94sss"
}                    
           
      

       
JSON Response

      

{
"code": "00",
"description": "zainbox successfully updated",
"status": "200 OK"
}
           
      

       
Get all Zainbox Accounts
USE: Get all virtual accounts linked to a zainbox
Call Method: GET
URL : host/zainbox/virtual-accounts/{zainboxCodeName}
Sandbox Query : https://api.zainpay.ng/zainbox/virtual-accounts/{zainboxCodeName}
Live Query : https://api.zainpay.ng/zainbox/virtual-accounts/{zainboxCodeName}
Parameter : zainboxCodeName (required)

JSON Response :

      

[
  {
      "bankAccount": "7966903286",
      "bankName": "035",
      "name": "Go fundme Limited"
  },
  {
      "bankAccount": "7969472891",
      "bankName": "035",
      "name": "Idris Urmi Bello"
  }
]
                  
           
      

       
All Virtual Account Balance of a Zainbox
USE: This endpoint fetches all current account balances for all virtual accounts in a zainbox.
Call Method: GET
URL : host/zainbox/accounts/balance/{zainboxCode}
Sandbox Query : https://api.zainpay.ng/zainbox/accounts/balance/THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/accounts/balance/THbfnDvK5o
Parameter: zainboxCode(Required)

JSON Response

      

{
  "code": "00",
  "data":  
  [
    {
    "accountName": "Aminu Nasar",
    "accountNumber": "7966884043",
    "balanceAmount": 372555,
    "transactionDate": "2021-10-13T13:45:52"
    },
    {
    "accountName": "Khalid Ali Sani",
    "accountNumber": "1234567890",
    "balanceAmount": 200,
    "transactionDate": "2021-12-13T13:45:52"
    },
    {
    "accountName": "Nura Bala Usman",
    "accountNumber": "9900778833",
    "balanceAmount": 105000,
    "transactionDate": "2022-01-29T13:45:52"
    }
  ]
  "description": "successful",
  "status": "Success"
}                 
           
      

       
Zainbox Transactions History
USE: Get a list of transactions from a particular zainbox
Call Method: GET
URL : host/zainbox/transactions/{zainboxCode}
Sandbox Query : https://api.zainpay.ng/zainbox/transactions/THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/transactions/THbfnDvK5o
Parameter: zainboxCode(Required)

JSON Response

      

{
"code": "00",
"data": [
  {
    "accountNumber": "7964524199",
    "amount": 45000,
    "balance": 45000,
    "narration": "",
    "transactionDate": "2021-12-28T11:47:45",
    "transactionRef": "",
    "transactionType": "deposit"
  },
  {
    "accountNumber": "7964524199",
    "amount": 923000,
    "balance": 968000,
    "narration": "",
    "transactionDate": "2021-12-28T11:48:35",
    "transactionRef": "",
    "transactionType": "deposit"
  }],
"description": "successful",
"status": "Success"
}               
          
      

       
Total Payment Collected By Zainbox
USE: Get the sum of total amount collected by all virtual accounts for a particular zainbox in a particular period, for both transfer and deposit transactions
Call Method: GET
URL : host/zainbox/transfer/deposit/summary/{zainboxCode}
Sandbox Query : https://api.zainpay.ng/zainbox/transfer/deposit/summary/THbfnDvK5o?dateFrom=2022-02&dateTo=2022-03
Live Query : https://api.zainpay.ng/zainbox/transfer/deposit/summary/THbfnDvK5o?dateFrom=2022-02&dateTo=2022-03
Parameter: zainboxCode (Required), dateFrom (optional, if not provided, the system returns the data of the current month), dateTo (optional)

JSON Response

      

{
"code": "00",
"data": [
  {
    "count": 4,
    "dateFrom": "2022-02",
    "dateTo": "2022-03",
    "total": "12690",
    "transactionType": "deposit"
  },
    {
    "count": 4,
    "dateFrom": "2022-02",
    "dateTo": "2022-03",
    "total": "29038",
    "transactionType": "transfer"
  }
        ],
"description": "Summary grouped by txn type",
"status": "Success"
}
                             
           
      

       
Zainbox Profile and Current Billing Plan
USE: Get the complete profile of a Zainbox, including the Current Billing Plan for account to account and interBank transfers respectively
Call Method: GET
URL : host/zainbox/profile/{zainboxCode}
Sandbox Query : https://api.zainpay.ng/zainbox/profile/THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/profile/THbfnDvK5o
Parameter : zainboxCode (required)

JSON Response

      

{
"code": "00",
"description": "successful",
"status": "Success",
"data": {
  "zainbox": {
      "callbackUrl": "https://example.com/webhook/zainpay",
      "codeName": "THbfnDvK5o",
      "name": "test-box",
      "tags": "land, management"
      },
  "account2AccountBilling": {
      "fixedCharge": "1000",
      "percentageCharge": 1.5
      },
  "interBankBilling": {
      "fixedCharge": "5000.0",
      "percentageCharge": 1.4
      }
  }
  
}             
           
      

       
Create Settlement
USE: For Scheduling Settlement
Create a scheduled settlement for a zainbox
To create a scheduled settlement for a zainbox., please bear in mind that at any given time, a zainbox can only have one type of settlement.

Planned settlements are divided into three categories.



T1

-

Transaction plus one working day

The value of the T1 schedule. The period must always be on a daily basis.



T7

-

Trasaction plus 7 days

Transaction plus seven days for T7 schedule should be one of Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday



T30

-

Transaction plus 30 days

The schedule Period value for T30 should be 1 - 30 or lastDayOfMonth

 Important Note
Days like February 28th and February 29th, as well as months with only 30 days,

will be covered by lastDayOfMonth

The payload's settlementAccountList parameter is an array/list of bank accounts with their corresponding settlement percentages.

Scenario:
Let's say you have a zainbox with three virtual accounts, and you want to set it up so that the total deposits in these three virtual accounts are split between two accounts at every Transaction plus one day (T1). The first settlement account has 90% of the funds, whereas the second contains only 10%.

Call Method: POST
URL : host/zainbox/settlement
Sandbox Query : https://api.zainpay.ng/zainbox/settlement
Live Query : https://api.zainpay.ng/zainbox/settlement
Token: Required

Request Payload
MethodPOST

      

{
"name": "new-daily-settlement3", "zainboxCode": "THbfnDvK5o", "scheduleType": "T1",
"schedulePeriod": "Daily", "settlementAccountList": 
[
{ "accountNumber":"1234567890", "bankCode":"0009", "percentage": "10" },
{ "accountNumber":"1234567890", "bankCode":"0009", "percentage": "90" }
],
"status": true
}             
           
      

       
JSON Response

      

{
  "code": "00",
  "description": "successful",
  "status": "200 OK"
}              
      
      

       
Deactivating Schedule:
To de-activate a schedule, simply update the payload and set the STATUS parameter to FALSE

API CODES

python

Node.js

CURL
import requests 
    url = "https://api.zainpay.ng/zainbox/settlement" 
    payload = {
        "name": "new-daily-settlement3",
        "scheduleType": "T30",
        "schedulePeriod": "Daily",
        "zainboxCode": "THbfnDvK5op",
        "status": True
        }
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer  your_public_key_here"
        }
        response = requests.request("POST", url, json=payload, headers=headers)
    print(response.text)                                                                                                       
    
Get Settlement
USE: For getting settlement(s) tied to a zainbox
Call Method: GET
URL : host/zainbox/settlement?{zainboxCode}
Sandbox Query : https://api.zainpay.ng/zainbox/settlement?zainboxCode=THbfnDvK5o
Live Query : https://api.zainpay.ng/zainbox/settlement?zainboxCode=THbfnDvK5o
Parameter : zainboxCode (required)

JSON Response

      

{
	"code": 200,
	"status": "success",
	"description": "Successful",
	"data": {
		"name": "Asusu",
		"schedulePeriod": "Daily",
		"scheduleType": "T1",
		"settlementAccounts": 
    [
      { 
        "accountNumber":"1234567890", 
        "bankCode":"0009", 
        "percentage": "10" 
      },
      { 
        "accountNumber":"1234567890", 
        "bankCode":"0009", 
        "percentage": "90" 
      }
    ],
	"zainbox": "THbfnDvK5o"
 }
}        
           
      

       Create Virtual Account
USE: Create a virtual account. Map a virtual account to a zainbox. A zainbox can hold multiple virtual accounts. Set Bank type string to"fidelity" for a Fidelity Bank virtual account, "fcmb" for FCMB virtual account or "gtBank" for a Guaranty trust Bank virtual account.
Note: Replace Bank type String with the desired Bank type. Available Banks are FidelityBank, FCMB and GT Bank
Call Method: POST
URL : host/zainbox/virtual-account/create/request
Sandbox Query : https://api.zainpay.ng/virtual-account/create/request
Live Query : https://api.zainpay.ng/virtual-account/create/request
Parameter:

Request Payload:
MethodPOST

      

{
"bankType": "gtBank",
"firstName": "Amina12",
"surname": "Test",
"email": "shuaiba11@gmail.com",
"mobileNumber": "08092837262",
"dob": "12-08-1996",
"gender": "M",
"address": "bompai",
"title": "Mr",
"state": "Kano",
"bvn": "22345678901",
"zainboxCode": "THbfnDvK5o"
}                       
      

       
JSON Response

      

{
"code": "00",
"data": {
"bankName": "gtBank",
"email": "shuaiba11@gmail.com",
"accountName": "Betastack Test Amina12",
"accountType": "",
"accountNumber": "2917863937"
},
"description": "successful",
"status": "200 OK"
}    
           
      

       
Virtual Account Balance
Use : Get the current wallet balance of a virtual account number
Call Method: GET
URL : host/zainbox/virtual-account/wallet/balance/{accountNumber}
Sandbox Query : https://api.zainpay.ng/virtual-account/wallet/balance/7965332109
Live Query : https://api.zainpay.ng/virtual-account/wallet/balance/7965332109
Parameter : accountNumber (required)

JSON Response

      

{"code": "00",
  "data":
  {
  "accountName": "Aminu Nasar Adam", 
  "accountNumber": "7966884043", 
  "balanceAmount": 372555, 
  "transactionDate": "2021-10-13T13:45:52" 
  }
  , 
  "description": "successful",
  "status": "Success" 
}             
           
      

       
Update Virtual Account Status
Use : Activate or deactivate virtual account
Call Method: PATCH
URL : host/virtual-account/change/account/status
Sandbox Query : https://api.zainpay.ng/virtual-account/change/account/status
Live Query : https://api.zainpay.ng/virtual-account/change/account/status
Parameter :

Request Payload
MethodPATCH

      

{
    "zainboxCode": "THbfnDvK5o", 
    "accountNumber": "7963799062", 
    "status": true 
}                 
           
      

       
NOTE: Setting the status field to true will activate the virtual account, while setting it to false will deactivate it.

 Important Note
A deactivated virtual account will not be able to receive or transfer funds

Successful JSON Response

      

{
    "code": "00",
    "description": "Successfully Updated Account",
    "status": "success"
}                  
           
      

       
Failed JSON Response

      

{
    "code": "04",
    "description": "Failed to Update Account",
    "status": "Failed"
}     
      

       
Virtual Account Transactions
USE: Get all transactions of an account
Call Method: GET
URL : host/zainbox/virtual-account/wallet/transactions/{accountNumber}
Sandbox Query : https://api.zainpay.ng/virtual-account/wallet/transactions/7965332109
Live Query : https://api.zainpay.ng/virtual-account/wallet/transactions/7965332109
Parameter : accountNumber (required)

JSON Response

      

{
"code": "00",
"data": 
[
{
    "accountNumber": "7966884043",
    "destinationAccountNumber": "2000002105",
    "amount": 7289,
    "balance": 379844,
    "narration": "",
    "transactionDate": "2021-10-13T13:41:39",
    "transactionRef": "",
    "transactionType": "transfer"
},
{
    "accountNumber": "7966884043",
    "destinationAccountNumber": "1234567890",
    "amount": 7289,
    "balance": 372555,
    "narration": "",
    "transactionDate": "2021-10-13T13:45:52",
    "transactionRef": "",
    "transactionType": "transfer"
}
],
    "description": "successful",
    "status": "Success"
}               
           
      

       
Get Bank List
USE: Get the list of available banks.
Call Method: GET
URL : host/zainbox/bank/list
Sandbox Query : https://api.zainpay.ng/bank/list
Live Query : https://api.zainpay.ng/bank/list
Parameter:

JSON Response

      

{
  "code": "00",
  "data": [
    {
      "code": "120001",
      "name": "9PAYMENT SERVICE BANK"
    },
    {
      "code": "090270",
      "name": "AB MICROFINANCE BANK"
    },
    {
      "code": "070010",
      "name": "ABBEY MORTGAGE BANK"
    }
    ],
  "description": "Bank list",
  "status": "Success"
}      
           
      

       
Name Enquiry
USE: Use the bankCode acquired from the get bank list to validate a bank account number.
Call Method: GET
URL : host/zainbox/bank/name-enquiry?{bankCode}&{accountNumber}
Sandbox Query : https://api.zainpay.ng/bank/name-enquiry?bankCode=000013&accountNumber=0011242735
Live Query : https://api.zainpay.ng/bank/name-enquiry?bankCode=000013&accountNumber=0011242735
Parameter: bankCode(Required), accountNumber(Required)

JSON Response

      

{
    "code": "00",
    "data": {
        "accountName": "Nura Aminu Muhammad",
        "accountNumber": "004532112",
        "bankCode": "000014",
        "bankName": "ACCESS BANK"
    },
    "description": "successful",
    "status": "Success"
}                          
           
      

       
Funds Transfer
USE: Fund transfers can be made in the following ways:


Transferring money from one wallet to another



Make a bank account transfer from your wallet

Zainpay infers your fund transfer type, so you don't have to specify it. The charges for each form of transfer are different. This charge can be obtained through your commercials.

Call Method: POST
URL : host/zainbox/bank/transfer/v2
Sandbox Query : https://api.zainpay.ng/bank/transfer/v2
Live Query : https://api.zainpay.ng/bank/transfer/v2

 Important Note
The amount in the JSON request should be converted to kobo decimalization. It is expected that neither float nor double values will be utilized in this case.

Request Payload
MethodPOST

      

{
    "destinationAccountNumber": "0012121252",
    "destinationBankCode": "000005",
    "amount": "2500",
    "sourceAccountNumber": "7965540126",
    "sourceBankCode": "0013",
    "zainboxCode": "13934_rgwUtC",
    "txnRef": "1119809090831300508190108",
    "narration": "kano street",
    "callbackUrl": "https://xainapp.com"
}              
           
      

       
JSON Success Response

      

{
  "code": "200 OK",
  "data": {
  "amount": "1000",
  "callBackUrl": "https://xainapp.com",
  "destinationAccountName": "IDRIS KABIR",
  "destinationAccountNumber": "0012121252",
  "destinationBankCode": "000005",
  "narration": "kano street",
  "paymentRef": "NIPMINI/46643/Payment from Betastack",
  "sourceAccountNumber": "7965540126",
  "sourceBankAccountName": "wemaBank",
  "sourceBankCode": "0013",
  "status": "success",
  "totalTxnAmount": "1100",
  "txnFee": "100",
  "txnRef": "1119809090831300508190108",
  "zainboxCode": "13934_rgwUtC"
  },
  "description": "Funds Transfer Successful ",
  "status": "200 OK"
}         
           
      

       
JSON Failure Response

      

{
  "code": "500 Bad gateway",
  "data": {
  "amount": "1000",
  "callBackUrl": "https://xainapp.com",
  "failureReason": "destination bank not responding",
  "destinationAccountNumber": "0012121252",
  "destinationBankCode": "000005",
  "narration": "kano street",
  "status": "failed",
  "txnRef": "1119809090831300508190108",
  "zainboxCode": "13934_rgwUtC"
  },
  "description": "Funds Transfer Failed! ",
  "status": "500 Bad gateway"
}        
           
      

       
Transfer Verification
USE: The endpoint can be used to verify a posted transfer by its txnRef acquired after successful Funds Transfer
Call Method: GET
URL : host/virtual-account/wallet/transaction/verify/{txnRef}
Sandbox Query : https://api.zainpay.ng/virtual-account/wallet/transaction/verify/svxgdtyGDHt67
Live Query : https://api.zainpay.ng/virtual-account/wallet/transaction/verify/hJDHtyr8874
Parameter: txnRef (Required)

JSON Response for valid transaction

      

{
	"code": "00",
	"data": {
		"amount": "29500",
		"destinationAccountNumber": "0139900794",
		"destinationBankCode": "000018",
		"narration": " launch for devs",
		"paymentRef": "3341110202_999999240902123233374094734063",
		"sourceAccountNumber": "7966349147",
		"txnDate": "2024-09-02T12:31:49",
		"txnRef": "11131300503180079",
		"txnStatus": "success"
	},
	"description": "successful",
	"status": "200 OK"
}       
      

       
JSON Response for invalid transaction

      


{
	"code": "04",
	"description": "Txn not found",
	"status": "Failed"
}                 
           
      

       
Deposit Verification
USE: The endpoint can be used to verify a funds deposit notification received via our Deposit WebHook notification event
Call Method: GET
URL : host/virtual-account/wallet/deposit/verify/v2/{txnRef}
Sandbox Query : https://api.zainpay.ng/virtual-account/wallet/deposit/verify/v2/{txnRef}
Live Query : https://api.zainpay.ng/virtual-account/wallet/deposit/verify/v2/{txnRef}
Parameter: txnRef(required). The txnRef sent in the webhoook notificatoin payload.

JSON Response for valid reference

      

{
"code": "00",
"data": {
"amountAfterCharges": 3692500,
"bankName": "WEMA BANK",
"beneficiaryAccountName": "7961644804",
"beneficiaryAccountNumber": "7961644804",
"narration": "Registration fees",
"paymentDate": "2024-11-01T18:06:15.674293",
"paymentRef": "JNJQyYBBtPqO4IX2jbro",
"sender": "7964673997",
"senderName": "7964673997",
"txnDate": "2024-11-01T18:06:15.674135",
"txnRef": "ACK_202411011706134459",
"txnType": "deposit",
"zainboxCode": "Live_RHei952Nk3BiqoBQr3DW",
"zainboxName": "Live"
},
"description": "successful",
"status": "200 OK"
}            
           
      

       
JSON Response for invalid reference

      


{
	"code": "04",
	"description": "Txn not found",
	"status": "Failed"
}                 
           
      

       
Merchant Transactions
USE: Get the list of first 50 transactions of a merchant
Call Method: GET
URL : host/zainbox/transactions?count=10
Sandbox Query : https://api.zainpay.ng/zainbox/transactions?count=10
Live Query : https://api.zainpay.ng/zainbox/transactions?count=10
Parameter: count is an optional parameter with a default value of 20

JSON Response

      

{
"code": "00",
"data": 
  [
   {
    "accountNumber": "7964524199",
    "amount": 45000,
    "balance": 45000,
    "narration": "",
    "transactionDate": "2021-12-28T11:47:45",
    "transactionRef": "",
    "transactionType": "deposit"
   },
   {
    "accountNumber": "7964524199",
    "amount": 923000,
    "balance": 968000,
    "narration": "",
    "transactionDate": "2021-12-28T11:48:35",
    "transactionRef": "",
    "transactionType": "deposit"
    }
  ],
"description": "successful",
"status": "Success"
}             
           
      

       
Bank Deposit Reconciliation
USE: This endpoint helps our merchant repush all hanging deposits made in a virtual account.
Call Method: GET
URL : host/virtual-account/wallet/transaction/reconcile/bank-deposit
Sandbox Query : https://api.zainpay.ng/virtual- account/wallet/transaction/reconcile/bank-deposit
Live Query : https://api.zainpay.ng/virtual-account/wallet/transaction/reconcile/bank- deposit
Parameter: sessionId, verificationType, bankType, accountNumber

Note:
1. The values of verificationType can only be anyone of depositReferenceNumber or depositAccountNumber
2. sessionId is required when verificationType = depositReferenceNumber, also accountNumber , verificationType , bankType are all required

JSON Response

      

{
"code": "00",
"data": {
"amount": {
"amount": 44300.000
},
"bankName": "000017",
"beneficiaryAccountName": "Zainpay",
"beneficiaryAccountNumber": "4427686982",
"narration": "any bba",
"paymentDate": "2023-11-28T10:20:23.546817",
"paymentRef": "000017231128997",
"sender": "Zainpay",
"senderName": "Zainpay",
"txnDate": "2023-11-28T10:20:20.105073","txnRef": "20231128091119552",
"txnType": "deposit",
"zainboxCode": "0UW8e14g4xJxmxMbHkMy"
},
"description": "successful",
"status": "200 OK"
}          
           
      

       
Error Response

      


{
"code": "20",
"description": "Deposit not verified, please try again",
"status": "502 Bad Gateway"
}             
           
      

       
Create Dynamic Virtual Account (DVA)
Create a temporary virtual account for a specific transaction. The account is valid for the specified duration, and funds received are automatically settled into the merchant's Internal Settlement Account (ISA) tied to the Zainbox used.
Note: Amount must be in kobo. Duration must be between 300 seconds (5 minutes) and 72 hours. Account Name is fixed as "Zainpay Checkout".
Call Method: POST
Live Query: https://api.zainpay.ng/virtual-account/dynamic/create/request
Sandbox Query: https://api.zainpay.ng/virtual-account/dynamic/create/request
Required Parameters: bankType, email, amount, zainboxCode, txnRef, duration, accountName, callBackUrl

Request Payload
MethodPOST

        

{
  "bankType": "gtBank",
  "email": "august@gmail.com",
  "amount": "50000",
  "zainboxCode": "20457_PdciM7SQFHc8f49EmAfy",
  "txnRef": "3734570194110645420356961",
  "duration": 120,
  "accountName": "Zainpay Checkout",
  "callBackUrl": "https://webhook.site/91a56ae3-6c54-4961-a6d3-a4e37aced7c9"
}
        

      
Successful Response

        

{
  "code": "00",
  "data": {
    "accountName": "Betastack Technology LTD",
    "accountNumber": "8183854198",
    "amount": "50000",
    "bankName": "gtBank",
    "duration": 120,
    "email": "august@gmail.com",
    "paymentStatus": "pending",
    "totalAmount": "55500",
    "txnFee": "5500",
    "txnRef": "3734570194110645420356961"
  },
  "description": "successful",
  "status": "200 OK"
}
        

      
Parameter Descriptions
Parameter	Type	Required	Description
bankType	String	Yes	Bank code (e.g., gtBank)
email	String	Yes	Customer email address
amount	Integer	Yes	Amount in kobo
zainboxCode	String	Yes	Zainbox code tied to merchant
txnRef	String	Yes	Unique transaction reference
duration	Integer	Yes	Validity period in seconds (300 to 259200)
accountName	String	Yes	Fixed as Zainpay Checkout
callBackUrl	String	Yes	Webhook URL for notifications
Special Rules
Amount must be in kobo.
Duration must be between 300 seconds (5 minutes) and 72 hours.
Account Name is fixed as "Zainpay Checkout".
There are four possible payment statuses of a dynamic virtual account stated in the table below:
Payment Status Definitions
SN	Status	Description
1	pending	This is the first status of a DVA when its initiated
2	success	This is the status when the expected amount is deposited within the live time of the DVA
3	mismatch	This is the status when the amount deposited is higher or lower than the expected amount. Note: mismatched amounts are automatically refunded to the depositor.
4	expired	This is the status when deposits are made while the DVA lifetime has expired. Note: any amount transfers to an expired DVA will be automatically refunded.
Important Notes
Mismatched deposit notifications are sent via webhook to the provided callBackUrl.
Successful deposits are settled into the Internal Settlement Account (ISA) tied to the Zainbox used.
Note: Mismatched amounts are automatically refunded to the depositor.
Note: Any amount transfers to an expired DVA will be automatically refunded.
Simulate Payment
Call Method: POST
Sandbox Query: https://sandbox-api-d.squadco.com/virtual-account/simulate/payment
Bearer Token: sandbox_sk_1c9f9593643d8fb24482711ec30bb8169f534a45bd87
Required Parameters: virtual_account_number, amount, dva

Simulate Payment Request Payload
MethodPOST

        

{
  "virtual_account_number": "3659723853",
  "amount": "101",
  "dva": true
}
        

      
Simulate Payment Successful Response

        

{
  "status": 200,
  "success": true,
  "message": "Success",
  "data": "Payment successful"
}
        

      
Simulate Payment Parameter Descriptions
Parameter	Type	Required	Description
virtual_account_number	String	Yes	The dynamic virtual account number created from the Create DVA endpoint. This is the unique identifier for the virtual account where the transaction will be processed. Example: "3659723853"
amount	String	Yes	The transaction amount in Naira (₦). Example: "101" means ₦101
dva	Boolean	Yes	Boolean value indicating if the payment is for a dynamic virtual account (true or false)
DVA Transaction Status Query (TSQ)
Use the following endpoint to check the status of your DVA payment:

Call Method: GET
Live Query: https://api.zainpay.ng/virtual-account/dynamic/deposit/status/{txnRef}
Sandbox Query: https://api.zainpay.ng/virtual-account/dynamic/deposit/status/{txnRef}
Where txnRef is the reference used when creating the DVA.

DVA Status Query Response

        

{
  "code": "200 OK",
  "data": {
    "accountName": "Zainpay Checkout",
    "accountNumber": "8183854198",
    "amount": "80000",
    "bankType": "gtBank",
    "callBackUrl": "https://webhook.site/8e878f96-c649-479e-a511-31604e7a53da",
    "createdDate": "2025-08-15T14:29:01.566421",
    "duration": 69,
    "email": "july@gmail.com",
    "status": "pending",
    "timeToLive": 51,
    "totalTxnAmount": "81200",
    "txnFee": "1200",
    "txnRef": "37345707331155454103469161",
    "zainboxCode": "THbfnDvK5o"
  },
  "description": "",
  "status": "200 OK"
}
        

      
TSQ Response Parameters
Parameter	Type	Description
accountName	String	Virtual account name
accountNumber	String	Generated virtual account number
amount	String	Expected amount in kobo
bankType	String	Bank code used
callBackUrl	String	Webhook URL for notifications
createdDate	String	ISO timestamp when DVA was created
duration	Integer	Total duration in seconds
email	String	Customer email address
status	String	Current payment status (pending, success, mismatch, expired)
timeToLive	Integer	Remaining time in seconds before expiry
totalTxnAmount	String	Total amount including fees in kobo
txnFee	String	Transaction fee in kobo
txnRef	String	Unique transaction reference
zainboxCode	String	Zainbox code used for the transaction
Error Responses
Code	HTTP Status	Description
01	400	Invalid request payload or missing required field
02	400	Invalid bank type
03	400	Duration out of allowed range
401	401	Unauthorized — missing or invalid API key
500	500	Internal server error

Webhooks/ Event Notifications
At Zainpay, listening to events notifications is not optional; as a lot of process statuses are pushed to your integration via this.

Listening to events
All triggered events will be posted per zainbox(as JSON Objects), be careful and ensure that your configured callback URL for a zainbox doesn't need any form of authentication or authorization, because of this, it's very important that you verify every event sent to avoid providing value to fake/counterfeit events. When an event is sent, it comes with a custom header called ```Zainpay-Signature``` which is an encrypted value of your payload using ```HmacSHA256``` and signed with your secret key.
An example of the header looks this way


      

```
Host: api.zainpay.ng
Cache-Control: no-cache
Zainpay-Signature: ec22e8478242a64c0cb9130f0f37b8090bda2a2681a5aab34dd01d0e97e291a061
User-Agent: api.zainpay.ng/1.0
Content-Type: application/json
```                      
           
      

       
Transfer
An event is pushed to the callback URL of every zainbox when funds are transferred to any of it's virtual account numbers. The payload structure is given below.

Successful Transfer Event

      

```
Host: api.zainpay.ng
Cache-Control: no-cache
Zainpay-Signature: ec22e8478242a64c0cb9130f0f37b8090bda2a2681a5aab34dd01d0e97e291a061
User-Agent: api.zainpay.ng/1.0
Content-Type: application/json
```

{
  "data": {
    "accountNumber": "7964182836",
    "amount": {
      "amount": 2100
    },
    "beneficiaryAccountNumber": "7964182836",
    "beneficiaryBankCode": "0013",
    "narration": "me and you",
    "paymentRef": "bOQtDmSgmiaZpXC6PiAR",
    "txnDate": "2022-01-05T12:43:35.291042627",
    "txnRef": "1q3311s",
    "txnType": "transfer", 
    “zainboxCode”: “xmaldoaYnakaAAVOAE”
  },
  "event": "transfer.success"
}                  
           
      

       
Failed Transfer Event

      

```
Host: api.zainpay.ng
Cache-Control: no-cache
Zainpay-Signature: ec22e8478242a64c0cb9130f0f37b8090bda2a2681a5aab34dd01d0e97e291a061
User-Agent: api.zainpay.ng/1.0
Content-Type: application/json
```

{
  "data": {
  "accountNumber": "98765445677",
  "amount": {
  "amount": 120987667
  },
  "beneficiaryAccountName": "",
  "beneficiaryAccountNumber": "9808787787",
  "beneficiaryBankCode": "000001",
  "internalTxnRef": "RTYUYT5TTS876567SS",
  "txnDate": "2024-09-28T12:50:27.13380995",
  "txnType": "transfer",
  "zainboxCode": "17621_WWWUYTY2I8znFsYbq"
  },
  "event": "transfer.failed"
}
    
           
      

       
Deposit
An event is pushed to the callback URL of every zainbox when its account number receives a deposit transaction. Here is the payload structure

Note
We have updated the deposit event payload for all new Zainboxes, and Zainboxes created before 13th February can be easily upgraded to the new version,
which has the following Deposit event payload. If you would like to upgrade, please contact our support channels, and we will be more than happy to assist you.

The updated version emphasizes the availability of the new deposit event payload and the ease with which users can upgrade to it.

Deposit Event

      

{
  "data": {
    "depositedAmount": "100000",
    "txnChargesAmount": "6400",
    "amountAfterCharges": "93600",
    "bankName": "ZainMFB",
    "beneficiaryAccountName": "idris",
    "beneficiaryAccountNumber": "7964524199",
    "narration": "gift",
    "paymentDate": "2021-12-28T11:48:35.044886444",
    "paymentRef": "a1oA0ws127quism",
    "sender": "900989098",
    "senderName": "hassan ",
    "txnDate": "2021-12-28T11:48:35.044777507",
    "txnRef": "730003356",
    "txnType": "deposit",
    "zainboxCode": "xmaldoaYnakaAAVOAE",
    "callBackUrl": "http://gofundme.ng/webhook",
    "emailNotification": "user@user.com",
    "zainboxName": "users",
    
  },
  "event": "deposit.success"
}                 
           
      

       Application Status Codes
Status Code	Description	Category	Status Type
00	Successful	General	Status
20	Invalid source Account Number or ZainboxCode	Funds Transfer	Error
21	Successful Queued Transaction	Funds Transfer	Status
22	Payload validation Error	General	Error
23	Insufficient wallet balance	Funds Transfer	Error
24	Invalid Destination account number	Funds Transfer	Error
25	This account have no wallet balance	Funds Transfer	Error
26	Duplicate transaction ref number	Funds Transfer	Error
27	Fundss transfer Application Error	Funds Transfer	Error
28	Inactive virtual account	Funds Transfer	Status
29	Application Failure	General	Error
30	Billing Estimation Error during fund transfer	Funds Transfer	Error
31			
32			
33	
