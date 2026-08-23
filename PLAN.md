# Plan: Single Source of Truth - Wilayah System

## Context

Saat ini, sistem menyimpan data wilayah (RT, RW, Gubug/Dusun) sebagai teks bebas di beberapa tabel, menyebabkan:
- Duplikasi data
- Tidak ada referential integrity
- Sulit pencarian/filter berdasarkan wilayah
- Tidak konsisten antar tabel

Tujuan: Semua tabel yang butuh data wilayah menggunakan FK ke tabel wilayah terpusat.

## Current State

```
PROVINSI → KABUPATEN → KECAMATAN → DESA → GUBUG → RW → RT
                ✅ FK Relations (sudah ada)
```

**Masalah:**
| Tabel | Field | Status |
|-------|-------|--------|
| Penduduk | rt, rw, dusun | ❌ Text |
| Keluarga | rt, rw, dusun | ❌ Text |
| Bumil | rt, rw, dusun | ❌ Text |
| MutasiPenduduk | semua alamat | ❌ Text |

## Implementation Plan

### Phase 1: Database Schema Changes

#### 1.1 Add FK Fields to Models

**File: `apps/api/prisma/schema.prisma`**

Add to `Penduduk` model (after line 398):
```prisma
gubugId  BigInt?  @map("gubug_id")
rwId     BigInt?  @map("rw_id")
rtId     BigInt?  @map("rt_id")

gubug    Gubug?   @relation(fields: [gubugId], references: [id])
rw       Rw?      @relation(fields: [rwId], references: [id])
rt       Rt?      @relation(fields: [rtId], references: [id])
```

Add to `Keluarga` model (after line 422):
```prisma
gubugId  BigInt?  @map("gubug_id")
rwId     BigInt?  @map("rw_id")
rtId     BigInt?  @map("rt_id")

gubug    Gubug?   @relation(fields: [gubugId], references: [id])
rw       Rw?      @relation(fields: [rwId], references: [id])
rt       Rt?      @relation(fields: [rtId], references: [id])
```

Add to `Bumil` model (after line 1377):
```prisma
gubugId  BigInt?  @map("gubug_id")
rwId     BigInt?  @map("rw_id")
rtId     BigInt?  @map("rt_id")

gubug    Gubug?   @relation(fields: [gubugId], references: [id])
rw       Rw?      @relation(fields: [rwId], references: [id])
rt       Rt?      @relation(fields: [rtId], references: [id])
```

For `MutasiPenduduk`, add dual wilayah structure (asal & tujuan):
```prisma
// Asal wilayah
gubugAsalId  BigInt?  @map("gubug_asal_id")
rwAsalId     BigInt?  @map("rw_asal_id")
rtAsalId     BigInt?  @map("rt_asal_id")
alamatAsal   String?  @map("alamat_asal") @db.VarChar(500)

// Tujuan wilayah
gubugTujuanId  BigInt?  @map("gubug_tujuan_id")
rwTujuanId     BigInt?  @map("rw_tujuan_id")
rtTujuanId     BigInt?  @map("rt_tujuan_id")
alamatTujuan   String?  @map("alamat_tujuan") @db.VarChar(500)

// FK Relations
gubugAsal    Gubug?   @relation("GubugAsal", fields: [gubugAsalId], references: [id])
rwAsal       Rw?      @relation("RwAsal", fields: [rwAsalId], references: [id])
rtAsal       Rt?      @relation("RtAsal", fields: [rtAsalId], references: [id])
gubugTujuan  Gubug?   @relation("GubugTujuan", fields: [gubugTujuanId], references: [id])
rwTujuan     Rw?      @relation("RwTujuan", fields: [rwTujuanId], references: [id])
rtTujuan     Rt?      @relation("RtTujuan", fields: [rtTujuanId], references: [id])
```

#### 1.2 Create Migration
```bash
cd apps/api
npx prisma migrate dev --name add_wilayah_fk_to_tables
```

