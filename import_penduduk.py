"""
Script Python untuk import data penduduk dari CSV ke Supabase
Penggunaan:
    python import_penduduk.py

Persiapan:
    1. Install dependencies: pip install pandas supabase psycopg2-binary
    2. Set environment variables atau edit konfigurasi di bawah

Konfigurasi:
    - CSV_PATH: Path ke file CSV
    - SUPABASE_URL: URL project Supabase
    - SUPABASE_KEY: API Key Supabase (anon key)
"""

import csv
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional

# ============================================================
# KONFIGURASI - EDIT INI
# ============================================================
CSV_PATH = r"D:\mitradesa\penduduk.csv"
SUPABASE_URL = "https://psxppjmldyhwrqqyqegg.supabase.co"
SUPABASE_KEY = "YOUR_ANON_KEY_HERE"  # Ganti dengan anon key dari Supabase Dashboard

# Mapping status perkawinan CSV -> DB
STATUS_PERKAWINAN_MAP = {
    "Belum Kawin": "BK",
    "Kawin": "K",
    "Cerai Hidup": "CH",
    "Cerai Mati": "CM",
}

# Mapping STATUS_DALAM_KK -> DB
STATUS_DALAM_KK_MAP = {
    "Anak": "ANAK",
    "Istri": "ISTRI",
    "Suami": "SUAMI",
    "Famili Lain": "FAMILI",
    "Kepala Keluarga": "KEPALA_KELUARGA",
    "Orang Tua": "ORANG_TUA",
    "Mertua": "MERTUA",
    "Cucu": "CUCU",
    "Menantu": "MENANTU",
    "Lainnya": "LAINNYA",
}

# Mapping jenis kelamin - DB expects 1 character
JENIS_KELAMIN_MAP = {
    "Laki-Laki": "L",
    "Perempuan": "P",
}

# Mapping golongan darah - DB expects 3 chars max
GOLONGAN_DARAH_MAP = {
    "A": "A",
    "B": "B",
    "AB": "AB",
    "O": "O",
}


def parse_date(date_str: str) -> Optional[str]:
    """Parse tanggal dari format DD/MM/YYYY ke YYYY-MM-DD"""
    if not date_str or date_str.strip() == "":
        return None
    try:
        # Handle format DD/MM/YYYY
        parts = date_str.strip().split("/")
        if len(parts) == 3:
            day, month, year = parts
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except Exception:
        pass
    return None


def clean_value(val: str) -> Optional[str]:
    """Clean value - replace '-' dengan NULL"""
    if not val or val.strip() == "" or val.strip() == "-":
        return None
    return val.strip()


def transform_row(row: Dict) -> Optional[Dict]:
    """Transform satu baris CSV ke format database"""
    try:
        nik = clean_value(row.get("NIK"))
        if not nik:
            return None

        # Map jenis_kelamin: "Laki-Laki" -> "L", "Perempuan" -> "P"
        jk_raw = row.get("JENIS_KELAMIN", "").strip()
        jk_mapped = JENIS_KELAMIN_MAP.get(jk_raw, jk_raw[:1] if jk_raw else None)

        # Map gol_darah: use mapping if available, otherwise use raw value (max 3 chars)
        gd_raw = row.get("GOLONGAN_DARAH", "").strip()
        gd_mapped = GOLONGAN_DARAH_MAP.get(gd_raw, gd_raw[:3] if gd_raw else None)

        return {
            "nik": nik,
            "nama_lengkap": clean_value(row.get("NAMA")),
            "tempat_lahir": clean_value(row.get("TEMPAT_LAHIR")),
            "tanggal_lahir": parse_date(row.get("TANGGAL_LAHIR", "")),
            "jenis_kelamin": jk_mapped,
            "gol_darah": gd_mapped,
            "agama": clean_value(row.get("AGAMA")),
            "status_perkawinan": STATUS_PERKAWINAN_MAP.get(
                row.get("STATUS_PERKAWINAN", "").strip(), "BK"
            ),
            "hubungan_keluarga": STATUS_DALAM_KK_MAP.get(
                row.get("STATUS_DALAM_KK", "").strip(), "LAINNYA"
            ),
            "rt": clean_value(row.get("RT")),
            "rw": None,  # RW tidak ada di CSV
            "dusun": clean_value(row.get("DUSUN")),
            "warga_negara": "Indonesia",
            "is_aktif": True,
            "no_kk": clean_value(row.get("NO_KK")),
            "nama_ayah": clean_value(row.get("NAMA_BAPAK")),
            "nama_ibu": clean_value(row.get("NAMA_IBU")),
            "alamat": clean_value(row.get("DUSUN")),  # Pakai dusun sebagai alamat
        }
    except Exception as e:
        print(f"Error transforming row: {e}")
        return None


