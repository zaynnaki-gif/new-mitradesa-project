const ExcelJS = require('exceljs');
async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('T');
  ws.addRow(['A']);
  const b = await wb.xlsx.writeBuffer();
  require('fs').writeFileSync('test.xlsx', Buffer.from(b));
  console.log(b.length);
}
test();