### Phase 2: Backend Services

#### 2.1 Create Hooks for Gubug/Rw/Rt

**Files to create:**
- `apps/web/src/hooks/useGubug.ts`
- `apps/web/src/hooks/useRw.ts`
- `apps/web/src/hooks/useRt.ts`

```typescript
// useGubug.ts
export function useGubug(desaId?: number) {
  return useQuery<Gubug[]>({
    queryKey: ['wilayah', 'gubug', desaId],
    queryFn: () => fetchGubug(desaId),
    enabled: !!desaId,
  });
}
```

#### 2.2 Update DTOs

**Files to update:**
- `apps/api/src/dto/penduduk.dto.ts`
- `apps/api/src/dto/keluarga.dto.ts`
- `apps/api/src/dto/mutasi.dto.ts` (create new)
- `apps/api/src/dto/bumil.dto.ts`

Add optional FK fields:
```typescript
export const createPendudukSchema = z.object({
  // ... existing fields
  gubugId: z.number().int().positive().optional(),
  rwId: z.number().int().positive().optional(),
  rtId: z.number().int().positive().optional(),
});
```

#### 2.3 Update Services

**Files to update:**
- `apps/api/src/services/penduduk.service.ts`
- `apps/api/src/services/keluarga.service.ts`
- `apps/api/src/services/bumil.service.ts` (create new)
- `apps/api/src/services/mutasi-penduduk.service.ts`

Update `toResponse()` methods to include wilayah details:
```typescript
private toResponse(penduduk: any): PendudukResponse {
  return {
    id: penduduk.id.toString(),
    // ... existing fields
    gubugId: penduduk.gubugId?.toString(),
    rwId: penduduk.rwId?.toString(),
    rtId: penduduk.rtId?.toString(),
    // Include full hierarchy if available
    gubug: penduduk.gubug ? {
      id: penduduk.gubug.id.toString(),
      kode: penduduk.gubug.kode,
      nama: penduduk.gubug.nama,
    } : undefined,
    // ... include rw, rt hierarchy
  };
}
```

### Phase 3: Frontend Components

#### 3.1 Extend WilayahSelector

**File: `apps/web/src/components/WilayahSelector.tsx`**

Add Gubug/RW/RT cascading levels:

```typescript
interface WilayahSelectorProps {
  // Existing props...
  showGubugRwRt?: boolean; // New prop
  selectedGubugId?: number;
  selectedRwId?: number;
  selectedRtId?: number;
  onGubugRwRtChange?: (gubugId?, rwId?, rtId?) => void;
}
```

#### 3.2 Create GubugRwRtSelector (if needed for forms requiring only local wilayah)

**File: `apps/web/src/components/GubugRwRtSelector.tsx`**

Standalone component for selecting Gubug → RW → RT only.

#### 3.3 Update Form Pages

**Files to update:**

1. `apps/web/src/pages/admin/penduduk/PendudukPage.tsx`
   - Replace dusun/rt/rw text inputs with selector
   - Add gubugId, rwId, rtId to form state
   - Update API submission

2. `apps/web/src/pages/admin/master/KeluargaPage.tsx`
   - Same pattern as PendudukPage

3. `apps/web/src/pages/admin/kesehatan/BumilPage.tsx`
   - Replace address section with wilayah selector
   - Add FK fields to API submission

4. `apps/web/src/pages/admin/penduduk/MutasiPage.tsx`
   - Most complex: needs dual selectors (asal & tujuan)
   - Replace text fields with cascading selectors
   - Maintain address detail field

### Phase 4: API Endpoints

#### 4.1 Add Endpoint for Current Village's Wilayah

**File: `apps/api/src/routes/wilayah.ts`**