def read_csv_data(csv_path: str) -> List[Dict]:
    """Baca dan transform semua data dari CSV"""
    data = []
    errors = []

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        for i, row in enumerate(reader, 1):
            try:
                transformed = transform_row(row)
                if transformed:
                    data.append(transformed)
                else:
                    errors.append(f"Row {i}: Empty NIK or transform failed")
            except Exception as e:
                errors.append(f"Row {i}: {e}")

            if i % 1000 == 0:
                print(f"Processed {i} rows...")

    print(f"\nTotal rows processed: {len(data)}")
    if errors:
        print(f"Errors: {len(errors)}")
        for err in errors[:10]:  # Show first 10 errors
            print(f"  - {err}")

    return data


def format_sql_value(val):
    """Format value untuk SQL"""
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'true' if val else 'false'
    if isinstance(val, (int, float)):
        return str(val)
    # Escape single quotes
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"


def generate_sql_inserts(data: List[Dict], output_path: str):
    """Generate SQL INSERT statements"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("-- Generated INSERT statements for penduduk\n")
        f.write("-- Total records: " + str(len(data)) + "\n\n")

        # INSERT statements (batch per 100)
        batch_size = 100
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            values = []

            for row in batch:
                tanggal_lahir = format_sql_value(row.get('tanggal_lahir'))
                gol_darah = format_sql_value(row.get('gol_darah'))
                agama = format_sql_value(row.get('agama'))
                rt = format_sql_value(row.get('rt'))
                dusun = format_sql_value(row.get('dusun'))

                values.append(
                    "(" +
                    format_sql_value(row['nik']) + ", " +
                    format_sql_value(row['nama_lengkap']) + ", " +
                    format_sql_value(row['tempat_lahir']) + ", " +
                    tanggal_lahir + ", " +
                    format_sql_value(row['jenis_kelamin']) + ", " +
                    gol_darah + ", " +
                    agama + ", " +
                    format_sql_value(row['status_perkawinan']) + ", " +
                    format_sql_value(row['hubungan_keluarga']) + ", " +
                    rt + ", " +
                    "NULL, " +  # rw
                    dusun + ", " +
                    "'Indonesia', " +
                    "true, " +
                    "2, " +  # desa_id
                    "NOW(), NOW())"
                )

            f.write("INSERT INTO public.penduduk (\n")
            f.write("  nik, nama_lengkap, tempat_lahir, tanggal_lahir,\n")
            f.write("  jenis_kelamin, gol_darah, agama, status_perkawinan,\n")
            f.write("  hubungan_keluarga, rt, rw, dusun,\n")
            f.write("  warga_negara, is_aktif, desa_id, created_at, updated_at\n")
            f.write(") VALUES\n")
            f.write("  " + ",\n  ".join(values) + "\n")
            f.write("ON CONFLICT (nik) DO UPDATE SET\n")
            f.write("  nama_lengkap = EXCLUDED.nama_lengkap,\n")
            f.write("  updated_at = NOW();\n\n")

    print(f"\nSQL file generated: {output_path}")


def generate_keluarga_sql(data: List[Dict], output_path: str):
    """Generate SQL untuk keluarga dan update kepala_id"""
    # Ambil unique KK
    unique_kk = {}
    kepala_kk = {}  # Map: no_kk -> nik kepala keluarga

    for row in data:
        no_kk = row.get("no_kk")
        if no_kk and no_kk not in unique_kk:
            unique_kk[no_kk] = {
                "no_kk": no_kk,
                "rt": row.get("rt"),
                "dusun": row.get("alamat"),
            }

        # Tandai siapa kepala keluarga
        if row.get("hubungan_keluarga") == "KEPALA_KELUARGA":
            kepala_kk[no_kk] = row.get("nik")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("-- Generated INSERT statements for keluarga\n")
        f.write("-- Total KK: " + str(len(unique_kk)) + "\n\n")

        # INSERT keluarga
        values = []
        for no_kk, info in unique_kk.items():
            values.append(
                "(" +
                format_sql_value(info['no_kk']) + ", " +
                "NULL, " +  # kepala_id akan diupdate
                format_sql_value(info.get('dusun')) + ", " +
                format_sql_value(info.get('rt')) + ", " +
                "NULL, " +  # rw
                format_sql_value(info.get('dusun')) + ", " +
                "NULL, " +  # kode_pos
                "NOW(), NOW(), " +
                "NULL, " +  # deleted_at
                "2)"  # desa_id
            )

        f.write("INSERT INTO public.keluarga (\n")
        f.write("  no_kk, kepala_id, alamat, rt, rw, dusun, kode_pos,\n")
        f.write("  created_at, updated_at, deleted_at, desa_id\n")
        f.write(") VALUES\n")
        f.write("  " + ",\n  ".join(values) + "\n")
        f.write("ON CONFLICT (no_kk) DO NOTHING;\n\n")

        # UPDATE kepala_id
        f.write("-- Update kepala_id untuk keluarga\n")
        for no_kk, nik_kepala in kepala_kk.items():
            f.write(
                "UPDATE public.keluarga SET kepala_id = (SELECT id FROM public.penduduk WHERE nik = " +
                format_sql_value(nik_kepala) + " LIMIT 1) " +
                "WHERE no_kk = " + format_sql_value(no_kk) + ";\n"
            )

        # INSERT anggota_keluarga
        f.write("\n-- Insert anggota_keluarga\n")
        f.write("INSERT INTO public.anggota_keluarga (keluarga_id, penduduk_id, hubungan, is_aktif, created_at, updated_at)\n")
        f.write("SELECT k.id, p.id, ah.hubungan, true, NOW(), NOW()\n")
        f.write("FROM public.keluarga k\n")
        f.write("CROSS JOIN LATERAL (\n")
        f.write("  SELECT unnest(ARRAY[\n")
        anggota_values = []
        for r in data:
            if r.get("no_kk"):
                anggota_values.append(
                    "    (" + format_sql_value(r['nik']) + ", " +
                    format_sql_value(r['no_kk']) + ", " +
                    format_sql_value(r['hubungan_keluarga']) + ")"
                )
        f.write(",\n".join(anggota_values) + "\n")
        f.write("  ])::record(nik varchar, no_kk varchar, hubungan varchar)\n")
        f.write(") AS ah ON k.no_kk = ah.no_kk\n")
        f.write("JOIN public.penduduk p ON p.nik = ah.nik\n")
        f.write("ON CONFLICT DO NOTHING;\n")

    print(f"\nKeluarga SQL file generated: {output_path}")


def main():
    print("=" * 60)
    print("IMPORT DATA PENDUDUK KE SUPABASE")
    print("=" * 60)
    print(f"\nCSV Path: {CSV_PATH}")

    if not os.path.exists(CSV_PATH):
        print(f"\nERROR: File tidak ditemukan: {CSV_PATH}")
        sys.exit(1)

    # Baca data
    print("\nMembaca dan transform data CSV...")
    data = read_csv_data(CSV_PATH)

    if not data:
        print("\nERROR: Tidak ada data untuk diimport")
        sys.exit(1)

    # Generate SQL files
    print("\nMembuat SQL files...")

    penduduk_sql = CSV_PATH.replace(".csv", "_penduduk.sql")
    generate_sql_inserts(data, penduduk_sql)

    keluarga_sql = CSV_PATH.replace(".csv", "_keluarga.sql")
    generate_keluarga_sql(data, keluarga_sql)

    print("\n" + "=" * 60)
    print("SELESAI!")
    print("=" * 60)
    print(f"\nLangkah selanjutnya:")
    print(f"1. Jalankan import_step1_wilayah.sql di Supabase SQL Editor")
    print(f"2. Jalankan {penduduk_sql} di Supabase SQL Editor")
    print(f"3. Jalankan {keluarga_sql} di Supabase SQL Editor")
    print(f"\nAtau gunakan psql:")
    print(f"  psql 'postgresql://...' -f {penduduk_sql}")


if __name__ == "__main__":
    main()
