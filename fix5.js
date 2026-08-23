const fs = require('fs');

function replaceWithRegex(filePath, regex, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`Pattern not found in ${filePath}`);
    }
}

// 1. penduduk.service.ts update method
replaceWithRegex(
    'apps/api/src/services/penduduk.service.ts',
    /if \(updateInput\.statusKepindahan \!== undefined\) updateData\.statusKepindahan = updateInput\.statusKepindahan \? String\(updateInput\.statusKepindahan\) : null;\n\n\n\n    try \{/,
    `if (updateInput.statusKepindahan !== undefined) updateData.statusKepindahan = updateInput.statusKepindahan ? String(updateInput.statusKepindahan) : null;

    if (updateInput.dusun !== undefined) {
      if (updateInput.dusun) {
        const gubug = await prisma.gubug.findFirst({
          where: { nama: String(updateInput.dusun), desaId },
        });
        if (gubug) updateData.gubugId = gubug.id;
        else updateData.gubugId = null;
      } else {
        updateData.gubugId = null;
      }
    }

    try {`
);

// 2. keluarga.service.ts create method
replaceWithRegex(
    'apps/api/src/services/keluarga.service.ts',
    /const createData = data as CreateKeluargaInput & \{ \[key: string\]: unknown \};\n    const \{ desaId \} = getInstanceContext\(\);\n\n    \/\/ Cek duplikasi No KK/,
    `const createData = data as CreateKeluargaInput & { [key: string]: unknown };
    const { desaId } = getInstanceContext();

    let gubugId: bigint | null = null;
    if (createData.dusun) {
      const gubug = await prisma.gubug.findFirst({
        where: { nama: String(createData.dusun), desaId },
      });
      if (gubug) gubugId = gubug.id;
    }

    // Cek duplikasi No KK`
);

replaceWithRegex(
    'apps/api/src/services/keluarga.service.ts',
    /dusun: createData\.dusun \? String\(createData\.dusun\) : null,\n/,
    `dusun: createData.dusun ? String(createData.dusun) : null,
            gubugId,
`
);


// 3. keluarga.service.ts update method
replaceWithRegex(
    'apps/api/src/services/keluarga.service.ts',
    /if \(updateInput\.rt \!== undefined\) updateData\.rt = updateInput\.rt \? String\(updateInput\.rt\) : null;\n/,
    `if (updateInput.rt !== undefined) updateData.rt = updateInput.rt ? String(updateInput.rt) : null;
    
    if (updateInput.dusun !== undefined) {
      if (updateInput.dusun) {
        const gubug = await prisma.gubug.findFirst({
          where: { nama: String(updateInput.dusun), desaId },
        });
        if (gubug) updateData.gubugId = gubug.id;
        else updateData.gubugId = null;
      } else {
        updateData.gubugId = null;
      }
    }
`
);
