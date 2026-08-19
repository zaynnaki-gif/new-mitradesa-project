const fs = require('fs');

const fixes = {
  'src/routes/cms/berita.ts': [35],
  'src/routes/cms/halaman.ts': [36, 47, 58],
  'src/routes/cms/media.ts': [102],
  'src/routes/dashboard.ts': [17, 147],
  'src/routes/service/layanan.ts': [48],
  'src/routes/service/request.ts': [51],
  'src/routes/service/template-designer.ts': [43]
};

for (const [file, lines] of Object.entries(fixes)) {
  const content = fs.readFileSync(file, 'utf8').split('\n');
  for (const line of lines) {
    // 0-indexed array, 1-indexed lines
    if (content[line - 1].includes('req: Request')) {
      content[line - 1] = content[line - 1].replace('req: Request', '_req: Request');
    } else if (content[line - 1].includes('req,')) {
      content[line - 1] = content[line - 1].replace('req,', '_req,');
    }
  }
  fs.writeFileSync(file, content.join('\n'));
}

// Fix media.service.ts
let mediaService = fs.readFileSync('src/services/media.service.ts', 'utf8');
mediaService = mediaService.replace('{ search, fileType, kategori } = {}', '{ } = {}');
fs.writeFileSync('src/services/media.service.ts', mediaService);

console.log('Fixed specific lines');
