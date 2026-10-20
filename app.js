/* =========================================================
   JURNAL MENGAJAR - SD NEGERI 016 PALARAN
   Data disimpan di localStorage browser (tanpa server).
   ========================================================= */

// ---------- DATA PENGGUNA ----------
const USERS = [
  { name: 'Agus Kinanti, S.Pd',     kelas: 'Kelas 1',     password: '123456',   role: 'guru' },
  { name: 'Meike Wijayanti, S.Pd',  kelas: 'Kelas 2',     password: '123456',   role: 'guru' },
  { name: 'Kirno, S.Pd',            kelas: 'Kelas 3',     password: '123456',   role: 'guru' },
  { name: 'Agus Sutarno, S.Pd',     kelas: 'Kelas 4',     password: '123456',   role: 'guru' },
  { name: 'Fella Fatmawati, S.Pd',  kelas: 'Kelas 5',     password: '123456',   role: 'guru' },
  { name: 'Nur Chamid, S.Pd',       kelas: 'Kelas 6',     password: '123456',   role: 'guru' },
  { name: 'Tito Rizky Utama, S.Pd', kelas: 'PJOK',        password: '123456',   role: 'guru', mapelTetap: 'PJOK' },
  { name: 'M.Sakti Pangestu, S.Pd', kelas: 'PAI',         password: '123456',   role: 'guru', mapelTetap: 'PAI' },
  { name: 'Kepala Sekolah',         kelas: 'Semua Kelas', password: '19831031', role: 'kepsek' }
];

const MAPEL = [
  'PAI', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'IPAS', 'PJOK', 'Seni Budaya',
  'Bahasa Inggris', 'Upacara Bendera', 'Senam', 'Kokurikuler', 'Lainnya'
];
const DAFTAR_KELAS = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

const KEY_DATA = 'jurnal_sd016_entries';
const KEY_SESI = 'jurnal_sd016_session';

// ---------- UTIL ----------
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loadData = () => { try { return JSON.parse(localStorage.getItem(KEY_DATA)) || []; } catch { return []; } };
const saveData = (d) => localStorage.setItem(KEY_DATA, JSON.stringify(d));
const hariDari = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' }) : '';
const tglPanjang = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const hariIni = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
}

let user = null;       // pengguna yang sedang login
let editingId = null;  // id jurnal yang sedang diedit

// ---------- LOGIN ----------
function initLogin() {
  $('loginNama').innerHTML = '<option value="">-- Pilih Nama --</option>' +
    USERS.map((u) => `<option value="${esc(u.name)}">${esc(u.name)}</option>`).join('');

  $('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = USERS.find((x) => x.name === $('loginNama').value);
    const err = $('loginError');
    if (!u || u.password !== $('loginPass').value) {
      err.textContent = 'Nama atau password salah.'; err.hidden = false; return;
    }
    err.hidden = true;
    localStorage.setItem(KEY_SESI, u.name);
    $('loginPass').value = '';
    masuk(u);
  });
}

function masuk(u) {
  user = u;
  $('loginView').hidden = true;
  $('appView').hidden = false;
  $('userName').textContent = u.name;
  $('userRole').textContent = u.role === 'kepsek' ? 'Kepala Sekolah' : u.kelas;
  setupTampilan();
  render();
}

$('btnLogout').addEventListener('click', () => {
  localStorage.removeItem(KEY_SESI);
  user = null; editingId = null;
  $('appView').hidden = true;
  $('loginView').hidden = false;
  $('loginNama').value = '';
});

// ---------- SETUP TAMPILAN PER ROLE ----------
function setupTampilan() {
  const kepsek = user.role === 'kepsek';
  $('formCard').hidden = kepsek;
  $('btnKirim').hidden = kepsek;
  $('boxFilterGuru').hidden = !kepsek;
  $('listTitle').textContent = kepsek ? 'Jurnal Seluruh Guru & Kelas' : 'Riwayat Jurnal Saya';

  if (kepsek) {
    $('fGuru').innerHTML = '<option value="">Semua Guru</option>' +
      USERS.filter((u) => u.role === 'guru').map((u) => `<option value="${esc(u.name)}">${esc(u.name)} (${esc(u.kelas)})</option>`).join('');
  } else {
    const khusus = !!user.mapelTetap; // guru PAI / PJOK
    $('boxMapel').hidden = khusus;
    $('boxKelasAuto').hidden = khusus;
    $('boxKelasPilih').hidden = !khusus;
    $('fMapel').innerHTML = MAPEL.map((m) => `<option>${m}</option>`).join('');
    $('fKelasPilih').innerHTML = DAFTAR_KELAS.map((k) => `<option>${k}</option>`).join('');
    $('fKelas').value = user.kelas;
    resetForm();
  }
}

