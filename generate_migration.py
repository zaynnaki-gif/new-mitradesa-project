#!/usr/bin/env python3
"""
Script untuk generate SQL INSERT dari penduduk.csv
"""

import csv
import re

def clean_value(val):
    """Clean value untuk SQL"""
    if val is None or val.strip() == '' or val.strip() == '-':
        return 'NULL'
    val = val.strip().replace("'", "''").replace("\\", "")
    return f"'{val}'"

def convert_date(date_str):
    """Convert date format dd/mm/yyyy ke yyyy-mm-dd"""
    if not date_str or date_str.strip() == '' or date_str.strip() == '-':
        return 'NULL'
    try:
        parts = date_str.strip().split('/')
        if len(parts) == 3:
            return f"'{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}'"
    except:
        pass
    return clean_value(date_str)

def convert_jenis_kelamin(jk):
    """Convert: Perempuan -> P, Laki-Laki -> L"""
    if jk == 'Perempuan':
        return "'P'"
    elif jk == 'Laki-Laki':
        return "'L'"
    return clean_value(jk)

def convert_status_kawin(status):
    """Convert: Kawin -> K, Belum Kawin -> BK, Cerai Hidup -> CH, Cerai Mati -> CM"""
    mapping = {
        'Kawin': 'K',
        'Belum Kawin': 'BK',
        'Cerai Hidup': 'CH',
        'Cerai Mati': 'CM'
    }
    return f"'{mapping.get(status, status)}'"

def convert_hubungan(hubungan):
    """Convert hubungan keluarga"""
    mapping = {
        'Kepala Keluarga': 'KEPALA_KELUARGA',
        'Istri': 'ISTRI',
        'Anak': 'ANAK',
        'Famili Lain': 'FAMILI',
        'Famili': 'FAMILI'
    }
    return f"'{mapping.get(hubungan, hubungan)}'"

def convert_boolean(val):
    """Convert Ya/Tidak -> true/false"""
    if val == 'Ya':
        return 'true'
    return 'false'

def parse_aset(aset):
    """Parse kepemilikan aset to array format"""
    if not aset or aset.strip() == '' or aset.strip() == '-':
        return 'NULL'
    # Remove empty values
    items = [x.strip() for x in aset.split(',') if x.strip() and x.strip() != '-']
    if not items:
        return 'NULL'
    escaped = [x.replace("'", "''") for x in items]
    items_str = ', '.join([f"'{e}'" for e in escaped])
    return f"ARRAY[{items_str}]"

def normalize_number(val):
    """Convert number string to int"""
    if not val or val.strip() == '' or val.strip() == '-':
        return 'NULL'
    try:
        return str(int(float(val.replace(',', ''))))
    except:
        return 'NULL'

# Baca CSV
penduduk_records = []
keluarga_map = {}  # no_kk -> data
rumah_tangga_map = {}  # no_kk -> data

