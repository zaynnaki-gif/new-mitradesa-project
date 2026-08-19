const fs = require('fs');
const files = [
  'src/routes/cms/agenda.ts',
  'src/routes/cms/berita.ts',
  'src/routes/cms/halaman.ts',
  'src/routes/cms/media.ts',
  'src/routes/cms/potensi.ts',
  'src/routes/cms/transparansi.ts',
  'src/routes/cms/umkm.ts',
  'src/routes/dashboard.ts',
  'src/routes/public/potensi.ts',
  'src/routes/service/document.ts',
  'src/routes/service/layanan.ts',
  'src/routes/service/request.ts',
  'src/routes/service/template-designer.ts',
  'src/services/media.service.ts'
];
for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('ApiError') && !content.includes('import { ApiError }')) {
    content = "import { ApiError } from '../../utils/response.js';\n" + content;
  }
  if (content.includes('getInstanceContext') && !content.includes('import { getInstanceContext }')) {
    content = "import { getInstanceContext } from '../../config/instance.js';\n" + content;
  }
  fs.writeFileSync(file, content);
}
console.log('Restored imports');