// ---------- FORM ----------
$('fTanggal').addEventListener('change', () => ($('fHari').value = hariDari($('fTanggal').value)));
$('fMapel').addEventListener('change', () => {
  const lain = $('fMapel').value === 'Lainnya';
  $('fMapelLain').hidden = !lain; $('fMapelLain').required = lain;
});
$('fRefleksi').addEventListener('input', () => {
  const n = $('fRefleksi').value.trim().length;
  const c = $('charCount');
  c.textContent = `${n} / 50 karakter` + (n < 50 ? ` (kurang ${50 - n})` : ' ✓');
  c.style.color = n < 50 ? 'var(--danger)' : 'var(--success)';
});

function resetForm() {
  editingId = null;
  $('jurnalForm').reset();
  $('fTanggal').value = hariIni();
  $('fHari').value = hariDari($('fTanggal').value);
  $('fKelas').value = user.kelas;
  $('fMapelLain').hidden = true; $('fMapelLain').required = false;
  $('fHadir').value = 0; $('fTidakHadir').value = 0;
  $('formTitle').textContent = 'Isi Jurnal Hari Ini';
  $('btnSimpan').textContent = 'Simpan Jurnal';
  $('btnBatal').hidden = true;
  $('fRefleksi').dispatchEvent(new Event('input'));
}
$('btnBatal').addEventListener('click', resetForm);

$('jurnalForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const refleksi = $('fRefleksi').value.trim();
  if (refleksi.length < 50) { toast('Refleksi guru minimal 50 karakter.'); $('fRefleksi').focus(); return; }

  let mapel, kelas;
  if (user.mapelTetap) { mapel = user.mapelTetap; kelas = $('fKelasPilih').value; }
  else {
    kelas = user.kelas;
    mapel = $('fMapel').value === 'Lainnya' ? $('fMapelLain').value.trim() : $('fMapel').value;
    if (!mapel) { toast('Isi mata pelajaran / kegiatan lainnya.'); return; }
  }

  const data = loadData();
  const isi = {
    tanggal: $('fTanggal').value, mapel, kelas,
    materi: $('fMateri').value.trim(),
    hadir: +$('fHadir').value, tidakHadir: +$('fTidakHadir').value,
    refleksi
  };

  if (editingId) {
    const it = data.find((x) => x.id === editingId);
    if (it) Object.assign(it, isi);
    toast('Jurnal diperbarui.');
  } else {
    data.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      guru: user.name, ...isi, status: 'draft', jempol: false, feedback: '', dibuat: new Date().toISOString()
    });
    toast('Jurnal tersimpan. Klik "Kirim ke Kepala Sekolah" bila sudah siap.');
  }
  saveData(data);
  resetForm();
  render();
});

// ---------- FILTER ----------
['fDari', 'fSampai', 'fGuru'].forEach((id) => $(id).addEventListener('input', render));
$('btnReset').addEventListener('click', () => { $('fDari').value = ''; $('fSampai').value = ''; $('fGuru').value = ''; render(); });

function dataTerfilter() {
  const dari = $('fDari').value, sampai = $('fSampai').value, guru = $('fGuru').value;
  let d = loadData();
  if (user.role === 'kepsek') d = d.filter((x) => x.status === 'terkirim');
  else d = d.filter((x) => x.guru === user.name);
  if (dari) d = d.filter((x) => x.tanggal >= dari);
  if (sampai) d = d.filter((x) => x.tanggal <= sampai);
  if (guru && user.role === 'kepsek') d = d.filter((x) => x.guru === guru);
  return d.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.dibuat.localeCompare(a.dibuat));
}

