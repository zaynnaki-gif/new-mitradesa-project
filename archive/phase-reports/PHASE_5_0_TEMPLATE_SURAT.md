# PHASE 5.0 TEMPLATE SURAT WORKFLOW

**Date:** 2026-08-14
**Phase:** 5.0
**Status:** PENDING

---

## WORKFLOW SUMMARY

```
========================================
TEMPLATE SURAT WORKFLOW
========================================

1. Create Template:          [ ]
2. Configure Paper:          [ ]
3. Configure Margins:        [ ]
4. Configure Kop:            [ ]
5. Add Text:                 [ ]
6. Add Field Binding:        [ ]
7. Add Conditional Section:   [ ]
8. Add Table/Repeater:       [ ]
9. Add Signature:            [ ]
10. Preview:                 [ ]
11. Validate:                [ ]
12. Publish:                 [ ]
13. Use in Request:          [ ]

Status: PENDING
========================================
```

---

## PILOT TEMPLATES

### Template 1: Surat Keterangan Domisili (Simple)
- Text + field binding + signature
- Single page
- Basic layout

### Template 2: Surat Keterangan Usaha (Complex)
- Text + field binding + conditional section + table
- Single page
- Conditional display based on business type

### Template 3: Surat Pengantar (Multi-page)
- Long content + table + signature + page break
- Multi-page support
- Complex table structure

---

## WORKFLOW STEP 1: CREATE TEMPLATE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| CREATE-01 | Navigate to template list | List displayed | [ ] |
| CREATE-02 | Click "Buat Template Baru" | Create form opens | [ ] |
| CREATE-03 | Enter template name | Name accepted | [ ] |
| CREATE-04 | Select service type | Type selected | [ ] |
| CREATE-05 | Enter description | Description saved | [ ] |
| CREATE-06 | Save template | Template created | [ ] |
| CREATE-07 | Duplicate template | Copy created | [ ] |
| CREATE-08 | Delete template | Template deleted | [ ] |

### Notes
```
-
```

---

## WORKFLOW STEP 2: CONFIGURE PAPER

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PAPER-01 | Select A4 size | A4 selected | [ ] |
| PAPER-02 | Select F4 size | F4 selected | [ ] |
| PAPER-03 | Select Letter size | Letter selected | [ ] |
| PAPER-04 | Select Legal size | Legal selected | [ ] |
| PAPER-05 | Select Portrait orientation | Portrait set | [ ] |
| PAPER-06 | Select Landscape orientation | Landscape set | [ ] |

### Paper Sizes Reference

| Size | Dimensions |
|------|------------|
| A4 | 210 x 297 mm |
| F4 | 215 x 330 mm |
| Letter | 8.5 x 11 in |
| Legal | 8.5 x 14 in |

### Notes
```
-
```

---

## WORKFLOW STEP 3: CONFIGURE MARGINS

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| MARGIN-01 | Set top margin | Margin applied | [ ] |
| MARGIN-02 | Set bottom margin | Margin applied | [ ] |
| MARGIN-03 | Set left margin | Margin applied | [ ] |
| MARGIN-04 | Set right margin | Margin applied | [ ] |
| MARGIN-05 | Use preset (Normal/Narrow/Wide) | Preset applied | [ ] |
| MARGIN-06 | Preview with margins | Preview shows margins | [ ] |

### Margin Presets

| Preset | Top | Bottom | Left | Right |
|--------|-----|--------|------|-------|
| Normal | 25mm | 25mm | 30mm | 20mm |
| Narrow | 13mm | 13mm | 13mm | 13mm |
| Wide | 25mm | 25mm | 50mm | 25mm |

### Notes
```
-
```

---

## WORKFLOW STEP 4: CONFIGURE KOP SURAT

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| KOP-01 | View kop section | Kop editor opens | [ ] |
| KOP-02 | Add village logo | Logo displayed | [ ] |
| KOP-03 | Add village name | Name displayed | [ ] |
| KOP-04 | Add village address | Address displayed | [ ] |
| KOP-05 | Add contact info | Contact displayed | [ ] |
| KOP-06 | Position kop (top) | Kop at top | [ ] |
| KOP-07 | Enable/disable kop | Toggle works | [ ] |
| KOP-08 | Preview kop | Preview correct | [ ] |

### Notes
```
-
```

---

## WORKFLOW STEP 5: ADD TEXT

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| TEXT-01 | Add text block | Block added | [ ] |
| TEXT-02 | Edit text content | Content updated | [ ] |
| TEXT-03 | Format text (bold/italic) | Formatting applied | [ ] |
| TEXT-04 | Change text alignment | Alignment changed | [ ] |
| TEXT-05 | Change font size | Size changed | [ ] |
| TEXT-06 | Add numbered list | List created | [ ] |
| TEXT-07 | Add bullet list | List created | [ ] |
| TEXT-08 | Delete text block | Block deleted | [ ] |
| TEXT-09 | Reorder text blocks | Order updated | [ ] |