with open('penduduk.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        nik = row['NIK']
        no_kk = row['NO_KK']

        # Data Penduduk
        penduduk = {
            'nik': clean_value(nik),
            'nama_lengkap': clean_value(row['NAMA']),
            'tempat_lahir': clean_value(row['TEMPAT_LAHIR']),
            'tanggal_lahir': convert_date(row['TANGGAL_LAHIR']),
            'jenis_kelamin': convert_jenis_kelamin(row['JENIS_KELAMIN']),
            'gol_darah': clean_value(row['GOLONGAN_DARAH']),
            'agama': clean_value(row['AGAMA']),
            'status_perkawinan': convert_status_kawin(row['STATUS_PERKAWINAN']),
            'hubungan_keluarga': convert_hubungan(row['STATUS_DALAM_KK']),
            'alamat': 'NULL',
            'rt': clean_value(row['RT']),
            'rw': 'NULL',
            'dusun': clean_value(row['DUSUN']),
            'kode_pos': 'NULL',
            'telepon': 'NULL',
            'email': 'NULL',
            'warga_negara': clean_value(row['KEWARGANEGARAAN']),
            'nik_ayah': 'NULL',
            'nik_ibu': 'NULL',
            'is_aktif': 'true',
            'status_kepindahan': 'NULL',
            'provinsi': clean_value(row['PROVINSI']),
            'kabupaten': clean_value(row['KABUPATEN']),
            'kecamatan': clean_value(row['KECAMATAN']),
            'desa': clean_value(row['DESA']),
            'desa_id': '2',  # Seruni Mumbul
            'pendidikan': clean_value(row['PENDIDIKAN']),
            'pekerjaan': clean_value(row['PEKERJAAN']),
            'pendapatan_bulan': normalize_number(row['PENDAPATAN_BULAN']),
            'suku': clean_value(row['SUKU']),
            'bpjs_kesehatan': clean_value(row['BPJS_KESEHATAN']),
            'bpjs_ketenagakerjaan': clean_value(row['BPJS_KETENAGAKERJAAN']),
            'bantuan_sosial': clean_value(row['BANTUAN_SOSIAL']),
            'bantuan_extra': clean_value(row['BANTUAN_EXTRA']),
            'nama_ayah': clean_value(row['NAMA_BAPAK']),
            'nama_ibu': clean_value(row['NAMA_IBU']),
            'kondisi_fisik': clean_value(row['KONDISI_FISIK']),
        }
        penduduk_records.append(penduduk)

        # Data Keluarga (unique per no_kk)
        if no_kk not in keluarga_map:
            keluarga_map[no_kk] = {
                'no_kk': clean_value(no_kk),
                'alamat': clean_value(row['DUSUN']),
                'rt': clean_value(row['RT']),
                'rw': 'NULL',
                'dusun': clean_value(row['DUSUN']),
                'kode_pos': 'NULL',
                'desa_id': '2'
            }

        # Data Rumah Tangga (unique per no_kk)
        if no_kk not in rumah_tangga_map and row.get('KEPEMILIKAN_RUMAH', '-').strip() != '-':
            rumah_tangga_map[no_kk] = {
                'no_kk': clean_value(no_kk),
                'alamat': clean_value(row['DUSUN']),
                'rt': clean_value(row['RT']),
                'rw': 'NULL',
                'dusun': clean_value(row['DUSUN']),
                'desa_id': '2',
                'kepemilikan_rumah': clean_value(row['KEPEMILIKAN_RUMAH']),
                'luas_rumah': normalize_number(row['LUAS_RUMAH']),
                'jumlah_lantai': normalize_number(row['JUMLAH_LANTAI']),
                'jenis_lantai': clean_value(row['JENIS_LANTAI']),
                'jenis_dinding': clean_value(row['JENIS_DINDING']),
                'jenis_atap': clean_value(row['JENIS_ATAP']),
                'kepemilikan_tanah': clean_value(row['KEPEMILIKAN_TANAH']),
                'luas_tanah': normalize_number(row['LUAS_TANAH']),
                'penerangan': clean_value(row['PENERANGAN']),
                'sumber_energi_masak': clean_value(row['SUMBER_ENERGI_MASAK']),
                'mck': clean_value(row['MCK']),
                'sumber_air': clean_value(row['SUMBER_AIR']),
                'kepemilikan_aset': parse_aset(row.get('KEPEMILIKAN_ASET', '-')),
            }

# Generate SQL untuk Penduduk
print("-- ============================================")
print("-- MIGRASI DATA PENDUDUK")
print(f"-- Total: {len(penduduk_records)} records")
print("-- ============================================")

# Split into batches of 500
batch_size = 500
for batch_num in range(0, len(penduduk_records), batch_size):
    batch = penduduk_records[batch_num:batch_num + batch_size]
    print(f"\n-- Batch {batch_num // batch_size + 1}: records {batch_num + 1} - {batch_num + len(batch)}")

    cols = [
        'nik', 'nama_lengkap', 'tempat_lahir', 'tanggal_lahir',
        'jenis_kelamin', 'gol_darah', 'agama', 'status_perkawinan',
        'hubungan_keluarga', 'alamat', 'rt', 'rw', 'dusun',
        'kode_pos', 'telepon', 'email', 'warga_negara',
        'nik_ayah', 'nik_ibu', 'is_aktif', 'status_kepindahan',
        'provinsi', 'kabupaten', 'kecamatan', 'desa', 'desa_id',
        'pendidikan', 'pekerjaan', 'pendapatan_bulan', 'suku',
        'bpjs_kesehatan', 'bpjs_ketenagakerjaan', 'bantuan_sosial', 'bantuan_extra',
        'nama_ayah', 'nama_ibu', 'kondisi_fisik'
    ]

    print(f"INSERT INTO public.penduduk ({', '.join(cols)}) VALUES")
    values = []
    for p in batch:
        val = ', '.join([p[c] for c in cols])
        values.append(f"  ({val})")
    print(',\n'.join(values) + ';')

# Generate SQL untuk Keluarga
print("\n\n-- ============================================")
print("-- MIGRASI DATA KELUARGA")
print(f"-- Total: {len(keluarga_map)} KK")
print("-- ============================================")

keluarga_list = list(keluarga_map.values())
for batch_num in range(0, len(keluarga_list), batch_size):
    batch = keluarga_list[batch_num:batch_num + batch_size]
    print(f"\n-- Batch {batch_num // batch_size + 1}: records {batch_num + 1} - {batch_num + len(batch)}")

    cols = ['no_kk', 'alamat', 'rt', 'rw', 'dusun', 'kode_pos', 'desa_id']

    print(f"INSERT INTO public.keluarga ({', '.join(cols)}) VALUES")
    values = []
    for k in batch:
        val = ', '.join([k[c] for c in cols])
        values.append(f"  ({val})")
    print(',\n'.join(values) + ';')

# Generate SQL untuk Rumah Tangga
print("\n\n-- ============================================")
print("-- MIGRASI DATA RUMAH TANGGA")
print(f"-- Total: {len(rumah_tangga_map)} records")
print("-- ============================================")

rumah_list = list(rumah_tangga_map.values())
for batch_num in range(0, len(rumah_list), batch_size):
    batch = rumah_list[batch_num:batch_num + batch_size]
    print(f"\n-- Batch {batch_num // batch_size + 1}: records {batch_num + 1} - {batch_num + len(batch)}")

    cols = [
        'no_kk', 'alamat', 'rt', 'rw', 'dusun', 'desa_id',
        'kepemilikan_rumah', 'luas_rumah', 'jumlah_lantai',
        'jenis_lantai', 'jenis_dinding', 'jenis_atap',
        'kepemilikan_tanah', 'luas_tanah', 'penerangan',
        'sumber_energi_masak', 'mck', 'sumber_air', 'kepemilikan_aset'
    ]

    print(f"INSERT INTO public.rumah_tangga ({', '.join(cols)}) VALUES")
    values = []
    for r in batch:
        val = ', '.join([r[c] for c in cols])
        values.append(f"  ({val})")
    print(',\n'.join(values) + ';')

print(f"\n\n-- DONE: {len(penduduk_records)} penduduk, {len(keluarga_map)} keluarga, {len(rumah_tangga_map)} rumah tangga")
