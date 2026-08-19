import fs from 'fs';
import path from 'path';

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync(path.join(process.cwd(), 'apps/api/src'));
const n1Results = [];
const unboundedResults = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find "findMany" without "take" or "limit"
  // Needs multi-line match
  const blocks = content.split('findMany({');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].substring(0, blocks[i].indexOf('})'));
    if (!block.includes('take') && !block.includes('limit')) {
       unboundedResults.push(`${file.split('apps\\\\api\\\\src\\\\')[1] || file}: findMany({ ${block.replace(/\s+/g, ' ').substring(0, 60)}... })`);
    }
  }

  // Find loops with await
  const lines = content.split('\n');
  let inLoop = false;
  let loopStartLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/for\s*\(.*of|forEach\(|map\(.*=>/)) {
      inLoop = true;
      loopStartLine = i;
    }
    if (inLoop && line.includes('await') && (line.includes('prisma') || line.includes('this.db'))) {
      n1Results.push(`${file.split('apps\\\\api\\\\src\\\\')[1] || file}:${i+1}: ${line.trim()}`);
      inLoop = false;
    }
    if (inLoop && i > loopStartLine + 15) {
      inLoop = false; // reset if too long
    }
  }
}

console.log('--- UNBOUNDED FINDMANY ---');
console.log(unboundedResults.join('\n'));

console.log('\n--- POTENTIAL N+1 ---');
console.log(n1Results.join('\n'));