// ---------- RENDER TABEL ----------
function render() {
  if (!user) return;
  const kepsek = user.role === 'kepsek';
  const rows = dataTerfilter();

  $('tabel').querySelector('thead').innerHTML = `<tr>
    <th>No</th><th>Hari, Tanggal</th>${kepsek ? '<th>Guru</th>' : ''}<th>Mata Pelajaran</th><th>Kelas</th>
    <th>Materi</th><th>Hadir</th><th>Tidak Hadir</th><th>Refleksi</th>
    ${kepsek ? '' : '<th>Status</th>'}<th>Feedback</th><th class="col-aksi no-print">Aksi</th></tr>`;

  $('tabel').querySelector('tbody').innerHTML = rows.map((r, i) => {
    const fbTampil = (r.jempol ? '👍 ' : '') + esc(r.feedback) || '<span class="muted">-</span>';
    const fbKepsek = `<div class="fb-box no-print">
        <div class="fb-row">
          <button class="thumb ${r.jempol ? 'active' : ''}" data-act="jempol" data-id="${r.id}" title="Beri jempol">👍</button>
          <input type="text" id="fb-${r.id}" value="${esc(r.feedback)}" placeholder="Tulis feedback..." />
        </div>
        <button class="btn btn-primary btn-sm" data-act="simpanFb" data-id="${r.id}">Kirim Feedback</button>
      </div><div class="print-only">${fbTampil}</div>`;

    const aksi = kepsek ? '' :
      (r.status === 'draft'
        ? `<div class="row-actions">
             <button class="btn btn-outline btn-sm" data-act="edit" data-id="${r.id}">Edit</button>
             <button class="btn btn-danger btn-sm" data-act="hapus" data-id="${r.id}">Hapus</button>
           </div>`
        : '<span class="muted small">Terkunci</span>');

    return `<tr>
      <td>${i + 1}</td>
      <td>${hariDari(r.tanggal)},<br>${tglPanjang(r.tanggal)}</td>
      ${kepsek ? `<td>${esc(r.guru)}</td>` : ''}
      <td>${esc(r.mapel)}</td><td>${esc(r.kelas)}</td>
      <td>${esc(r.materi)}</td><td>${r.hadir}</td><td>${r.tidakHadir}</td>
      <td>${esc(r.refleksi)}</td>
      ${kepsek ? '' : `<td><span class="badge ${r.status === 'draft' ? 'badge-draft' : 'badge-sent'}">${r.status === 'draft' ? 'Belum dikirim' : 'Terkirim'}</span></td>`}
      <td>${kepsek ? fbKepsek : `<span class="fb-show">${fbTampil}</span>`}</td>
      <td class="col-aksi no-print">${aksi}</td>
    </tr>`;
  }).join('');

  $('kosong').hidden = rows.length > 0;
  $('tabel').hidden = rows.length === 0;

  // keterangan untuk cetak
  const dari = $('fDari').value, sampai = $('fSampai').value;
  $('printMeta').textContent =
    (kepsek ? 'Dicetak oleh: Kepala Sekolah' : `Nama Guru: ${user.name} (${user.kelas})`) +
    ` | Periode: ${dari ? tglPanjang(dari) : 'Awal'} s.d. ${sampai ? tglPanjang(sampai) : 'Sekarang'}`;
}

// ---------- AKSI TABEL ----------
$('tabel').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id, act = btn.dataset.act;
  const data = loadData();
  const it = data.find((x) => x.id === id);
  if (!it) return;

  if (act === 'jempol') {
    it.jempol = !it.jempol; saveData(data); render();
  } else if (act === 'simpanFb') {
    it.feedback = $('fb-' + id).value.trim(); saveData(data); render(); toast('Feedback terkirim ke guru.');
  } else if (act === 'hapus') {
    if (confirm('Hapus jurnal ini?')) { saveData(data.filter((x) => x.id !== id)); render(); toast('Jurnal dihapus.'); }
  } else if (act === 'edit') {
    editingId = id;
    $('fTanggal').value = it.tanggal; $('fHari').value = hariDari(it.tanggal);
    if (user.mapelTetap) $('fKelasPilih').value = it.kelas;
    else {
      if (MAPEL.includes(it.mapel) && it.mapel !== 'Lainnya') { $('fMapel').value = it.mapel; $('fMapelLain').hidden = true; }
      else { $('fMapel').value = 'Lainnya'; $('fMapelLain').hidden = false; $('fMapelLain').value = it.mapel; }
    }
    $('fMateri').value = it.materi; $('fHadir').value = it.hadir; $('fTidakHadir').value = it.tidakHadir;
    $('fRefleksi').value = it.refleksi; $('fRefleksi').dispatchEvent(new Event('input'));
    $('formTitle').textContent = 'Edit Jurnal'; $('btnSimpan').textContent = 'Perbarui Jurnal'; $('btnBatal').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// ---------- KIRIM KE KEPALA SEKOLAH ----------
$('btnKirim').addEventListener('click', () => {
  const data = loadData();
  const draft = data.filter((x) => x.guru === user.name && x.status === 'draft');
  if (!draft.length) { toast('Tidak ada jurnal baru yang perlu dikirim.'); return; }
  if (!confirm(`Kirim ${draft.length} jurnal ke Kepala Sekolah? Jurnal yang terkirim tidak dapat diedit lagi.`)) return;
  draft.forEach((x) => { x.status = 'terkirim'; x.dikirim = new Date().toISOString(); });
  saveData(data); render(); toast('Jurnal berhasil dikirim ke Kepala Sekolah.');
});

// ---------- PRINT PDF ----------
// Di jendela print, pilih "Save as PDF" / "Simpan sebagai PDF".
$('btnPrint').addEventListener('click', () => window.print());

// ---------- START ----------
initLogin();
const sesi = localStorage.getItem(KEY_SESI);
const uSesi = USERS.find((u) => u.name === sesi);
if (uSesi) masuk(uSesi);
