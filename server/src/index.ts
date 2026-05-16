import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import mysql, { type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = new Hono()

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadEnvFile = () => {
  const envPath = resolve(__dirname, '..', '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const envFile = readFileSync(envPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
};

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

loadEnvFile();

// ==========================================
// 1. DEFINISI TIPE & INTERFACE (Sesuai ERD Baru)
// ==========================================

interface Departemen extends RowDataPacket {
  id_departemen: number;
  nama_departemen: string;
  kepala_departemen: string;
}

interface Mahasiswa extends RowDataPacket {
  NRP: number;
  nama_mahasiswa: string;
  angkatan: number;
  semester: string;
  status_aktif: string;
  id_departemen: number;
}

interface Dosen extends RowDataPacket {
  id_dosen: number;
  nama_dosen: string;
  jabatan_akademik: string;
  id_departemen: number;
}

interface Users extends RowDataPacket {
  id_user: number;
  email: string;
  password?: string;
  role: string;
  created_at: string;
  updated_at: string;
  NRP: number;
  id_dosen: number;
}

interface MataKuliah extends RowDataPacket {
  id_matkul: number;
  nama_matkul: string;
  sks: number;
}

interface Kelas extends RowDataPacket {
  id_kelas: number;
  ruangan: string;
  nama_kelas: string;
  kapasitas_kelas: number;
}

interface Jadwal extends RowDataPacket {
  id_jadwal: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  semester: string;
  id_matkul: number;
  id_kelas: number;
  id_dosen: number;
}

interface Krs extends RowDataPacket {
  id_krs: number;
  NRP: number;
  total_sks: number;
  status_krs: string;
  semester: string;
  tahun_ajaran: string;
}

interface DetailKrs extends RowDataPacket {
  id_dkrs: number;
  status_matkul: string;
  id_krs: number;
  id_jadwal: number;
}

interface Nilai extends RowDataPacket {
  id_nilai: number;
  nilai_tugas: number;
  nilai_ETS: number;
  nilai_EAS: number;
  nilai_akhir: number;
  huruf_mutu: string;
  id_dkrs: number;
}


const handleError = (c: Context, error: unknown) => {
  console.error(error);
  const databaseError = error as Error & { code?: string; sqlState?: string };
  const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada database';
  const clientErrorCodes = new Set([
    'ER_BAD_NULL_ERROR',
    'ER_DUP_ENTRY',
    'ER_NO_REFERENCED_ROW_2',
    'ER_ROW_IS_REFERENCED_2',
    'ER_TRUNCATED_WRONG_VALUE',
    'ER_WARN_DATA_OUT_OF_RANGE',
  ]);
  const status = databaseError.sqlState === '45000' || clientErrorCodes.has(databaseError.code ?? '')
    ? 400
    : 500;

  return c.json({ success: false, error: message }, status);
};

// ==========================================
// 2. SETUP SERVER & DATABASE
// ==========================================

const pool = mysql.createPool({
  host: getEnv('DB_HOST'),
  user: getEnv('DB_USER'),
  port: Number(getEnv('DB_PORT', '3306')),
  password: getEnv('DB_PASSWORD'),
  database: getEnv('DB_NAME'),
  waitForConnections: true,
  connectionLimit: Number(getEnv('DB_CONNECTION_LIMIT', '5')),
});

app.get('/api/departemen', async (c) => {
  try {
    const [rows] = await pool.query<Departemen[]>('SELECT * FROM departemen');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/departemen/:id', async (c) => {
  try {
    const [rows] = await pool.query<Departemen[]>('SELECT * FROM departemen WHERE id_departemen=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/departemen', async (c) => {
  try {
    const { nama_departemen, kepala_departemen } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO departemen (nama_departemen, kepala_departemen) VALUES (?, ?)',
      [nama_departemen, kepala_departemen]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/departemen/:id', async (c) => {
  try {
    const { nama_departemen, kepala_departemen } = await c.req.json();
    await pool.query(
      'UPDATE departemen SET nama_departemen=?, kepala_departemen=? WHERE id_departemen=?',
      [nama_departemen, kepala_departemen, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/departemen/:id', async (c) => {
  try {
    await pool.query('DELETE FROM departemen WHERE id_departemen=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// MAHASISWA
// ------------------------------------------
app.get('/api/mahasiswa', async (c) => {
  try {
    const [rows] = await pool.query<Mahasiswa[]>('SELECT * FROM mahasiswa');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/mahasiswa/:id', async (c) => {
  try {
    const [rows] = await pool.query<Mahasiswa[]>('SELECT * FROM mahasiswa WHERE NRP=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/mahasiswa', async (c) => {
  try {
    const { NRP, nama_mahasiswa, angkatan, semester, status_aktif, id_departemen } = await c.req.json();
    await pool.query(
      'INSERT INTO mahasiswa VALUES (?, ?, ?, ?, ?, ?)',
      [NRP, nama_mahasiswa, angkatan, semester, status_aktif, id_departemen]
    );
    return c.json({ success: true, id: NRP }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/mahasiswa/:id', async (c) => {
  try {
    const { nama_mahasiswa, angkatan, semester, status_aktif, id_departemen } = await c.req.json();
    await pool.query(
      'UPDATE mahasiswa SET nama_mahasiswa=?, angkatan=?, semester=?, status_aktif=?, id_departemen=? WHERE NRP=?',
      [nama_mahasiswa, angkatan, semester, status_aktif, id_departemen, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/mahasiswa/:id', async (c) => {
  try {
    await pool.query('DELETE FROM mahasiswa WHERE NRP=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// DOSEN
// ------------------------------------------
app.get('/api/dosen', async (c) => {
  try {
    const [rows] = await pool.query<Dosen[]>('SELECT * FROM dosen');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/dosen/:id', async (c) => {
  try {
    const [rows] = await pool.query<Dosen[]>('SELECT * FROM dosen WHERE id_dosen=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/dosen', async (c) => {
  try {
    const { nama_dosen, jabatan_akademik, id_departemen } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO dosen (nama_dosen, jabatan_akademik, id_departemen) VALUES (?, ?, ?)',
      [nama_dosen, jabatan_akademik, id_departemen]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/dosen/:id', async (c) => {
  try {
    const { nama_dosen, jabatan_akademik, id_departemen } = await c.req.json();
    await pool.query(
      'UPDATE dosen SET nama_dosen=?, jabatan_akademik=?, id_departemen=? WHERE id_dosen=?',
      [nama_dosen, jabatan_akademik, id_departemen, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/dosen/:id', async (c) => {
  try {
    await pool.query('DELETE FROM dosen WHERE id_dosen=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// MATA KULIAH
// ------------------------------------------
app.get('/api/matakuliah', async (c) => {
  try {
    const [rows] = await pool.query<MataKuliah[]>('SELECT * FROM mata_kuliah');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/matakuliah/:id', async (c) => {
  try {
    const [rows] = await pool.query<MataKuliah[]>('SELECT * FROM mata_kuliah WHERE id_matkul=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/matakuliah', async (c) => {
  try {
    const { nama_matkul, sks } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO mata_kuliah (nama_matkul, sks) VALUES (?, ?)',
      [nama_matkul, sks]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/matakuliah/:id', async (c) => {
  try {
    const { nama_matkul, sks } = await c.req.json();
    await pool.query(
      'UPDATE mata_kuliah SET nama_matkul=?, sks=? WHERE id_matkul=?',
      [nama_matkul, sks, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/matakuliah/:id', async (c) => {
  try {
    await pool.query('DELETE FROM mata_kuliah WHERE id_matkul=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// KELAS
// ------------------------------------------
app.get('/api/kelas', async (c) => {
  try {
    const [rows] = await pool.query<Kelas[]>('SELECT * FROM kelas');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/kelas/:id', async (c) => {
  try {
    const [rows] = await pool.query<Kelas[]>('SELECT * FROM kelas WHERE id_kelas=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/kelas', async (c) => {
  try {
    const { ruangan, nama_kelas, kapasitas_kelas } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO kelas (ruangan, nama_kelas, kapasitas_kelas) VALUES (?, ?, ?)',
      [ruangan, nama_kelas, kapasitas_kelas]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/kelas/:id', async (c) => {
  try {
    const { ruangan, nama_kelas, kapasitas_kelas } = await c.req.json();
    await pool.query(
      'UPDATE kelas SET ruangan=?, nama_kelas=?, kapasitas_kelas=? WHERE id_kelas=?',
      [ruangan, nama_kelas, kapasitas_kelas, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/kelas/:id', async (c) => {
  try {
    await pool.query('DELETE FROM kelas WHERE id_kelas=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// JADWAL
// ------------------------------------------
app.get('/api/jadwal', async (c) => {
  try {
    const [rows] = await pool.query<Jadwal[]>('SELECT * FROM jadwal');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/jadwal/:id', async (c) => {
  try {
    const [rows] = await pool.query<Jadwal[]>('SELECT * FROM jadwal WHERE id_jadwal=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/jadwal', async (c) => {
  try {
    const { hari, jam_mulai, jam_selesai, semester, id_matkul, id_kelas, id_dosen } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO jadwal (hari, jam_mulai, jam_selesai, semester, id_matkul, id_kelas, id_dosen) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [hari, jam_mulai, jam_selesai, semester, id_matkul, id_kelas, id_dosen]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/jadwal/:id', async (c) => {
  try {
    const { hari, jam_mulai, jam_selesai, semester, id_matkul, id_kelas, id_dosen } = await c.req.json();
    await pool.query(
      'UPDATE jadwal SET hari=?, jam_mulai=?, jam_selesai=?, semester=?, id_matkul=?, id_kelas=?, id_dosen=? WHERE id_jadwal=?',
      [hari, jam_mulai, jam_selesai, semester, id_matkul, id_kelas, id_dosen, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/jadwal/:id', async (c) => {
  try {
    await pool.query('DELETE FROM jadwal WHERE id_jadwal=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// KRS
// ------------------------------------------
app.get('/api/krs', async (c) => {
  try {
    const [rows] = await pool.query<Krs[]>('SELECT * FROM krs');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/krs/:id', async (c) => {
  try {
    const [rows] = await pool.query<Krs[]>('SELECT * FROM krs WHERE id_krs=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/krs', async (c) => {
  try {
    const { NRP, status_krs, semester, tahun_ajaran } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO krs (NRP, total_sks, status_krs, semester, tahun_ajaran) VALUES (?, ?, ?, ?, ?)',
      [NRP, 0, status_krs, semester, tahun_ajaran]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/krs/:id', async (c) => {
  try {
    const { NRP, status_krs, semester, tahun_ajaran } = await c.req.json();
    await pool.query(
      'UPDATE krs SET NRP=?, status_krs=?, semester=?, tahun_ajaran=? WHERE id_krs=?',
      [NRP, status_krs, semester, tahun_ajaran, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/krs/:id', async (c) => {
  try {
    await pool.query('DELETE FROM krs WHERE id_krs=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// DETAIL KRS
// ------------------------------------------
app.get('/api/detailkrs', async (c) => {
  try {
    const [rows] = await pool.query<DetailKrs[]>('SELECT * FROM detail_krs');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/detailkrs/:id', async (c) => {
  try {
    const [rows] = await pool.query<DetailKrs[]>('SELECT * FROM detail_krs WHERE id_dkrs=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/detailkrs', async (c) => {
  try {
    const { status_matkul = 'Aktif', id_krs, id_jadwal } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO detail_krs (status_matkul, id_krs, id_jadwal) VALUES (?, ?, ?)',
      [status_matkul, id_krs, id_jadwal]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/detailkrs/:id', async (c) => {
  try {
    const { status_matkul } = await c.req.json();
    await pool.query(
      'UPDATE detail_krs SET status_matkul=? WHERE id_dkrs=?',
      [status_matkul, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/detailkrs/:id', async (c) => {
  try {
    await pool.query('DELETE FROM detail_krs WHERE id_dkrs=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// NILAI
// ------------------------------------------
app.get('/api/nilai', async (c) => {
  try {
    const [rows] = await pool.query<Nilai[]>('SELECT * FROM nilai');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/nilai/:id', async (c) => {
  try {
    const [rows] = await pool.query<Nilai[]>('SELECT * FROM nilai WHERE id_nilai=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/nilai', async (c) => {
  try {
    const { nilai_tugas, nilai_ETS, nilai_EAS, id_dkrs } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO nilai (nilai_tugas, nilai_ETS, nilai_EAS, id_dkrs) VALUES (?, ?, ?, ?)',
      [nilai_tugas, nilai_ETS, nilai_EAS, id_dkrs]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/nilai/:id', async (c) => {
  try {
    const { nilai_tugas, nilai_ETS, nilai_EAS } = await c.req.json();
    await pool.query(
      'UPDATE nilai SET nilai_tugas=?, nilai_ETS=?, nilai_EAS=? WHERE id_nilai=?',
      [nilai_tugas, nilai_ETS, nilai_EAS, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/nilai/:id', async (c) => {
  try {
    await pool.query('DELETE FROM nilai WHERE id_nilai=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

// ------------------------------------------
// USERS
// ------------------------------------------
app.get('/api/users', async (c) => {
  try {
    const [rows] = await pool.query<Users[]>('SELECT id_user, email, role, created_at, updated_at, NRP, id_dosen FROM users');
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/users/:id', async (c) => {
  try {
    const [rows] = await pool.query<Users[]>('SELECT id_user, email, role, created_at, updated_at, NRP, id_dosen FROM users WHERE id_user=?', [c.req.param('id')]);
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/users', async (c) => {
  try {
    const { email, password, role, NRP, id_dosen } = await c.req.json();
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (email, password, role, NRP, id_dosen) VALUES (?, ?, ?, ?, ?)',
      [email, password, role, NRP || null, id_dosen || null]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/users/:id', async (c) => {
  try {
    const { email, role, NRP, id_dosen } = await c.req.json();
    await pool.query(
      'UPDATE users SET email=?, role=?, NRP=?, id_dosen=? WHERE id_user=?',
      [email, role, NRP || null, id_dosen || null, c.req.param('id')]
    );
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/users/:id', async (c) => {
  try {
    await pool.query('DELETE FROM users WHERE id_user=?', [c.req.param('id')]);
    return c.json({ success: true });
  } catch (e) {
    return handleError(c, e);
  }
});
// --- SERVER START ---
const port = 5000;
console.log(`Server Cendekia berjalan di http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