```typescript
/**
 * @route   GET /api/wilayah/gubug-rw-rt
 * @desc    Get gubug/rw/rt for current instance's desa
 * @access  Public
 */
router.get('/gubug-rw-rt', asyncHandler(async (req, res) => {
  const { desaId } = getInstanceContext();
  if (!desaId) throw ApiError.badRequest('Desa belum dikonfigurasi');

  const tree = await wilayahService.getGubugRwRtByDesa(desaId);
  return response.success(res, tree);
}));
```

#### 4.2 Update Service Method

```typescript
async getGubugRwRtByDesa(desaId: bigint) {
  const gubugs = await this.getGubugAll(desaId);
  // ... fetch related rw, rt
  return { gubug: gubugs, rw: rws, rt: rts };
}
```

### Phase 5: Data Migration

Create SQL migration to populate FK fields based on existing text data:

```sql
-- Example for Penduduk
UPDATE "Penduduk" p
SET
  "gubugId" = g.id,
  "rwId" = r.id,
  "rtId" = rt.id
FROM "Gubug" g
JOIN "Rw" r ON r."gubugId" = g.id
JOIN "Rt" rt ON rt."rwId" = r.id
WHERE p."dusun" = g.nama
  AND p."rw" = r.kode
  AND p."rt" = rt.kode
  AND p."desaId" = g."desaId";
```

**Note:** This may require manual mapping for ambiguous matches.

## Verification

1. TypeScript compilation: `npx tsc --noEmit`
2. Start backend: `npm run dev` in apps/api
3. Start frontend: `npm run dev` in apps/web
4. Test:
   - Create/edit Penduduk → wilayah should use selector
   - Create/edit Keluarga → wilayah should use selector
   - Create/edit Bumil → wilayah should use selector
   - Create/edit Mutasi → both asal & tujuan should use selectors

## Files to Create

1. `apps/web/src/hooks/useGubug.ts`
2. `apps/web/src/hooks/useRw.ts`
3. `apps/web/src/hooks/useRt.ts`
4. `apps/web/src/components/GubugRwRtSelector.tsx`
5. `apps/api/src/services/mutasi-penduduk.service.ts`
6. `apps/api/src/dto/mutasi.dto.ts`

## Files to Modify

1. `apps/api/prisma/schema.prisma` (add FK fields)
2. `apps/api/src/dto/penduduk.dto.ts`
3. `apps/api/src/dto/keluarga.dto.ts`
4. `apps/api/src/dto/bumil.dto.ts`
5. `apps/api/src/services/penduduk.service.ts`
6. `apps/api/src/services/keluarga.service.ts`
7. `apps/api/src/routes/penduduk/mutasi.ts`
8. `apps/api/src/routes/kesehatan/bumil.ts`
9. `apps/api/src/routes/wilayah.ts`
10. `apps/web/src/components/WilayahSelector.tsx`
11. `apps/web/src/hooks/index.ts`
12. `apps/web/src/pages/admin/penduduk/PendudukPage.tsx`
13. `apps/web/src/pages/admin/master/KeluargaPage.tsx`
14. `apps/web/src/pages/admin/kesehatan/BumilPage.tsx`
15. `apps/web/src/pages/admin/penduduk/MutasiPage.tsx`

## Effort Estimate

- Database schema changes: ~30 minutes
- Backend services/DTOs: ~2 hours
- Frontend components/hooks: ~3 hours
- Form page updates: ~4 hours
- Testing & fixes: ~2 hours

**Total: ~11-12 hours**

## Risk Assessment

- **Data Loss**: Low - we're adding new FK fields, not removing text fields
- **Breaking Changes**: Medium - existing API responses will include new fields
- **Migration Complexity**: High - populating FKs from text requires careful mapping
- **Frontend Changes**: Medium - multiple form pages need updates

## Mitigation

1. Keep existing text fields (dusun, rt, rw) as optional for backwards compatibility
2. Create new migration instead of modifying existing
3. Test thoroughly after each phase
4. Document API changes for frontend team
