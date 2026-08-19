# PHASE 5.0 CITIZEN UAT CHECKLIST

**Date:** 2026-08-14
**Phase:** 5.0
**Status:** PENDING

---

## UAT SUMMARY

```
========================================
CITIZEN UAT CHECKLIST
========================================

Website Access:             [ ]
Homepage:                   [ ]
Berita List:                [ ]
Berita Detail:              [ ]
Profil/Halaman Statis:      [ ]
Pemerintahan:               [ ]
Layanan List:               [ ]
Layanan Form:               [ ]
Submit Request:             [ ]
Request Tracking:            [ ]
Verification Page:           [ ]
Mobile Responsive:           [ ]

Status: PENDING
========================================
```

---

## 1. WEBSITE ACCESS

### Pre-conditions
- [ ] Browser: Chrome/Firefox/Safari
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Access to staging/public URL

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| WEB-01 | Open public website | Homepage displayed | [ ] |
| WEB-02 | Check page title | Title correct | [ ] |
| WEB-03 | Check meta description | Meta tags correct | [ ] |
| WEB-04 | Check sitemap | Sitemap accessible | [ ] |
| WEB-05 | Check robots.txt | Robots.txt correct | [ ] |

### Notes
```
-
```

---

## 2. HOMEPAGE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| HOME-01 | View homepage | Homepage loads | [ ] |
| HOME-02 | View header | Header with logo/nav | [ ] |
| HOME-03 | View hero section | Hero displayed | [ ] |
| HOME-04 | View latest berita | Latest news shown | [ ] |
| HOME-05 | View footer | Footer with info | [ ] |
| HOME-06 | Check village identity | Name/contact shown | [ ] |

### Notes
```
-
```

---

## 3. BERITA LIST

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| NEWS-01 | View berita list | List displayed | [ ] |
| NEWS-02 | View berita pagination | Pagination works | [ ] |
| NEWS-03 | View berita categories | Categories shown | [ ] |
| NEWS-04 | Filter by category | Filter works | [ ] |
| NEWS-05 | Search berita | Search works | [ ] |
| NEWS-06 | View berita thumbnail | Image displayed | [ ] |
| NEWS-07 | Click berita | Navigate to detail | [ ] |

### Notes
```
-
```

---

## 4. BERITA DETAIL

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| DETAIL-01 | View berita detail | Detail page loads | [ ] |
| DETAIL-02 | View berita title | Title displayed | [ ] |
| DETAIL-03 | View berita content | Content displayed | [ ] |
| DETAIL-04 | View berita date | Date shown | [ ] |
| DETAIL-05 | View berita author | Author shown | [ ] |
| DETAIL-06 | View related berita | Related shown | [ ] |
| DETAIL-07 | Share berita | Share options work | [ ] |
| DETAIL-08 | Back to list | Navigation works | [ ] |

### Notes
```
-
```

---

## 5. PROFIL/HALAMAN STATIS

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PAGE-01 | View profil desa | Page loads | [ ] |
| PAGE-02 | View visi misi | Content displayed | [ ] |
| PAGE-03 | View struktur organisasi | Structure shown | [ ] |
| PAGE-04 | View contact page | Contact info shown | [ ] |
| PAGE-05 | Navigation between pages | Navigation works | [ ] |

### Notes
```
-
```

---

## 6. PEMERINTAHAN

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| GOV-01 | View perangkat desa list | List displayed | [ ] |
| GOV-02 | View perangkat detail | Detail shown | [ ] |
| GOV-03 | View organisasi chart | Chart displayed | [ ] |
| GOV-04 | Search perangkat | Search works | [ ] |

### Notes
```
-
```

---

## 7. LAYANAN LIST

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| SVC-01 | View layanan list | List displayed | [ ] |
| SVC-02 | View layanan cards | Cards with info | [ ] |
| SVC-03 | View layanan detail | Detail page loads | [ ] |
| SVC-04 | View requirements | Requirements shown | [ ] |
| SVC-05 | Click ajukan layanan | Form page opens | [ ] |

### Notes
```
-
```

---

