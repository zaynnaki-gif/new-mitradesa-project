# PHASE 5.0 ADMIN UAT CHECKLIST

**Date:** 2026-08-14
**Phase:** 5.0
**Status:** PENDING

---

## UAT SUMMARY

```
========================================
ADMIN UAT CHECKLIST
========================================

Login:                    [ ]
Dashboard:                [ ]
Identitas Desa:           [ ]
Pemerintahan:             [ ]
CMS - Kategori:           [ ]
CMS - Berita:             [ ]
CMS - Media:              [ ]
CMS - Halaman:            [ ]
Layanan:                  [ ]
Template Surat:           [ ]
Permintaan:               [ ]
Dokumen:                  [ ]
Signature:                [ ]
Verification:             [ ]

Status: PENDING
========================================
```

---

## 1. LOGIN WORKFLOW

### Pre-conditions
- [ ] Browser: Chrome/Firefox/Safari
- [ ] Access to staging URL
- [ ] Valid admin credentials

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| LOGIN-01 | Open staging URL | Login page displayed | [ ] |
| LOGIN-02 | Enter valid username/password | Redirect to dashboard | [ ] |
| LOGIN-03 | Enter invalid password | Error message displayed | [ ] |
| LOGIN-04 | Enter non-existent username | Error message displayed | [ ] |
| LOGIN-05 | Empty username field | Validation error | [ ] |
| LOGIN-06 | Empty password field | Validation error | [ ] |
| LOGIN-07 | Click "Lupa Password" | Password reset page | [ ] |
| LOGIN-08 | Session timeout | Redirect to login | [ ] |

### Notes
```
-
```

---

## 2. DASHBOARD

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| DASH-01 | View dashboard after login | Dashboard loads correctly | [ ] |
| DASH-02 | View statistics cards | All cards show data | [ ] |
| DASH-03 | View recent activities | Activity list displayed | [ ] |
| DASH-04 | View quick actions | Action buttons work | [ ] |
| DASH-05 | Navigate to different sections | Navigation works | [ ] |
| DASH-06 | Refresh dashboard | Data updates | [ ] |

### Notes
```
-
```

---

## 3. IDENTITAS DESA

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| IDENT-01 | View village identity | Current data displayed | [ ] |
| IDENT-02 | Edit village name | Name updates | [ ] |
| IDENT-03 | Edit village address | Address updates | [ ] |
| IDENT-04 | Edit contact information | Contact updates | [ ] |
| IDENT-05 | Upload village logo | Logo uploaded | [ ] |
| IDENT-06 | Edit kepala desa name | Name updates | [ ] |
| IDENT-07 | Save with empty required field | Validation error | [ ] |
| IDENT-08 | Cancel edit | Changes discarded | [ ] |

### Notes
```
-
```

---

## 4. PEMERINTAHAN (GOVERNMENT)

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| GOV-01 | View perangkat desa list | List displayed | [ ] |
| GOV-02 | Add new perangkat | Device added | [ ] |
| GOV-03 | Edit perangkat | Device updated | [ ] |
| GOV-04 | Delete perangkat | Device deleted | [ ] |
| GOV-05 | View perangkat detail | Detail displayed | [ ] |
| GOV-06 | Change perangkat status | Status changes | [ ] |
| GOV-07 | Add perangkat with duplicate NIK | Validation error | [ ] |
| GOV-08 | Filter by jabatan | Filter works | [ ] |

### Notes
```
-
```

---

## 5. CMS - KATEGORI

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| KAT-01 | View kategori list | List displayed | [ ] |
| KAT-02 | Add new kategori | Kategori added | [ ] |
| KAT-03 | Edit kategori | Kategori updated | [ ] |
| KAT-04 | Delete kategori | Kategori deleted | [ ] |
| KAT-05 | Delete kategori with berita | Warning shown | [ ] |
| KAT-06 | Reorder kategori | Order saved | [ ] |
| KAT-07 | Add duplicate kategori name | Validation error | [ ] |

### Notes
```
-
```

---

## 6. CMS - BERITA

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| NEWS-01 | View berita list | List displayed | [ ] |
| NEWS-02 | Add new berita | Berita created | [ ] |
| NEWS-03 | Edit berita | Berita updated | [ ] |
| NEWS-04 | Delete berita | Berita deleted | [ ] |
| NEWS-05 | Publish berita | Status changes | [ ] |
| NEWS-06 | Archive berita | Status changes | [ ] |
| NEWS-07 | Add berita with empty fields | Validation error | [ ] |
| NEWS-08 | Upload image to berita | Image uploaded | [ ] |
| NEWS-09 | Preview berita | Preview displayed | [ ] |
| NEWS-10 | Set berita as draft | Status changes | [ ] |

### Notes
```
-
```

---

## 7. CMS - MEDIA

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| MEDIA-01 | View media library | Grid displayed | [ ] |
| MEDIA-02 | Upload image | Image uploaded | [ ] |
| MEDIA-03 | Upload PDF | PDF uploaded | [ ] |
| MEDIA-04 | Delete media | Media deleted | [ ] |
| MEDIA-05 | Search media | Search works | [ ] |
| MEDIA-06 | Filter by type | Filter works | [ ] |
| MEDIA-07 | Upload oversized file | Error shown | [ ] |
| MEDIA-08 | Copy media URL | URL copied | [ ] |

