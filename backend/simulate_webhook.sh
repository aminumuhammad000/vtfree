#!/bin/bash

# 1. Save payload to a file without trailing newline to be safe
printf '%s' '{
  "event": "transaction.deposit",
  "data": {
    "reference": "TXN-f23ea3af-e004-4ac1-90fc-bc655838c90e",
    "amount": 1000,
    "currency": "NGN",
    "status": "success",
    "customer": {
      "name": "AMEINU MUHAMMAD",
      "accountNumber": "8100015498"
    },
    "timestamp": "2026-04-04T12:36:04.722Z"
  }
}' > payload.json

# 2. Compute signature
SIGNATURE=$(openssl dgst -sha256 -hmac "sk_live_REMOVED" -binary payload.json | xxd -p -c 256)

# 3. Send webhook using --data-binary so curl doesn't alter the payload bytes
curl -X POST http://localhost:5000/api/v1/webhooks/dadsub/vtstack \
-H "Content-Type: application/json" \
-H "x-vtstack-secret: sk_live_REMOVED" \
-H "x-vtstack-signature: $SIGNATURE" \
--data-binary @payload.json -v
