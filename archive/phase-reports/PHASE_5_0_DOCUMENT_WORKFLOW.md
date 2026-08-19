# PHASE 5.0 DOCUMENT WORKFLOW

**Date:** 2026-08-14
**Phase:** 5.0
**Status:** PENDING

---

## WORKFLOW OVERVIEW

```
========================================
DOCUMENT WORKFLOW
========================================

1. Request:              REQUESTED
2. Verification:        VERIFIED
3. Processing:          PROCESSING
4. Generation:          GENERATED
5. Signing:             SIGNED
6. Completion:          COMPLETED
7. Verification:        PUBLIC VERIFICATION

Status: PENDING
========================================
```

---

## END-TO-END FLOW

```
Warga                    Admin                    System
  |                         |                        |
  |-- Submit Request ------>|                        |
  |                         |-- Verify ------------->|
  |                         |                        |
  |                         |-- Process ------------>|
  |                         |                        |
  |                         |-- Generate Document -->|
  |                         |                        |
  |                         |-- Sign Document ------>|
  |                         |                        |
  |<-- Receive Number -----|                        |
  |                         |                        |
  |-- Track Status --------|                        |
  |<-- Status Update ------|                        |
  |                         |                        |
  |-- Download Document --------------------------->|
  |                         |                        |
  |-- Verify Document --------------------------->|
  |<-- Document Info -----|                        |
  |                         |                        |
```

---

## STEP 1: REQUEST (REQUESTED)

### Admin Actions

| ID | Action | Description |
|----|--------|-------------|
| REQ-01 | View new requests | List of pending requests |
| REQ-02 | View request detail | Full request information |
| REQ-03 | Check documents | Required documents submitted |
| REQ-04 | Verify data | Verify submitted data |
| REQ-05 | Request additional info | Ask for more documents |

### System Actions

| ID | Action | Description |
|----|--------|-------------|
| SYS-01 | Generate request number | Format: KSL/[YYYY]/[MM]/[SEQ] |
| SYS-02 | Store request data | Persist to database |
| SYS-03 | Send confirmation | Email/WhatsApp to warga |
| SYS-04 | Track timestamp | Log request time |

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| REQ-SYS-01 | Request number generated | Correct format | [ ] |
| REQ-SYS-02 | Request stored | Data persisted | [ ] |
| REQ-SYS-03 | Confirmation sent | Notification sent | [ ] |
| REQ-SYS-04 | Request searchable | Search works | [ ] |

### Notes
```
-
```

---

## STEP 2: VERIFICATION (VERIFIED)

### Admin Actions

| ID | Action | Description |
|----|--------|-------------|
| VER-01 | Verify request | Mark as verified |
| VER-02 | Verify documents | Check submitted files |
| VER-03 | Verify citizen data | NIK, name, address |
| VER-04 | Reject request | Mark as rejected |
| VER-05 | Add verification notes | Internal notes |

### System Actions

| ID | Action | Description |
|----|--------|-------------|
| SYS-05 | Update status | Change to VERIFIED |
| SYS-06 | Log verification | Audit log entry |
| SYS-07 | Update timestamps | Verified at |

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| VER-SYS-01 | Status updated | VERIFIED status | [ ] |
| VER-SYS-02 | Audit logged | Entry created | [ ] |
| VER-SYS-03 | Notification sent | Warga notified | [ ] |

### Notes
```
-
```

---

## STEP 3: PROCESSING (PROCESSING)

### Admin Actions

| ID | Action | Description |
|----|--------|-------------|
| PROC-01 | Select template | Choose template |
| PROC-02 | Review data | Check citizen data |
| PROC-03 | Edit data | Make corrections |
| PROC-04 | Preview document | Preview before generate |
| PROC-05 | Add notes | Internal notes |

### System Actions

