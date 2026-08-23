const fs = require('fs');

const path = 'd:/mitradesa/apps/web/src/pages/admin/penduduk/PendudukPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the handleImportCSV function
const handleImportReplace = `
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleImportCSV = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const res = await fetch(\`\${API_URL}/penduduk/import\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csv: text }),
        });

        const data = await res.json();
        if (data.success) {
          const r = data.data;
          setImportResult({
            success: r.success,
            failed: r.failed,
            errors: r.errors || [],
          });
          setImportStep(3); // Go to Result Step
          fetchData();
        } else {
          setImportResult({ success: 0, failed: 1, errors: [data.message || 'Gagal import'] });
          setImportStep(3);
        }
      } catch (err: any) {
        setImportResult({ success: 0, failed: 1, errors: ['Gagal memproses file CSV: ' + err.message] });
        setImportStep(3);
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(importFile);
  };
`;

content = content.replace(/const handleImportCSV = async \(file: File\) => \{[\s\S]*?reader\.readAsText\(file\);\s*\};/, handleImportReplace.trim());

// Replace the modal JSX
const modalReplace = `
        {/* Import Modal */}
        {showImportModal && (
          <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2>Import Data Penduduk (Upsert)</h2>
                <button onClick={() => setShowImportModal(false)}>&times;</button>
              </div>
              <div className={styles.importModal} style={{ padding: '1.5rem' }}>
                
                {/* Step Wizard Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                  <div style={{ fontWeight: importStep >= 1 ? 'bold' : 'normal', color: importStep >= 1 ? '#000' : '#888' }}>1. Upload File</div>
                  <div style={{ fontWeight: importStep >= 2 ? 'bold' : 'normal', color: importStep >= 2 ? '#000' : '#888' }}>2. Preview</div>
                  <div style={{ fontWeight: importStep === 3 ? 'bold' : 'normal', color: importStep === 3 ? '#000' : '#888' }}>3. Hasil</div>
                </div>

                {importStep === 1 && (
                  <div>
                    <p className={styles.importInfo}>
                      Silakan upload file <strong>CSV</strong>. Sistem akan menimpa data (overwrite) jika NIK sudah ada, dan membuat data baru jika NIK belum ada. Pastikan kolom header sesuai.
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImportFile(file);
                        }
                      }}
                      style={{ marginBottom: '1.5rem', width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Button variant="outline" onClick={() => setShowImportModal(false)}>Batal</Button>
                      <Button variant="primary" onClick={() => setImportStep(2)} disabled={!importFile}>Selanjutnya</Button>
                    </div>
                  </div>
                )}

                {importStep === 2 && (
                  <div>
                    <p>File yang dipilih: <strong>{importFile?.name}</strong></p>
                    <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Penting:</strong></p>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        <li>Pastikan kolom <code>NIK</code> dan <code>NAMA_LENGKAP</code> ada.</li>
                        <li>Kolom Alamat, Dusun, RT, dan RW akan disimpan.</li>
                        <li>Data dengan NIK yang sama akan diperbarui (ditimpa).</li>
                      </ul>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Button variant="outline" onClick={() => setImportStep(1)} disabled={importLoading}>Kembali</Button>
                      <Button variant="primary" onClick={handleImportCSV} disabled={importLoading}>
                        {importLoading ? 'Memproses...' : 'Mulai Import'}
                      </Button>
                    </div>
                  </div>
                )}

                {importStep === 3 && (
                  <div>
                    <div className={styles.importResult} style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ marginTop: 0 }}>Import Selesai</h3>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1rem 0' }}>
                        <div style={{ background: '#e6f4ea', color: '#137333', padding: '1rem', borderRadius: '8px', minWidth: '100px' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{importResult?.success || 0}</div>
                          <div>Berhasil</div>
                        </div>
                        <div style={{ background: '#fce8e6', color: '#c5221f', padding: '1rem', borderRadius: '8px', minWidth: '100px' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{importResult?.failed || 0}</div>
                          <div>Gagal</div>
                        </div>
                      </div>
                      
                      {importResult?.errors && importResult.errors.length > 0 && (
                        <div className={styles.importErrors} style={{ textAlign: 'left', background: '#fff', border: '1px solid #fce8e6', padding: '1rem', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                          <p style={{ color: '#c5221f', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Detail Error:</p>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#c5221f', fontSize: '0.9rem' }}>
                            {importResult.errors.slice(0, 10).map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                            {importResult.errors.length > 10 && <li>...dan {importResult.errors.length - 10} lagi</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Button variant="primary" onClick={() => { setShowImportModal(false); setImportStep(1); setImportFile(null); }}>Tutup</Button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
`;

content = content.replace(/\{\/\* Import Modal \*\/\}\s*\{showImportModal && \([\s\S]*?\}\s*\)\}/, modalReplace.trim());

fs.writeFileSync(path, content);
console.log('PendudukPage.tsx has been updated with Step Wizard');