### Notes
```
-
```

---

## 8. CMS - HALAMAN

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PAGE-01 | View halaman list | List displayed | [ ] |
| PAGE-02 | Add new halaman | Halaman created | [ ] |
| PAGE-03 | Edit halaman | Halaman updated | [ ] |
| PAGE-04 | Delete halaman | Halaman deleted | [ ] |
| PAGE-05 | Publish halaman | Status changes | [ ] |
| PAGE-06 | Unpublish halaman | Status changes | [ ] |
| PAGE-07 | Reorder halaman menu | Order saved | [ ] |

### Notes
```
-
```

---

## 9. LAYANAN

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| LAYANAN-01 | View layanan list | List displayed | [ ] |
| LAYANAN-02 | Add new layanan | Layanan created | [ ] |
| LAYANAN-03 | Edit layanan | Layanan updated | [ ] |
| LAYANAN-04 | Delete layanan | Layanan deleted | [ ] |
| LAYANAN-05 | Configure form fields | Fields configured | [ ] |
| LAYANAN-06 | Toggle layanan active | Status changes | [ ] |

### Notes
```
-
```

---

## 10. TEMPLATE SURAT

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| TEMP-01 | View template list | List displayed | [ ] |
| TEMP-02 | Create new template | Template created | [ ] |
| TEMP-03 | Configure paper size | Size configured | [ ] |
| TEMP-04 | Configure margins | Margins configured | [ ] |
| TEMP-05 | Add kop surat | Kop added | [ ] |
| TEMP-06 | Add text block | Text added | [ ] |
| TEMP-07 | Add field binding | Field bound | [ ] |
| TEMP-08 | Add conditional section | Condition added | [ ] |
| TEMP-09 | Add table/repeater | Table added | [ ] |
| TEMP-10 | Add signature block | Signature added | [ ] |
| TEMP-11 | Preview template | Preview displayed | [ ] |
| TEMP-12 | Publish template | Status changes | [ ] |
| TEMP-13 | Edit published template | Edit allowed | [ ] |

### Notes
```
-
```

---

## 11. PERMINTAAN LAYANAN

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| REQ-01 | View permintaan list | List displayed | [ ] |
| REQ-02 | View permintaan detail | Detail displayed | [ ] |
| REQ-03 | Verify permintaan | Status changes to VERIFIED | [ ] |
| REQ-04 | Process permintaan | Status changes to PROCESSING | [ ] |
| REQ-05 | Generate document | Document created | [ ] |
| REQ-06 | Reject permintaan | Status changes to REJECTED | [ ] |
| REQ-07 | Filter by status | Filter works | [ ] |
| REQ-08 | Search by request number | Search works | [ ] |
| REQ-09 | Export to CSV | Export works | [ ] |

### Notes
```
-
```

---

## 12. DOKUMEN

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| DOC-01 | View dokumen list | List displayed | [ ] |
| DOC-02 | View dokumen detail | Detail displayed | [ ] |
| DOC-03 | Download dokumen | Download starts | [ ] |
| DOC-04 | Preview PDF | PDF preview | [ ] |
| DOC-05 | View document number | Number displayed | [ ] |
| DOC-06 | View verification status | Status displayed | [ ] |

### Notes
```
-
```

---

## 13. SIGNATURE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| SIGN-01 | View penanda tangan list | List displayed | [ ] |
| SIGN-02 | Add penanda tangan | Signatory added | [ ] |
| SIGN-03 | Edit penanda tangan | Signatory updated | [ ] |
| SIGN-04 | Delete penanda tangan | Signatory deleted | [ ] |
| SIGN-05 | Sign document | Document signed | [ ] |
| SIGN-06 | View signature status | Status displayed | [ ] |
| SIGN-07 | Sign without authorization | Error shown | [ ] |

### Notes
```
-
```

---

## 14. VERIFICATION

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| VER-01 | Access verification URL | Verification page | [ ] |
| VER-02 | Enter valid token | Document displayed | [ ] |
| VER-03 | Enter invalid token | Error message | [ ] |
| VER-04 | Enter expired token | Error message | [ ] |
| VER-05 | View signed document | Signed document shown | [ ] |
| VER-06 | View unsigned document | Unsigned document shown | [ ] |
| VER-07 | Copy verification link | Link copied | [ ] |

### Notes
```
-
```

---

## ISSUE CLASSIFICATION

When issues are found, classify them:

### P0 - Critical
- Data loss
- Security breach
- Broken tenant isolation
- Impossible document integrity

### P1 - Blocking
- Core workflow cannot be used
- Major functionality broken

### P2 - Important
- UX problem
- Feature limitation

### P3 - Improvement
- Nice-to-have
- Enhancement

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Admin Tester | | | |
| QA Reviewer | | | |
| Product Owner | | | |

---

*End of Admin UAT Checklist*