## 8. LAYANAN FORM

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| FORM-01 | View service form | Form loads | [ ] |
| FORM-02 | Fill required fields | Fields accept input | [ ] |
| FORM-03 | Submit with empty required | Validation error | [ ] |
| FORM-04 | Submit valid form | Success message | [ ] |
| FORM-05 | Receive request number | Number displayed | [ ] |
| FORM-06 | Form field validation | Validation works | [ ] |
| FORM-07 | Clear form | Form cleared | [ ] |
| FORM-08 | Upload attachment | Attachment uploaded | [ ] |

### Test Validation Scenarios

| Scenario | Input | Expected |
|----------|-------|----------|
| Empty required field | - | Error shown |
| Invalid NIK format | 12345 | Error shown |
| Input too long | 1000 chars | Truncated/Error |
| Special characters | <script> | Escaped/Sanitized |

### Notes
```
-
```

---

## 9. REQUEST TRACKING

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| TRACK-01 | View tracking page | Page loads | [ ] |
| TRACK-02 | Enter valid request number | Request found | [ ] |
| TRACK-03 | Enter invalid number | Not found message | [ ] |
| TRACK-04 | View request status | Status displayed | [ ] |
| TRACK-05 | View request history | History shown | [ ] |
| TRACK-06 | Download document | Download starts | [ ] |

### Notes
```
-
```

---

## 10. VERIFICATION PAGE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| VER-01 | Access verification URL | Page loads | [ ] |
| VER-02 | Enter valid token | Document displayed | [ ] |
| VER-03 | View document metadata | Metadata shown | [ ] |
| VER-04 | View signature status | Status displayed | [ ] |
| VER-05 | Download document | Download starts | [ ] |
| VER-06 | Invalid token | Error shown | [ ] |
| VER-07 | Expired token | Error shown | [ ] |

### Notes
```
-
```

---

## 11. MOBILE RESPONSIVE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| MOBILE-01 | Homepage on mobile | Mobile layout | [ ] |
| MOBILE-02 | Navigation menu | Hamburger menu | [ ] |
| MOBILE-03 | Berita list | Mobile grid | [ ] |
| MOBILE-04 | Service form | Mobile form | [ ] |
| MOBILE-05 | Touch gestures | Swipe/scroll works | [ ] |
| MOBILE-06 | Form submission | Works on mobile | [ ] |

### Device Breakpoints

| Device | Width | Expected |
|--------|-------|----------|
| Mobile | < 640px | Single column |
| Tablet | 640-1024px | 2 columns |
| Desktop | > 1024px | Full layout |

### Notes
```
-
```

---

## 12. ACCESSIBILITY

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| A11Y-01 | Keyboard navigation | All elements accessible | [ ] |
| A11Y-02 | Screen reader | Content readable | [ ] |
| A11Y-03 | Focus indicators | Focus visible | [ ] |
| A11Y-04 | Color contrast | WCAG AA compliant | [ ] |
| A11Y-05 | Form labels | Labels present | [ ] |
| A11Y-06 | Alt text | Images have alt | [ ] |

### Notes
```
-
```

---

## 13. PERFORMANCE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PERF-01 | Homepage load time | < 3 seconds | [ ] |
| PERF-02 | API response time | < 1 second | [ ] |
| PERF-03 | Form submission | < 2 seconds | [ ] |
| PERF-04 | Image loading | Lazy load works | [ ] |

### Notes
```
-
```

---

## ISSUE CLASSIFICATION

### P0 - Critical
- Cannot access website
- Cannot submit request
- Data loss
- Security vulnerability

### P1 - Blocking
- Core flow broken
- Major UI broken

### P2 - Important
- UX issues
- Minor bugs

### P3 - Improvement
- Nice-to-have
- Enhancement

---

## CITIZEN FEEDBACK

### Overall Experience
```
Rate: [ ] 1 [ ] 2 [ ] 3 [ ] 4 [ ] 5

Comments:
-
```

### Ease of Use
```
Rate: [ ] 1 [ ] 2 [ ] 3 [ ] 4 [ ] 5

Comments:
-
```

### Suggestions for Improvement
```
-
```

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Citizen Tester | | | |
| QA Reviewer | | | |
| Product Owner | | | |

---

*End of Citizen UAT Checklist*