### Notes
```
-
```

---

## WORKFLOW STEP 6: ADD FIELD BINDING

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| BIND-01 | Open field picker | Picker displayed | [ ] |
| BIND-02 | Select penduduk field | Field inserted | [ ] |
| BIND-03 | Select keluarga field | Field inserted | [ ] |
| BIND-04 | Select service field | Field inserted | [ ] |
| BIND-05 | Select date field | Date format correct | [ ] |
| BIND-06 | Preview bound data | Data displayed | [ ] |
| BIND-07 | Invalid binding | Error shown | [ ] |

### Available Bindings

| Category | Fields |
|----------|--------|
| Penduduk | nama, nik, tempat_lahir, tanggal_lahir, alamat |
| Keluarga | no_kk, alamat |
| Desa | nama, alamat, telepon, email |
| Surat | nomor, tanggal, keperluan |
| Penandatangan | nama, jabatan |

### Sample Bindings

```handlebars
{{penduduk.nama}}
{{penduduk.nik}}
{{penduduk.alamat}}
{{desa.nama}}
{{surat.nomor}}
{{tanggal}}
{{penanda_tangan.nama}}
```

### Notes
```
-
```

---

## WORKFLOW STEP 7: ADD CONDITIONAL SECTION

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| COND-01 | Add conditional block | Block added | [ ] |
| COND-02 | Set condition rule | Rule applied | [ ] |
| COND-03 | Preview condition | Condition evaluated | [ ] |
| COND-04 | Nested condition | Nested works | [ ] |
| COND-05 | Delete condition | Block deleted | [ ] |

### Condition Operators

| Operator | Description |
|----------|-------------|
| equals | Value equals |
| not_equals | Value not equals |
| contains | Value contains |
| greater_than | Value greater than |
| less_than | Value less than |
| is_empty | Value is empty |
| is_not_empty | Value is not empty |

### Sample Conditions

```
{{#ifCond service.jenis_usaha "equals" "PERDAGANGAN"}}
  <p>Melanjutkan usaha perdagangan</p>
{{/ifCond}}

{{#ifCond penduduk.status "equals" "MENIKAH"}}
  <p>Status: Sudah Menikah</p>
{{/ifCond}}
```

### Notes
```
-
```

---

## WORKFLOW STEP 8: ADD TABLE/REPEATER

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| TABLE-01 | Add table | Table inserted | [ ] |
| TABLE-02 | Add columns | Columns added | [ ] |
| TABLE-03 | Add rows | Rows added | [ ] |
| TABLE-04 | Bind table data | Data bound | [ ] |
| TABLE-05 | Table header | Header styled | [ ] |
| TABLE-06 | Delete table | Table deleted | [ ] |
| TABLE-07 | Nested repeater | Repeater works | [ ] |

### Table Configuration

| Setting | Description |
|---------|-------------|
| Columns | Number of columns |
| Headers | Column headers |
| Data Source | Binding for data |
| Row Repeat | Repeat rows for data |

### Sample Table

```
| No | Nama | Jumlah |
|----|------|--------|
| 1  | {{item.nama}} | {{item.jumlah}} |
```

### Notes
```
-
```

---

## WORKFLOW STEP 9: ADD SIGNATURE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| SIGN-01 | Add signature block | Block added | [ ] |
| SIGN-02 | Select signatory | Signatory selected | [ ] |
| SIGN-03 | Position signature | Position set | [ ] |
| SIGN-04 | Add date line | Date line shown | [ ] |
| SIGN-05 | Add name line | Name line shown | [ ] |
| SIGN-06 | Add stamp area | Stamp area shown | [ ] |

### Signature Block Elements

| Element | Description |
|---------|-------------|
| Signature Image | Digital signature |
| Date Line | Tanggal, ___ __________ 2026 |
| Name Line | Nama Lengkap |
| Title Line | Jabatan |
| NIP Line | NIP (if applicable) |
| Stamp Area | Area for stamp |

### Notes
```
-
```

---

## WORKFLOW STEP 10: PREVIEW

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PREVIEW-01 | Open preview | Preview opens | [ ] |
| PREVIEW-02 | View PDF preview | PDF displayed | [ ] |
| PREVIEW-03 | Zoom in/out | Zoom works | [ ] |
| PREVIEW-04 | Page navigation | Pages navigable | [ ] |
| PREVIEW-05 | Preview with data | Data shown | [ ] |
| PREVIEW-06 | Refresh preview | Preview updates | [ ] |

### Notes
```
-
```

---

