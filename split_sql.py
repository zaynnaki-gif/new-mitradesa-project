"""
Split SQL file into smaller chunks for import
"""
import os

INPUT_FILE = r"D:\mitradesa\penduduk_penduduk.sql"
OUTPUT_DIR = r"D:\mitradesa\sql_chunks"
BATCH_SIZE = 100  # records per batch

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Find all INSERT blocks
# Each batch has format: INSERT INTO ... VALUES (...),(...),... ON CONFLICT ...;

# Extract header and footer
header = """-- Generated INSERT statements for penduduk
-- Total records: 7867

"""

footer = """-- Done
"""

# Split by INSERT INTO statement
import re

# Find all INSERT blocks
pattern = r"(INSERT INTO public\.penduduk.*?ON CONFLICT.*?;)"
matches = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(matches)} INSERT blocks")

# Save each block as a separate file
for i, match in enumerate(matches, 1):
    output_file = os.path.join(OUTPUT_DIR, f"batch_{i:04d}.sql")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"-- Batch {i}\n")
        f.write(match)
        f.write("\n")
    print(f"Saved: {output_file}")

print("\nDone!")
