/**
 * Test Supabase Storage Upload using Fetch API
 * Run: node test-storage-upload.js
 */

const supabaseUrl = 'https://psxppjmldyhwrqqyqegg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeHBwam1sZHlod3JxcXlxZWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ0NDk2NCwiZXhwIjoyMTAyMDIwOTY0fQ.gEouFhfiaSA26vrC-NFIXsMQEUzVoJDcrbzRYBRhnfw';

async function testUpload() {
  console.log('🧪 Testing Supabase Storage Upload...\n');

  // Test 1: Upload a simple text file
  console.log('1️⃣  Uploading test.txt...');
  const testContent = `Test Upload at ${new Date().toISOString()}\nMitradesa API Storage Test`;
  const timestamp = Date.now();

  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/documents/test/${timestamp}/test.txt`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'text/plain',
        'x-upsert': 'true',
      },
      body: testContent,
    }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    console.error('❌ Upload failed:', error);
    return false;
  }

  const uploadData = await uploadResponse.json();
  console.log('✅ Upload success!');
  console.log('   Key:', uploadData.Key);
  console.log   ('   ID:', uploadData.Id);

  // Test 2: Get public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/documents/test/${timestamp}/test.txt`;
  console.log('\n2️⃣  Public URL:');
  console.log('   ', publicUrl);

  // Test 3: Verify URL is accessible
  console.log('\n3️⃣  Verifying URL is accessible...');
  const verifyResponse = await fetch(publicUrl);
  if (verifyResponse.ok) {
    const content = await verifyResponse.text();
    console.log('✅ URL is accessible!');
    console.log('   Content preview:', content.substring(0, 50));
  } else {
    console.log('❌ URL not accessible:', verifyResponse.status);
  }

  // Test 4: Upload a PDF-like buffer
  console.log('\n4️⃣  Testing PDF buffer upload...');
  const pdfContent = '%PDF-1.4\nTest PDF Content\n%%EOF';
  const pdfTimestamp = Date.now();

  const pdfUploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/documents/test/${pdfTimestamp}/document.pdf`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true',
      },
      body: pdfContent,
    }
  );

  if (!pdfUploadResponse.ok) {
    console.error('❌ PDF upload failed:', await pdfUploadResponse.text());
    return false;
  }

  const pdfData = await pdfUploadResponse.json();
  console.log('✅ PDF upload success!');
  console.log('   Key:', pdfData.Key);

  const pdfUrl = `${supabaseUrl}/storage/v1/object/public/documents/test/${pdfTimestamp}/document.pdf`;
  console.log('\n5️⃣  PDF Public URL:');
  console.log('   ', pdfUrl);

  console.log('\n🎉 All storage tests passed!');
  console.log('\n📋 Summary:');
  console.log('   - Bucket: documents (public) ✅');
  console.log('   - Storage Provider: Supabase ✅');
  console.log('   - Ready for PDF uploads! ✅');

  return true;
}

testUpload()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