## WORKFLOW STEP 11: VALIDATE

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| VALID-01 | Run validation | Validation runs | [ ] |
| VALID-02 | No errors | Validation passed | [ ] |
| VALID-03 | Binding error | Error shown | [ ] |
| VALID-04 | Condition error | Error shown | [ ] |
| VALID-05 | Table error | Error shown | [ ] |
| VALID-06 | Fix error | Error fixed | [ ] |

### Validation Checklist

| Check | Status |
|-------|--------|
| All bindings valid | [ ] |
| All conditions valid | [ ] |
| All tables valid | [ ] |
| All signatures valid | [ ] |
| No syntax errors | [ ] |

### Notes
```
-
```

---

## WORKFLOW STEP 12: PUBLISH

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| PUBLISH-01 | Publish template | Status changed | [ ] |
| PUBLISH-02 | Unpublish template | Status changed | [ ] |
| PUBLISH-03 | Template in service | Available in service | [ ] |
| PUBLISH-04 | Edit published | Edit allowed | [ ] |
| PUBLISH-05 | Version history | History shown | [ ] |

### Notes
```
-
```

---

## WORKFLOW STEP 13: USE IN REQUEST

### End-to-End Test

```
SCENARIO: Create document from template

1. [ ] Warga submits request
2. [ ] Admin processes request
3. [ ] Admin generates document
4. [ ] System uses template
5. [ ] PDF generated with data
6. [ ] Document numbered
7. [ ] Document signed
8. [ ] Document verified
9. [ ] Warga can download
10. [ ] Public can verify
```

### Test Cases

| ID | Test Case | Expected Result | Status |
|----|-----------|----------------|--------|
| USE-01 | Generate document | Document created | [ ] |
| USE-02 | View generated PDF | PDF correct | [ ] |
| USE-03 | Check binding data | Data correct | [ ] |
| USE-04 | Check condition | Condition evaluated | [ ] |
| USE-05 | Check table | Table populated | [ ] |
| USE-06 | Check signature | Signature present | [ ] |

### Notes
```
-
```

---

## TEMPLATE 1: SURAT KETERANGAN DOMISILI

### Template Code
```
SURAT-KETERANGAN-DOMISILI-001
```

### Configuration
- Paper: A4, Portrait
- Margins: Normal
- Kop: Enabled
- Fields: {{penduduk.nama}}, {{penduduk.nik}}, {{penduduk.alamat}}
- Signature: {{penanda_tangan.nama}}, {{penanda_tangan.jabatan}}

### Validation Result

| Check | Result |
|-------|--------|
| Create template | [ ] |
| Configure paper | [ ] |
| Add kop | [ ] |
| Add text | [ ] |
| Add bindings | [ ] |
| Add signature | [ ] |
| Preview | [ ] |
| Publish | [ ] |
| Generate document | [ ] |

---

## TEMPLATE 2: SURAT KETERANGAN USAHA

### Template Code
```
SURAT-KETERANGAN-USAHA-001
```

### Configuration
- Paper: A4, Portrait
- Margins: Normal
- Kop: Enabled
- Fields: {{penduduk.nama}}, {{penduduk.nik}}, {{service.jenis_usaha}}, {{service.alamat_usaha}}
- Conditional: {{#ifCond service.jenis_usaha "equals" "PERDAGANGAN"}}
- Table: Daftar inventory (optional)
- Signature: {{penanda_tangan.nama}}, {{penanda_tangan.jabatan}}

### Validation Result

| Check | Result |
|-------|--------|
| Create template | [ ] |
| Configure paper | [ ] |
| Add kop | [ ] |
| Add text | [ ] |
| Add bindings | [ ] |
| Add condition | [ ] |
| Add table | [ ] |
| Add signature | [ ] |
| Preview | [ ] |
| Publish | [ ] |
| Generate document | [ ] |

---

## TEMPLATE 3: SURAT PENGANTAR

### Template Code
```
SURAT-PENGANTAR-001
```

### Configuration
- Paper: A4, Portrait
- Margins: Normal
- Kop: Enabled
- Fields: {{penduduk.nama}}, {{penduduk.nik}}, {{surat.keperluan}}
- Long content with multiple paragraphs
- Page break if needed
- Signature: {{penanda_tangan.nama}}, {{penanda_tangan.jabatan}}

### Validation Result

| Check | Result |
|-------|--------|
| Create template | [ ] |
| Configure paper | [ ] |
| Add kop | [ ] |
| Add text | [ ] |
| Add bindings | [ ] |
| Multi-page support | [ ] |
| Add signature | [ ] |
| Preview | [ ] |
| Publish | [ ] |
| Generate document | [ ] |

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Admin Tester | | | |
| QA Reviewer | | | |
| Product Owner | | | |

---

*End of Template Surat Workflow*
