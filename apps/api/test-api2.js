const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.account.findFirst();
  if (!user) return console.log('no user');
  
  const token = jwt.sign(
    { accountId: user.id, username: user.username, role: user.role, status: user.status }, 
    process.env.JWT_SECRET || 'mitradesa_secret_key_2024', 
    { expiresIn: '1d' }
  );
  
  const fetch = require('node-fetch');
  
  try {
    const res = await fetch('http://localhost:3001/api/penduduk/export?format=xlsx', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('status:', res.status);
    const buffer = await res.buffer();
    console.log('response length:', buffer.byteLength);
    require('fs').writeFileSync('test-out.xlsx', buffer);
    console.log('written to test-out.xlsx');
  } catch (e) {
    console.error(e);
  }
}
test().finally(() => prisma.$disconnect());
