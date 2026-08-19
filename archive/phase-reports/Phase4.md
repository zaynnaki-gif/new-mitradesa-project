START STEP 4.

System Audit:
PASS.

Proceed with implementation.

Implement only:

1. Keluarga domain
2. AnggotaKeluarga domain
3. Service layer
4. DTO + validation
5. API routes
6. Authentication integration
7. RBAC integration
8. PII protection
9. Soft delete
10. Transaction integrity
11. Audit logging
12. Integrity tests
13. Rollback tests
14. Regression tests
15. Documentation

Do NOT redesign the existing schema unless a concrete
implementation blocker is discovered.

Do NOT create duplicate models.

Do NOT use NIK as FK.

Do NOT use nomorKK as PK.

Do NOT hardcode master data.

Do NOT bypass RBAC.

Do NOT expose unmasked PII through unauthorized endpoints.

Do NOT expand scope into PerangkatDesa or other domains.

After implementation:

- run unit/API tests
- run transaction/rollback tests
- run Phase 2 regression
- run Phase 3A regression
- run Phase 3B Step 3 regression
- run TypeScript/build validation
- verify Prisma schema
- verify API routes
- verify RBAC
- verify audit
- verify PII protection
- verify ERD consistency

Then create:

docs/development/PHASE-3B-STEP-4-KELUARGA.md

Use the mandatory validation format from the Execution Contract.

IMPORTANT:

Do NOT proceed to STEP 5.

STOP after STEP 4 validation.

Return the final validation report with:

STATUS:
PASS / BLOCKED

and list:

- files created
- files modified
- migrations
- API endpoints
- tests
- regression results
- security findings
- architecture conflicts
- business-rule conflicts
- remaining issues

START IMPLEMENTATION NOW.
