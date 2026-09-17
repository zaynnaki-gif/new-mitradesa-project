const fs = require('fs');

const appendText = `
// ============================================================
// E-Planning (Perencanaan Desa)
// ============================================================
model Rpjmdes {
  id        BigInt   @id @default(autoincrement())
  periode   String   @db.VarChar(50)
  visi      String   @db.Text
  misi      String   @db.Text
  status    String   @default("DRAFT") @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  bidangs RpjmdesBidang[]

  @@map("rpjmdes")
}

model RpjmdesBidang {
  id         BigInt   @id @default(autoincrement())
  rpjmdesId  BigInt   @map("rpjmdes_id")
  namaBidang String   @map("nama_bidang") @db.VarChar(255)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  rpjmdes Rpjmdes  @relation(fields: [rpjmdesId], references: [id], onDelete: Cascade)
  rkpdes  Rkpdes[]

  @@index([rpjmdesId])
  @@map("rpjmdes_bidang")
}

model Rkpdes {
  id              BigInt   @id @default(autoincrement())
  rpjmdesBidangId BigInt   @map("rpjmdes_bidang_id")
  tahun           Int
  namaKegiatan    String   @map("nama_kegiatan") @db.VarChar(255)
  lokasi          String?  @db.VarChar(255)
  perkiraanBiaya  Float    @default(0) @map("perkiraan_biaya")
  apbdesItemId    BigInt?  @unique @map("apbdes_item_id")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  bidang     RpjmdesBidang @relation(fields: [rpjmdesBidangId], references: [id], onDelete: Cascade)
  apbdesItem ApbdesItem?   @relation(fields: [apbdesItemId], references: [id], onDelete: SetNull)

  @@index([rpjmdesBidangId])
  @@map("rkpdes")
}

// ============================================================
// E-Musrenbang (Usulan Online)
// ============================================================
model UsulanOnline {
  id          BigInt   @id @default(autoincrement())
  pendudukId  BigInt   @map("penduduk_id")
  judulUsulan String   @map("judul_usulan") @db.VarChar(255)
  deskripsi   String   @db.Text
  lokasi      String?  @db.VarChar(255)
  fotoUrl     String?  @map("foto_url") @db.VarChar(500)
  dukungan    Int      @default(0)
  status      String   @default("DRAFT") @db.VarChar(50)
  rkpdesId    BigInt?  @map("rkpdes_id")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  penduduk Penduduk @relation(fields: [pendudukId], references: [id], onDelete: Cascade)

  @@index([pendudukId])
  @@map("usulan_online")
}

// ============================================================
// E-Voting & Polling
// ============================================================
model Voting {
  id           BigInt   @id @default(autoincrement())
  judul        String   @db.VarChar(255)
  deskripsi    String   @db.Text
  waktuMulai   DateTime @map("waktu_mulai") @db.Timestamp(6)
  waktuSelesai DateTime @map("waktu_selesai") @db.Timestamp(6)
  status       String   @default("MENDATANG") @db.VarChar(50)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  kandidats VotingKandidat[]
  suaras    VotingSuara[]

  @@map("voting")
}

model VotingKandidat {
  id        BigInt   @id @default(autoincrement())
  votingId  BigInt   @map("voting_id")
  nama      String   @db.VarChar(255)
  deskripsi String?  @db.Text
  fotoUrl   String?  @map("foto_url") @db.VarChar(500)
  nomorUrut Int      @map("nomor_urut")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  voting Voting        @relation(fields: [votingId], references: [id], onDelete: Cascade)
  suaras VotingSuara[]

  @@index([votingId])
  @@map("voting_kandidat")
}

model VotingSuara {
  id         BigInt   @id @default(autoincrement())
  votingId   BigInt   @map("voting_id")
  kandidatId BigInt   @map("kandidat_id")
  pendudukId BigInt   @map("penduduk_id")
  waktu      DateTime @default(now()) @map("waktu_suara") @db.Timestamp(6)

  voting   Voting         @relation(fields: [votingId], references: [id], onDelete: Cascade)
  kandidat VotingKandidat @relation(fields: [kandidatId], references: [id], onDelete: Cascade)
  penduduk Penduduk       @relation(fields: [pendudukId], references: [id], onDelete: Cascade)

  @@unique([votingId, pendudukId], map: "voting_suara_unique")
  @@index([votingId])
  @@index([kandidatId])
  @@index([pendudukId])
  @@map("voting_suara")
}
`;

fs.appendFileSync('d:\\mitradesa\\apps\\api\\prisma\\schema.prisma', appendText);
console.log('Appended models back to schema');
