# VTpay Payout & Settlement System Design

## Overview
A production-grade system for handling automated payouts and settlements with a 24-hour clearing rule for deposits.

## Core Principles
1.  **Balance Isolation**: Separate `balance`, `clearedBalance`, and `lockedBalance`.
2.  **Idempotency**: Every transaction and payout has a unique reference.
3.  **Defensive Processing**: Webhooks are advisory; reconciliation is the source of truth.
4.  **Auditability**: Every fund movement is backed by a ledger entry (Transaction).
5.  **Bounded Retries**: Automated reconciliation stops after N attempts and flags for manual review.

## Database Schema Updates

### Wallet
- `balance`: Total funds in kobo.
- `clearedBalance`: Funds available for withdrawal (settled).
- `lockedBalance`: Funds currently in a payout process.

### Transaction (Ledger)
- `isCleared`: Boolean (false for new deposits).
- `clearedAt`: Timestamp of settlement.
- `status`: `pending` | `success` | `failed`.

### Payout
- `status`: `INITIATED` | `PROCESSING` | `COMPLETED` | `FAILED` | `MANUAL_REVIEW`.
- `retryCount`: Number of reconciliation attempts.
- `lastReconciledAt`: Last time the status was checked with the provider.

### JobLock
- `jobName`: Unique name of the background job.
- `isLocked`: Boolean to prevent parallel execution.

## The Payout Flow

1.  **Initiate**:
    - Check `clearedBalance >= amount`.
    - Move amount from `clearedBalance` to `lockedBalance`.
    - Create `Payout` record (status: `INITIATED`).
    - Create `Transaction` record (status: `pending`).
2.  **Process**:
    - Call Zainpay `fundTransfer` API.
    - Update `Payout` to `PROCESSING`.
3.  **Finalize (Webhook or Reconciliation)**:
    - **Success**:
        - Verify amount matches.
        - Reduce `lockedBalance` and `balance`.
        - Update `Payout` to `COMPLETED`.
        - Update `Transaction` to `success`.
    - **Failure**:
        - Move amount from `lockedBalance` back to `clearedBalance`.
        - Update `Payout` to `FAILED`.
        - Update `Transaction` to `failed`.

## Background Jobs

### 1. Settlement Job (`settlement-job.ts`)
- Runs periodically.
- Finds successful deposits older than 24 hours where `isCleared` is false.
- Moves funds to `clearedBalance` and sets `isCleared: true`.
- Uses `JobLock` to prevent overlapping runs.

### 2. Reconciliation Job (`reconciliation-job.ts`)
- Runs periodically.
- Finds `PROCESSING` payouts where `retryCount < 5`.
- Polls Zainpay for status.
- Finalizes if status is terminal.
- Increments `retryCount`.
- Moves to `MANUAL_REVIEW` if max retries reached.

## Security & Risk Mitigation
- **Signature Verification**: All incoming webhooks must have a valid HMAC signature.
- **Amount Validation**: Payout success is only processed if the provider's reported amount matches our record.
- **Status Guarding**: Payouts cannot move from terminal states (`COMPLETED`/`FAILED`) to any other state.
- **Locking**: `JobLock` ensures that long-running jobs don't collide.
