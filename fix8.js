const fs = require('fs');

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove dusun lookup in create
    content = content.replace(/    let gubugId: bigint \| null = null;\r?\n    if \(createData\.dusun\) \{\r?\n      const gubug = await prisma\.gubug\.findFirst\(\{\r?\n        where: \{ nama: String\(createData\.dusun\), desaId \},\r?\n      \}\);\r?\n      if \(gubug\) gubugId = gubug\.id;\r?\n    \}\r?\n/g, '');

    content = content.replace(/    let gubugId: bigint \| null = null;\r?\n    if \(createData\.dusun\) \{\r?\n      const gubug = await prisma\.gubug\.findFirst\(\{\r?\n        where: \{ nama: String\(createData\.dusun\), desaId \},\r?\n      \}\);\r?\n      if \(gubug\) gubugId = gubug\.id;\r?\n    \}\r?\n/g, '');

    // Replace fields in create
    content = content.replace(/rt: createData\.rt \? String\(createData\.rt\) : null,\r?\n/g, 'rtId: createData.rtId ? BigInt(createData.rtId as any) : null,\n');
    content = content.replace(/rw: createData\.rw \? String\(createData\.rw\) : null,\r?\n/g, 'rwId: createData.rwId ? BigInt(createData.rwId as any) : null,\n');
    content = content.replace(/dusun: createData\.dusun \? String\(createData\.dusun\) : null,\r?\n/g, 'gubugId: createData.gubugId ? BigInt(createData.gubugId as any) : null,\n');

    // Remove dusun lookup in update (Penduduk)
    content = content.replace(/    if \(updateInput\.dusun !== undefined\) \{\r?\n      if \(updateInput\.dusun\) \{\r?\n        const gubug = await prisma\.gubug\.findFirst\(\{\r?\n          where: \{ nama: String\(updateInput\.dusun\), desaId \},\r?\n        \}\);\r?\n        if \(gubug\) updateData\.gubugId = gubug\.id;\r?\n        else updateData\.gubugId = null;\r?\n      \} else \{\r?\n        updateData\.gubugId = null;\r?\n      \}\r?\n    \}\r?\n/g, '');

    // Remove dusun lookup in update (Keluarga)
    content = content.replace(/    if \(data\.dusun !== undefined\) \{\r?\n      if \(data\.dusun\) \{\r?\n        const gubug = await prisma\.gubug\.findFirst\(\{\r?\n          where: \{ nama: String\(data\.dusun\), desaId \},\r?\n        \}\);\r?\n        if \(gubug\) updateData\.gubugId = gubug\.id;\r?\n        else updateData\.gubugId = null;\r?\n      \} else \{\r?\n        updateData\.gubugId = null;\r?\n      \}\r?\n    \}\r?\n/g, '');

    // Add ID mapping for update (Penduduk)
    content = content.replace(/    if \(updateInput\.statusKepindahan !== undefined\) updateData\.statusKepindahan = updateInput\.statusKepindahan \? String\(updateInput\.statusKepindahan\) : null;\r?\n/g, '    if (updateInput.statusKepindahan !== undefined) updateData.statusKepindahan = updateInput.statusKepindahan ? String(updateInput.statusKepindahan) : null;\n    if (updateInput.gubugId !== undefined) updateData.gubugId = updateInput.gubugId ? BigInt(updateInput.gubugId as any) : null;\n    if (updateInput.rwId !== undefined) updateData.rwId = updateInput.rwId ? BigInt(updateInput.rwId as any) : null;\n    if (updateInput.rtId !== undefined) updateData.rtId = updateInput.rtId ? BigInt(updateInput.rtId as any) : null;\n');

    // Add ID mapping for update (Keluarga)
    content = content.replace(/    if \(data\.kodePos !== undefined\) updateData\.kodePos = data\.kodePos \? String\(data\.kodePos\) : null;\r?\n/g, '    if (data.kodePos !== undefined) updateData.kodePos = data.kodePos ? String(data.kodePos) : null;\n    if (data.gubugId !== undefined) updateData.gubugId = data.gubugId ? BigInt(data.gubugId as any) : null;\n    if (data.rwId !== undefined) updateData.rwId = data.rwId ? BigInt(data.rwId as any) : null;\n    if (data.rtId !== undefined) updateData.rtId = data.rtId ? BigInt(data.rtId as any) : null;\n');

    // Remove rt, rw update if present
    content = content.replace(/    if \(updateInput\.rt !== undefined\) updateData\.rt = updateInput\.rt \? String\(updateInput\.rt\) : null;\r?\n/g, '');
    content = content.replace(/    if \(updateInput\.rw !== undefined\) updateData\.rw = updateInput\.rw \? String\(updateInput\.rw\) : null;\r?\n/g, '');
    content = content.replace(/    if \(data\.rt !== undefined\) updateData\.rt = data\.rt \? String\(data\.rt\) : null;\r?\n/g, '');
    content = content.replace(/    if \(data\.rw !== undefined\) updateData\.rw = data\.rw \? String\(data\.rw\) : null;\r?\n/g, '');


    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
}

processFile('apps/api/src/services/penduduk.service.ts');
processFile('apps/api/src/services/keluarga.service.ts');
