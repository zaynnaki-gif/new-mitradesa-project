const fs = require('fs');
const path = require('path');

const dir = 'D:/mitradesa/apps/api/src/services';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.service.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const regex = /const\s+where:\s*any\s*=\s*{};/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
      const nextPrismaMatch = content.substring(match.index).match(/prisma\.([a-zA-Z]+)\./);
      if (nextPrismaMatch) {
          let mName = nextPrismaMatch[1];
          mName = mName.charAt(0).toUpperCase() + mName.slice(1);
          content = content.substring(0, match.index) + 
                    "const where: Prisma." + mName + "WhereInput = {};" + 
                    content.substring(match.index + match[0].length);
          changed = true;
          regex.lastIndex = 0;
      }
  }

  if (changed && !content.includes('import { Prisma }')) {
    const importMatch = content.match(/(import.*@prisma\/client.*)/);
    if (importMatch) {
        content = content.replace(/(import.*@prisma\/client.*)/, "import { Prisma } from '@prisma/client';\n");
    } else {
        content = "import { Prisma } from '@prisma/client';\n" + content;
    }
  }

  // Remove eslint-disable on the first line or anywhere really
  if (content.includes('eslint-disable')) {
    content = content.replace(/\/\*\s*eslint-disable\s*@typescript-eslint\/no-explicit-any\s*\*\/\r?\n?/g, '');
    content = content.replace(/\/\*\s*eslint-disable\s*@typescript-eslint\/no-explicit-any,\s*@typescript-eslint\/no-non-null-assertion\s*\*\/\r?\n?/g, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  }
}