| ID | Action | Description |
|----|--------|-------------|
| SYS-08 | Update status | Change to PROCESSING |
| SYS-09 | Load template | Load template configuration |
| SYS-10 | Resolve bindings | Resolve all data bindings |

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PROC-SYS-01 | Status updated | PROCESSING status | [ ] |
| PROC-SYS-02 | Template loaded | Template data loaded | [ ] |
| PROC-SYS-03 | Bindings resolved | All bindings resolved | [ ] |

### Notes
```
-
```

---

## STEP 4: GENERATION (GENERATED)

### System Actions

| ID | Action | Description |
|----|--------|-------------|
| SYS-11 | Generate document number | Get next number |
| SYS-12 | Render PDF | Generate PDF file |
| SYS-13 | Apply styling | Apply CSS/paper settings |
| SYS-14 | Apply kop | Add header |
| SYS-15 | Apply content | Render text/bindings |
| SYS-16 | Apply table | Render table data |
| SYS-17 | Apply signature | Add signature area |
| SYS-18 | Apply page breaks | Handle pagination |
| SYS-19 | Store document | Save to storage |
| SYS-20 | Update status | Change to GENERATED |

### Document Number Format

```
Format: [KodeLayanan]/[KodeDesa]/[BulanRomawi]/[Tahun]/[Sequence]
Example: SKD/3271052001/VIII/2026/0001

Components:
- SKD: Service code
- 3271052001: Village code
- VIII: Month in Roman numerals
- 2026: Year
- 0001: Sequence (4 digits, zero-padded)
```

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| GEN-SYS-01 | Number generated | Correct format | [ ] |
| GEN-SYS-02 | PDF rendered | Valid PDF | [ ] |
| GEN-SYS-03 | Document stored | File saved | [ ] |
| GEN-SYS-04 | Status updated | GENERATED status | [ ] |
| GEN-SYS-05 | Unique number | No duplicates | [ ] |

### Race Condition Test

| ID | Scenario | Expected |
|----|----------|----------|
| RACE-01 | 10 concurrent requests | All unique numbers |
| RACE-02 | 100 concurrent requests | All unique numbers |

### Notes
```
-
```

---

## STEP 5: SIGNING (SIGNED)

### Admin Actions

| ID | Action | Description |
|----|--------|-------------|
| SIGN-01 | View document | Preview before sign |
| SIGN-02 | Select signatory | Choose signer |
| SIGN-03 | Apply digital signature | Sign the document |
| SIGN-04 | Reject signing | Return for correction |
| SIGN-05 | Add stamp | Add digital stamp |

### System Actions

| ID | Action | Description |
|----|--------|-------------|
| SYS-21 | Load signatory | Load signatory data |
| SYS-22 | Generate signature | Create digital signature |
| SYS-23 | Embed signature | Add to PDF |
| SYS-24 | Record signature | Store signature record |
| SYS-25 | Update status | Change to SIGNED |
| SYS-26 | Generate verification token | Create verification URL |

### Signature Record

```json
{
  "documentId": "doc_xxx",
  "signatoryId": "penanda_tangan_id",
  "signedAt": "2026-08-14T10:00:00Z",
  "signatureHash": "sha256:xxx",
  "verificationToken": "abc123",
  "ipAddress": "192.168.1.1"
}
```

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| SIGN-SYS-01 | Signature applied | Signature visible | [ ] |
| SIGN-SYS-02 | Signature recorded | Record created | [ ] |
| SIGN-SYS-03 | Token generated | Token created | [ ] |
| SIGN-SYS-04 | Status updated | SIGNED status | [ ] |
| SIGN-SYS-05 | Unauthorized sign | Error shown | [ ] |

### Security Test

| ID | Scenario | Expected |
|----|----------|----------|
| SEC-01 | Sign without permission | Error: Unauthorized |
| SEC-02 | Sign wrong document | Error: Mismatch |
| SEC-03 | Tamper after sign | Signature invalid |
| SEC-04 | Expired session sign | Error: Session expired |

### Notes
```
-
```

---

## STEP 6: COMPLETION (COMPLETED)

### Admin Actions

