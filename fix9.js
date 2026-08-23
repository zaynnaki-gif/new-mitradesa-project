const fs = require('fs');

function replaceRegex(filePath, regex, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
}

// 1. bumil.ts
replaceRegex('apps/api/src/routes/kesehatan/bumil.ts', 
    /dusun: data\.dusun \? String\(data\.dusun\) : null,\r?\n\s+rt: data\.rt \? String\(data\.rt\) : null,\r?\n\s+rw: data\.rw \? String\(data\.rw\) : null,/g, 
    'gubugId: data.gubugId ? BigInt(data.gubugId as any) : null,\n        rtId: data.rtId ? BigInt(data.rtId as any) : null,\n        rwId: data.rwId ? BigInt(data.rwId as any) : null,'
);

// 2. statistik.ts
replaceRegex('apps/api/src/routes/public/statistik.ts',
    /dusun: true,/g,
    'gubugId: true,'
);
replaceRegex('apps/api/src/routes/public/statistik.ts',
    /rt: true,/g,
    'rtId: true,'
);
replaceRegex('apps/api/src/routes/public/statistik.ts',
    /rw: true,/g,
    'rwId: true,'
);
replaceRegex('apps/api/src/routes/public/statistik.ts',
    /distinct: \['rw', 'dusun'\],/g,
    "distinct: ['rwId', 'gubugId'],"
);
replaceRegex('apps/api/src/routes/public/statistik.ts',
    /distinct: \['rt', 'rw', 'dusun'\],/g,
    "distinct: ['rtId', 'rwId', 'gubugId'],"
);

// 3. keluarga.service.ts (lines 196, 521, 522, 523, 537, 538, 539, 657)
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /rt: createData\.rt \? String\(createData\.rt\) : null,\r?\n/g,
    'rtId: createData.rtId ? BigInt(createData.rtId as any) : null,\n'
);
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /rw: createData\.rw \? String\(createData\.rw\) : null,\r?\n/g,
    'rwId: createData.rwId ? BigInt(createData.rwId as any) : null,\n'
);
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /dusun: createData\.dusun \? String\(createData\.dusun\) : null,\r?\n/g,
    'gubugId: createData.gubugId ? BigInt(createData.gubugId as any) : null,\n'
);

replaceRegex('apps/api/src/services/keluarga.service.ts',
    /k\.dusun \|\| '-'/g,
    "k.gubugId ? String(k.gubugId) : '-'"
);
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /k\.rw \|\| '-'/g,
    "k.rwId ? String(k.rwId) : '-'"
);
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /k\.rt \|\| '-'/g,
    "k.rtId ? String(k.rtId) : '-'"
);
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /dusun: k\.dusun/g,
    "gubugId: k.gubugId ? String(k.gubugId) : null"
);
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /rw: k\.rw/g,
    "rwId: k.rwId ? String(k.rwId) : null"
);
replaceRegex('apps/api/src/services/keluarga.service.ts',
    /rt: k\.rt/g,
    "rtId: k.rtId ? String(k.rtId) : null"
);


// 4. penduduk.service.ts syntax errors (line 281)
let pendudukContent = fs.readFileSync('apps/api/src/services/penduduk.service.ts', 'utf8');
pendudukContent = pendudukContent.replace(/email: createData.email \? String\(createData.email\) : null,\r?\n\s+gubugId: createData.gubugId \? BigInt\(createData.gubugId as any\) : null,\r?\n\s+gubugId,/g, 'email: createData.email ? String(createData.email) : null,\n            gubugId: createData.gubugId ? BigInt(createData.gubugId as any) : null,');
fs.writeFileSync('apps/api/src/services/penduduk.service.ts', pendudukContent);


// 5. perangkat-desa.service.ts
replaceRegex('apps/api/src/services/perangkat-desa.service.ts',
    /rt: true,/g,
    'rtId: true,'
);
replaceRegex('apps/api/src/services/perangkat-desa.service.ts',
    /rw: true,/g,
    'rwId: true,'
);
replaceRegex('apps/api/src/services/perangkat-desa.service.ts',
    /dusun: true,/g,
    'gubugId: true,'
);

console.log("Fixes applied");