| ID | Action | Description |
|----|--------|-------------|
| COMP-01 | Review final document | Final check |
| COMP-02 | Mark complete | Complete the request |
| COMP-03 | Send notification | Notify warga |
| COMP-04 | Export to archive | Archive document |

### System Actions

| ID | Action | Description |
|----|--------|-------------|
| SYS-27 | Update status | Change to COMPLETED |
| SYS-28 | Send notification | Email/WhatsApp |
| SYS-29 | Log completion | Audit log entry |

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| COMP-SYS-01 | Status updated | COMPLETED status | [ ] |
| COMP-SYS-02 | Notification sent | Warga notified | [ ] |
| COMP-SYS-03 | Audit logged | Entry created | [ ] |

### Notes
```
-
```

---

## STEP 7: PUBLIC VERIFICATION

### Warga/Citizen Actions

| ID | Action | Description |
|----|--------|-------------|
| PUB-01 | Access verification URL | Open verification page |
| PUB-02 | Enter token | Input verification code |
| PUB-03 | View document | View document info |
| PUB-04 | Verify signature | Check signature status |
| PUB-05 | Download document | Download PDF |

### System Actions

| ID | Action | Description |
|----|--------|-------------|
| SYS-30 | Validate token | Check token validity |
| SYS-31 | Load document | Load document data |
| SYS-32 | Check signature | Verify signature |
| SYS-33 | Return document info | Display results |

### Verification Response

```json
{
  "documentNumber": "SKD/3271052001/VIII/2026/0001",
  "documentType": "Surat Keterangan Domisili",
  "issuedAt": "2026-08-14T10:00:00Z",
  "villageName": "Desa Mitradesa",
  "recipientName": "John Doe",
  "signatureStatus": "VALID",
  "signatureInfo": {
    "signatory": "Budi Santoso",
    "signedAt": "2026-08-14T10:05:00Z"
  },
  "verificationTimestamp": "2026-08-14T12:00:00Z"
}
```

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PUB-SYS-01 | Valid token | Document info shown | [ ] |
| PUB-SYS-02 | Invalid token | Error message | [ ] |
| PUB-SYS-03 | Expired token | Error message | [ ] |
| PUB-SYS-04 | Signed document | Signature VALID | [ ] |
| PUB-SYS-05 | Unsigned document | Signature INVALID | [ ] |
| PUB-SYS-06 | Modified document | Verification fails | [ ] |
| PUB-SYS-07 | Download PDF | Download starts | [ ] |

### Security Test - PII Leakage

| ID | Check | Expected |
|----|-------|----------|
| PII-01 | No NIK in response | Not exposed |
| PII-02 | No address in response | Not exposed |
| PII-03 | No phone in response | Not exposed |
| PII-04 | Only public info shown | Minimal data |

### Notes
```
-
```

---

## AUDIT LOG REQUIREMENTS

### Events to Log

| Event | Data |
|-------|------|
| Request Created | request_id, warga_nik, service_type, timestamp |
| Request Verified | request_id, admin_id, timestamp |
| Request Rejected | request_id, admin_id, reason, timestamp |
| Document Generated | document_id, request_id, number, timestamp |
| Document Signed | document_id, signatory_id, signature_hash, timestamp |
| Document Completed | document_id, timestamp |
| Verification | document_id, token, timestamp, result |

### Log Format

```json
{
  "event": "DOCUMENT_SIGNED",
  "documentId": "doc_xxx",
  "signatoryId": "xxx",
  "signatureHash": "sha256:xxx",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-08-14T10:05:00Z"
}
```

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| LOG-01 | Log created on action | Entry exists | [ ] |
| LOG-02 | Log contains required fields | All fields present | [ ] |
| LOG-03 | Log immutable | Cannot be modified | [ ] |
| LOG-04 | Log queryable | Search works | [ ] |

### Notes
```
-
```

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Admin Tester | | | |
| QA Reviewer | | | |
| Product Owner | | | |

---

*End of Document Workflow*
