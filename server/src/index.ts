import { serve } from '@hono/node-server'
import { Hono, type Context } from 'hono'
import mysql, { type PoolConnection, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
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
  semester_ke: number;
  status_aktif: string;
  id_departemen: number;
  ipk: number;
}

interface PeriodeAktif extends RowDataPacket {
  id_periode: number;
  tahun: number;
  semester: string;
  is_aktif: number;
  updated_at: string;
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
  id_periode: number;
  id_matkul: number;
  id_kelas: number;
  id_dosen: number;
}

interface Krs extends RowDataPacket {
  id_krs: number;
  NRP: number;
  total_sks: number;
  status_krs: string;
  id_periode: number;
  ips: number;
  tanggal_pengajuan: string;
  tanggal_diproses: string | null;
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
  bobot_mutu: number;
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

const createClientError = (message: string) => {
  const error = new Error(message) as Error & { sqlState: string };
  error.sqlState = '45000';
  return error;
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
  connectionLimit: Number(getEnv('DB_CONNECTION_LIMIT', '1')),
  maxIdle: 0,
  idleTimeout: 1000,
  enableKeepAlive: false,
});

const validSemesters = new Set(['Ganjil', 'Genap']);

const calculateSemesterKe = (angkatan: number, tahun: number, semester: string) => {
  const semesterKe = semester === 'Ganjil'
    ? ((tahun - angkatan) * 2) + 1
    : ((tahun - angkatan) * 2);

  return Math.max(1, semesterKe);
};

const getActivePeriode = async (conn?: PoolConnection) => {
  const executor = conn ?? pool;
  const [rows] = await executor.query<PeriodeAktif[]>(
    `SELECT id_periode, tahun, semester, is_aktif, updated_at
     FROM periode_aktif
     WHERE is_aktif = 1
     ORDER BY id_periode DESC
     LIMIT 1`
  );

  return rows[0] ?? null;
};

const getRequiredPeriodeAktif = async (conn?: PoolConnection) => {
  const periode = await getActivePeriode(conn);

  if (!periode) {
    throw createClientError('Periode aktif belum dipilih. Set salah satu periode dengan is_aktif = 1.');
  }

  return periode;
};

const getRequiredPeriodeById = async (conn: PoolConnection, idPeriode: number) => {
  const [rows] = await conn.query<PeriodeAktif[]>(
    'SELECT id_periode, tahun, semester, is_aktif, updated_at FROM periode_aktif WHERE id_periode=?',
    [idPeriode]
  );
  const periode = rows[0];

  if (!periode) {
    throw createClientError('Periode akademik tidak ditemukan');
  }

  return periode;
};

const getSemesterKeForAngkatan = async (angkatan: number) => {
  const periode = await getActivePeriode();

  if (!periode) {
    return 1;
  }

  return calculateSemesterKe(Number(angkatan), Number(periode.tahun), periode.semester);
};

const validatePeriodeInput = (tahun: unknown, semester: unknown) => {
  const parsedTahun = Number(tahun);

  if (!Number.isInteger(parsedTahun) || parsedTahun < 2000) {
    throw createClientError('Tahun periode aktif tidak valid');
  }

  if (typeof semester !== 'string' || !validSemesters.has(semester)) {
    throw createClientError('Semester periode aktif harus Ganjil atau Genap');
  }

  return { tahun: parsedTahun, semester };
};

const parseIsAktif = (value: unknown, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback ? 1 : 0;
  }

  if (value === true || value === 1 || value === '1' || value === 'true') {
    return 1;
  }

  return 0;
};

const normalizeUserRoleLinks = (roleInput: unknown, nrpInput: unknown, idDosenInput: unknown) => {
  const validRoles = new Set(['admin', 'dosen', 'mahasiswa']);

  if (typeof roleInput !== 'string' || !validRoles.has(roleInput)) {
    throw createClientError('Role user harus admin, dosen, atau mahasiswa');
  }

  const parseOptionalId = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw createClientError('ID relasi user tidak valid');
    }

    return parsed;
  };

  if (roleInput === 'admin') {
    return { role: roleInput, NRP: null, id_dosen: null };
  }

  if (roleInput === 'mahasiswa') {
    const NRP = parseOptionalId(nrpInput);

    if (!NRP) {
      throw createClientError('User mahasiswa harus memilih NRP');
    }

    return { role: roleInput, NRP, id_dosen: null };
  }

  const id_dosen = parseOptionalId(idDosenInput);

  if (!id_dosen) {
    throw createClientError('User dosen harus memilih ID dosen');
  }

  return { role: roleInput, NRP: null, id_dosen };
};

const assertDetailKrsCanReceiveNilai = async (idDkrsInput: unknown, conn?: PoolConnection) => {
  const idDkrs = Number(idDkrsInput);

  if (!Number.isInteger(idDkrs) || idDkrs <= 0) {
    throw createClientError('ID Detail KRS tidak valid');
  }

  const executor = conn ?? pool;
  const [rows] = await executor.query<(RowDataPacket & { id_krs: number; NRP: number; status_krs: string })[]>(
    `SELECT k.id_krs, k.NRP, k.status_krs
     FROM detail_krs dk
     JOIN krs k ON dk.id_krs = k.id_krs
     WHERE dk.id_dkrs = ?
     LIMIT 1`,
    [idDkrs]
  );
  const detailKrs = rows[0];

  if (!detailKrs) {
    throw createClientError('Detail KRS tidak ditemukan');
  }

  if (detailKrs.status_krs !== 'Disetujui') {
    throw createClientError('Nilai hanya boleh diinput jika KRS sudah Disetujui');
  }

  return {
    idDkrs,
    idKrs: Number(detailKrs.id_krs),
    NRP: Number(detailKrs.NRP),
  };
};

const parseNilaiComponent = (value: unknown, label: string) => {
  if (value === null || value === undefined || value === '') {
    throw createClientError(`${label} wajib diisi`);
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    throw createClientError(`${label} harus berupa angka 0 sampai 100`);
  }

  return parsed;
};

const getHurufMutu = (nilaiAkhir: number) => {
  if (nilaiAkhir >= 86) return 'A';
  if (nilaiAkhir >= 76) return 'AB';
  if (nilaiAkhir >= 66) return 'B';
  if (nilaiAkhir >= 61) return 'BC';
  if (nilaiAkhir >= 56) return 'C';
  if (nilaiAkhir >= 41) return 'D';
  return 'E';
};

const getBobotMutu = (hurufMutu: string) => {
  const bobot: Record<string, number> = {
    A: 4,
    AB: 3.5,
    B: 3,
    BC: 2.5,
    C: 2,
    D: 1,
    E: 0,
  };

  return bobot[hurufMutu] ?? 0;
};

const bobotMutuSql = `
  CASE n.huruf_mutu
    WHEN 'A' THEN 4.00
    WHEN 'AB' THEN 3.50
    WHEN 'B' THEN 3.00
    WHEN 'BC' THEN 2.50
    WHEN 'C' THEN 2.00
    WHEN 'D' THEN 1.00
    ELSE 0.00
  END
`;

const getStatusMatkulFromHuruf = (hurufMutu: string) => (
  ['A', 'AB', 'B', 'BC', 'C'].includes(hurufMutu) ? 'Lulus' : 'Mengulang'
);

const calculateNilaiResult = (
  nilaiTugasInput: unknown,
  nilaiEtsInput: unknown,
  nilaiEasInput: unknown
) => {
  const nilai_tugas = parseNilaiComponent(nilaiTugasInput, 'Nilai tugas');
  const nilai_ETS = parseNilaiComponent(nilaiEtsInput, 'Nilai ETS');
  const nilai_EAS = parseNilaiComponent(nilaiEasInput, 'Nilai EAS');
  const nilai_akhir = Math.round((nilai_tugas * 0.2) + (nilai_ETS * 0.35) + (nilai_EAS * 0.45));
  const huruf_mutu = getHurufMutu(nilai_akhir);
  const bobot_mutu = getBobotMutu(huruf_mutu);
  const status_matkul = getStatusMatkulFromHuruf(huruf_mutu);

  return { nilai_tugas, nilai_ETS, nilai_EAS, nilai_akhir, huruf_mutu, bobot_mutu, status_matkul };
};

const recalculateAcademicIndexesForKrs = async (
  conn: PoolConnection,
  idKrs: number,
  nrp: number
) => {
  await conn.query(
    `UPDATE nilai n
     JOIN detail_krs dk ON dk.id_dkrs = n.id_dkrs
     JOIN krs k ON k.id_krs = dk.id_krs
     SET n.bobot_mutu = ${bobotMutuSql}
     WHERE k.NRP = ?`,
    [nrp]
  );

  await conn.query(
    `UPDATE krs target_krs
     SET target_krs.ips = COALESCE((
       SELECT ROUND(SUM(n.bobot_mutu * mk.sks) / NULLIF(SUM(mk.sks), 0), 2)
       FROM detail_krs dk
       JOIN nilai n ON n.id_dkrs = dk.id_dkrs
       JOIN jadwal j ON j.id_jadwal = dk.id_jadwal
       JOIN mata_kuliah mk ON mk.id_matkul = j.id_matkul
       WHERE dk.id_krs = target_krs.id_krs
     ), 0)
     WHERE target_krs.id_krs = ?`,
    [idKrs]
  );

  await conn.query(
    `UPDATE mahasiswa target_mhs
     SET target_mhs.ipk = COALESCE((
       SELECT ROUND(SUM(n.bobot_mutu * mk.sks) / NULLIF(SUM(mk.sks), 0), 2)
       FROM krs k
       JOIN detail_krs dk ON dk.id_krs = k.id_krs
       JOIN nilai n ON n.id_dkrs = dk.id_dkrs
       JOIN jadwal j ON j.id_jadwal = dk.id_jadwal
       JOIN mata_kuliah mk ON mk.id_matkul = j.id_matkul
       WHERE k.NRP = target_mhs.NRP
     ), 0)
     WHERE target_mhs.NRP = ?`,
    [nrp]
  );
};

const recalculateAcademicIndexesFromDetail = async (
  conn: PoolConnection,
  idDkrs: number
) => {
  const [rows] = await conn.query<(RowDataPacket & { id_krs: number; NRP: number })[]>(
    `SELECT dk.id_krs, k.NRP
     FROM detail_krs dk
     JOIN krs k ON k.id_krs = dk.id_krs
     WHERE dk.id_dkrs = ?
     LIMIT 1`,
    [idDkrs]
  );
  const context = rows[0];

  if (!context) {
    return;
  }

  await recalculateAcademicIndexesForKrs(conn, Number(context.id_krs), Number(context.NRP));
};

const updateMahasiswaSemesterKe = async (
  conn: PoolConnection,
  tahun: number,
  semester: string
) => {
  const semesterOffset = semester === 'Ganjil' ? 1 : 0;
  const [result] = await conn.query<ResultSetHeader>(
    `UPDATE mahasiswa
     SET semester_ke = GREATEST(((? - CAST(angkatan AS UNSIGNED)) * 2) + ?, 1)`,
    [tahun, semesterOffset]
  );

  return result.affectedRows;
};

const updateMahasiswaStatusFromKrs = async (
  conn: PoolConnection,
  nrp: number,
  statusKrs: string
) => {
  if (statusKrs === 'Diajukan') {
    await conn.query(
      `UPDATE mahasiswa
       SET status_aktif = 'Nonaktif'
       WHERE NRP = ?
         AND status_aktif NOT IN ('Lulus', 'DO')`,
      [nrp]
    );
    return;
  }

  if (statusKrs === 'Disetujui') {
    await conn.query(
      `UPDATE mahasiswa
       SET status_aktif = 'Aktif'
       WHERE NRP = ?
         AND status_aktif NOT IN ('Lulus', 'DO')`,
      [nrp]
    );
  }
};

const savePeriodeAktif = async (
  tahunInput: unknown,
  semesterInput: unknown,
  isAktifInput: unknown,
  id?: string
) => {
  const { tahun, semester } = validatePeriodeInput(tahunInput, semesterInput);
  let isAktif = parseIsAktif(isAktifInput, !id);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let periodeId = id ? Number(id) : null;

    const [activeRows] = await conn.query<PeriodeAktif[]>(
      'SELECT id_periode FROM periode_aktif WHERE is_aktif = 1 LIMIT 1'
    );

    if (!activeRows[0]) {
      isAktif = 1;
    }

    if (periodeId && isAktif === 0 && Number(activeRows[0]?.id_periode) === periodeId) {
      throw createClientError('Harus ada satu periode aktif. Aktifkan periode lain sebelum menonaktifkan periode ini.');
    }

    if (periodeId) {
      const [result] = await conn.query<ResultSetHeader>(
        'UPDATE periode_aktif SET tahun=?, semester=?, is_aktif=?, updated_at=CURRENT_TIMESTAMP WHERE id_periode=?',
        [tahun, semester, isAktif, periodeId]
      );

      if (result.affectedRows === 0) {
        throw createClientError('Periode aktif tidak ditemukan');
      }
    } else {
      const [result] = await conn.query<ResultSetHeader>(
        'INSERT INTO periode_aktif (tahun, semester, is_aktif, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [tahun, semester, isAktif]
      );
      periodeId = result.insertId;
    }

    if (isAktif === 1) {
      await conn.query(
        'UPDATE periode_aktif SET is_aktif = 0 WHERE id_periode <> ?',
        [periodeId]
      );
    }

    const updatedMahasiswa = isAktif === 1
      ? await updateMahasiswaSemesterKe(conn, tahun, semester)
      : 0;

    await conn.commit();

    return { id: periodeId, is_aktif: isAktif, updatedMahasiswa };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

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
// PERIODE AKTIF
// ------------------------------------------
app.get('/api/periodeaktif', async (c) => {
  try {
    const [rows] = await pool.query<PeriodeAktif[]>(
      `SELECT id_periode, tahun, semester, is_aktif, updated_at
       FROM periode_aktif
       ORDER BY is_aktif DESC, tahun DESC, FIELD(semester, 'Genap', 'Ganjil'), id_periode DESC`
    );
    return c.json(rows);
  } catch (e) {
    return handleError(c, e);
  }
});

app.get('/api/periodeaktif/:id', async (c) => {
  try {
    const [rows] = await pool.query<PeriodeAktif[]>(
      'SELECT id_periode, tahun, semester, is_aktif, updated_at FROM periode_aktif WHERE id_periode=?',
      [c.req.param('id')]
    );
    return c.json(rows[0] || null);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post('/api/periodeaktif', async (c) => {
  try {
    const { tahun, semester, is_aktif } = await c.req.json();
    const result = await savePeriodeAktif(tahun, semester, is_aktif);
    return c.json({ success: true, ...result }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/periodeaktif/:id', async (c) => {
  try {
    const { tahun, semester, is_aktif } = await c.req.json();
    const result = await savePeriodeAktif(tahun, semester, is_aktif, c.req.param('id'));
    return c.json({ success: true, ...result });
  } catch (e) {
    return handleError(c, e);
  }
});

app.delete('/api/periodeaktif/:id', async (c) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<PeriodeAktif[]>(
      'SELECT id_periode, is_aktif FROM periode_aktif WHERE id_periode=?',
      [c.req.param('id')]
    );
    const periode = rows[0];

    await conn.query('DELETE FROM periode_aktif WHERE id_periode=?', [c.req.param('id')]);

    if (periode?.is_aktif === 1) {
      const [nextRows] = await conn.query<PeriodeAktif[]>(
        'SELECT id_periode, tahun, semester FROM periode_aktif ORDER BY id_periode DESC LIMIT 1'
      );
      const nextPeriode = nextRows[0];

      if (nextPeriode) {
        await conn.query('UPDATE periode_aktif SET is_aktif = 1 WHERE id_periode=?', [nextPeriode.id_periode]);
        await updateMahasiswaSemesterKe(conn, Number(nextPeriode.tahun), nextPeriode.semester);
      }
    }

    await conn.commit();

    return c.json({ success: true });
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
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
    const { nama_mahasiswa, angkatan, id_departemen } = await c.req.json();
    const semester_ke = await getSemesterKeForAngkatan(Number(angkatan));
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO mahasiswa (nama_mahasiswa, angkatan, semester_ke, id_departemen) VALUES (?, ?, ?, ?)',
      [nama_mahasiswa, angkatan, semester_ke, id_departemen]
    );
    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/mahasiswa/:id', async (c) => {
  try {
    const { nama_mahasiswa, angkatan, id_departemen } = await c.req.json();
    const semester_ke = await getSemesterKeForAngkatan(Number(angkatan));
    await pool.query(
      'UPDATE mahasiswa SET nama_mahasiswa=?, angkatan=?, semester_ke=?, id_departemen=? WHERE NRP=?',
      [nama_mahasiswa, angkatan, semester_ke, id_departemen, c.req.param('id')]
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
    const { hari, jam_mulai, jam_selesai, id_matkul, id_kelas, id_dosen } = await c.req.json();
    const periode = await getRequiredPeriodeAktif();
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO jadwal
       (hari, jam_mulai, jam_selesai, id_periode, id_matkul, id_kelas, id_dosen)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [hari, jam_mulai, jam_selesai, periode.id_periode, id_matkul, id_kelas, id_dosen]
    );
    return c.json({ success: true, id: res.insertId, id_periode: periode.id_periode }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/jadwal/:id', async (c) => {
  const conn = await pool.getConnection();

  try {
    const { hari, jam_mulai, jam_selesai, id_matkul, id_kelas, id_dosen } = await c.req.json();

    await conn.beginTransaction();

    const [rows] = await conn.query<Jadwal[]>('SELECT id_periode FROM jadwal WHERE id_jadwal=?', [c.req.param('id')]);
    const jadwal = rows[0];

    if (!jadwal) {
      throw createClientError('Jadwal tidak ditemukan');
    }

    const periode = jadwal.id_periode
      ? await getRequiredPeriodeById(conn, Number(jadwal.id_periode))
      : await getRequiredPeriodeAktif(conn);

    await conn.query(
      `UPDATE jadwal
       SET hari=?,
           jam_mulai=?,
           jam_selesai=?,
           id_periode=?,
           id_matkul=?,
           id_kelas=?,
           id_dosen=?
       WHERE id_jadwal=?`,
      [
        hari,
        jam_mulai,
        jam_selesai,
        periode.id_periode,
        id_matkul,
        id_kelas,
        id_dosen,
        c.req.param('id'),
      ]
    );

    await conn.commit();

    return c.json({ success: true, id_periode: periode.id_periode });
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
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
  const conn = await pool.getConnection();

  try {
    const { NRP, status_krs } = await c.req.json();
    const statusKrs = status_krs || 'Diajukan';

    await conn.beginTransaction();

    const periode = await getRequiredPeriodeAktif(conn);
    const [existing] = await conn.query<Krs[]>(
      'SELECT id_krs FROM krs WHERE NRP=? AND id_periode=? LIMIT 1',
      [NRP, periode.id_periode]
    );

    if (existing[0]) {
      throw createClientError('Mahasiswa ini sudah memiliki KRS untuk periode aktif');
    }

    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO krs
       (NRP, total_sks, status_krs, id_periode, tanggal_pengajuan, tanggal_diproses)
       VALUES (?, ?, ?, ?, NULL, NULL)`,
      [NRP, 0, statusKrs, periode.id_periode]
    );

    await conn.commit();

    return c.json({
      success: true,
      id: res.insertId,
      id_periode: periode.id_periode,
    }, 201);
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
  }
});

app.put('/api/krs/:id', async (c) => {
  const conn = await pool.getConnection();

  try {
    const { NRP, status_krs } = await c.req.json();

    await conn.beginTransaction();

    const [rows] = await conn.query<Krs[]>(
      'SELECT id_krs, id_periode FROM krs WHERE id_krs=?',
      [c.req.param('id')]
    );
    const krs = rows[0];

    if (!krs) {
      throw createClientError('KRS tidak ditemukan');
    }

    const periode = krs.id_periode
      ? await getRequiredPeriodeById(conn, Number(krs.id_periode))
      : await getRequiredPeriodeAktif(conn);
    const [duplicate] = await conn.query<Krs[]>(
      'SELECT id_krs FROM krs WHERE NRP=? AND id_periode=? AND id_krs<>? LIMIT 1',
      [NRP, periode.id_periode, c.req.param('id')]
    );

    if (duplicate[0]) {
      throw createClientError('Mahasiswa ini sudah memiliki KRS untuk periode tersebut');
    }

    await conn.query(
      `UPDATE krs
       SET tanggal_diproses = CASE
             WHEN status_krs <> ? AND ? IN ('Disetujui', 'Ditolak') THEN CURRENT_TIMESTAMP
             WHEN ? = 'Diajukan' THEN NULL
             ELSE tanggal_diproses
           END,
           NRP=?,
           status_krs=?,
           id_periode=?
       WHERE id_krs=?`,
      [
        status_krs,
        status_krs,
        status_krs,
        NRP,
        status_krs,
        periode.id_periode,
        c.req.param('id'),
      ]
    );

    await updateMahasiswaStatusFromKrs(conn, Number(NRP), status_krs);
    await conn.commit();

    return c.json({
      success: true,
      id_periode: periode.id_periode,
    });
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
  }
});

app.put('/api/krs/:id/cuti', async (c) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<Krs[]>('SELECT NRP FROM krs WHERE id_krs=?', [c.req.param('id')]);
    const krs = rows[0];

    if (!krs) {
      throw createClientError('KRS tidak ditemukan');
    }

    await conn.query(
      `UPDATE mahasiswa
       SET status_aktif = 'Cuti'
       WHERE NRP = ?
         AND status_aktif NOT IN ('Lulus', 'DO')`,
      [krs.NRP]
    );

    await conn.commit();

    return c.json({ success: true, NRP: krs.NRP });
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
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

app.get('/api/detailkrs/disetujui', async (c) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT dk.id_dkrs,
              dk.status_matkul,
              dk.id_krs,
              dk.id_jadwal,
              k.NRP,
              k.status_krs,
              mk.nama_matkul
       FROM detail_krs dk
       JOIN krs k ON dk.id_krs = k.id_krs
       JOIN jadwal j ON dk.id_jadwal = j.id_jadwal
       JOIN mata_kuliah mk ON j.id_matkul = mk.id_matkul
       LEFT JOIN nilai n ON n.id_dkrs = dk.id_dkrs
       WHERE k.status_krs = 'Disetujui'
         AND n.id_nilai IS NULL
       ORDER BY dk.id_dkrs DESC`
    );
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
  const conn = await pool.getConnection();

  try {
    const { status_matkul = 'Aktif', id_krs, id_jadwal } = await c.req.json();

    await conn.beginTransaction();

    const [krsRows] = await conn.query<Krs[]>('SELECT id_krs, id_periode FROM krs WHERE id_krs=?', [id_krs]);
    const [jadwalRows] = await conn.query<Jadwal[]>('SELECT id_jadwal, id_periode FROM jadwal WHERE id_jadwal=?', [id_jadwal]);
    const krs = krsRows[0];
    const jadwal = jadwalRows[0];

    if (!krs) {
      throw createClientError('KRS tidak ditemukan');
    }

    if (!jadwal) {
      throw createClientError('Jadwal tidak ditemukan');
    }

    if (Number(krs.id_periode) !== Number(jadwal.id_periode)) {
      throw createClientError('Jadwal harus berasal dari periode yang sama dengan KRS');
    }

    const [existing] = await conn.query<DetailKrs[]>(
      'SELECT id_dkrs FROM detail_krs WHERE id_krs=? AND id_jadwal=? LIMIT 1',
      [id_krs, id_jadwal]
    );

    if (existing[0]) {
      throw createClientError('Jadwal ini sudah ada di detail KRS tersebut');
    }

    const [res] = await conn.query<ResultSetHeader>(
      'INSERT INTO detail_krs (status_matkul, id_krs, id_jadwal) VALUES (?, ?, ?)',
      [status_matkul, id_krs, id_jadwal]
    );

    await conn.query(
      `UPDATE krs
       SET tanggal_pengajuan = COALESCE(tanggal_pengajuan, CURRENT_TIMESTAMP)
       WHERE id_krs = ?`,
      [id_krs]
    );

    await conn.query(
      `UPDATE mahasiswa m
       JOIN krs k ON k.NRP = m.NRP
       SET m.status_aktif = 'Nonaktif'
       WHERE k.id_krs = ?
         AND k.status_krs = 'Diajukan'
         AND m.status_aktif NOT IN ('Lulus', 'DO')`,
      [id_krs]
    );

    await conn.commit();

    return c.json({ success: true, id: res.insertId }, 201);
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
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
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<(RowDataPacket & { id_krs: number; NRP: number })[]>(
      `SELECT dk.id_krs, k.NRP
       FROM detail_krs dk
       JOIN krs k ON k.id_krs = dk.id_krs
       WHERE dk.id_dkrs = ?
       LIMIT 1`,
      [c.req.param('id')]
    );
    const context = rows[0];

    await conn.query('DELETE FROM detail_krs WHERE id_dkrs=?', [c.req.param('id')]);

    if (context) {
      await recalculateAcademicIndexesForKrs(conn, Number(context.id_krs), Number(context.NRP));
    }

    await conn.commit();

    return c.json({ success: true });
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
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
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { nilai_tugas, nilai_ETS, nilai_EAS, id_dkrs } = await c.req.json();
    const detail = await assertDetailKrsCanReceiveNilai(id_dkrs, conn);
    const nilai = calculateNilaiResult(nilai_tugas, nilai_ETS, nilai_EAS);
    const [existing] = await conn.query<Nilai[]>(
      'SELECT id_nilai FROM nilai WHERE id_dkrs=? LIMIT 1',
      [detail.idDkrs]
    );

    if (existing[0]) {
      throw createClientError('Detail KRS ini sudah memiliki nilai');
    }

    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO nilai
       (nilai_tugas, nilai_ETS, nilai_EAS, nilai_akhir, huruf_mutu, id_dkrs, bobot_mutu)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nilai.nilai_tugas,
        nilai.nilai_ETS,
        nilai.nilai_EAS,
        nilai.nilai_akhir,
        nilai.huruf_mutu,
        detail.idDkrs,
        nilai.bobot_mutu,
      ]
    );

    await conn.query(
      'UPDATE detail_krs SET status_matkul=? WHERE id_dkrs=?',
      [nilai.status_matkul, detail.idDkrs]
    );
    await recalculateAcademicIndexesForKrs(conn, detail.idKrs, detail.NRP);
    await conn.commit();

    return c.json({ success: true, id: res.insertId, ...nilai }, 201);
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
  }
});

app.put('/api/nilai/:id', async (c) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { nilai_tugas, nilai_ETS, nilai_EAS } = await c.req.json();
    const [rows] = await conn.query<Nilai[]>('SELECT id_dkrs FROM nilai WHERE id_nilai=?', [c.req.param('id')]);
    const existingNilai = rows[0];

    if (!existingNilai) {
      throw createClientError('Nilai tidak ditemukan');
    }

    const detail = await assertDetailKrsCanReceiveNilai(existingNilai.id_dkrs, conn);
    const nilai = calculateNilaiResult(nilai_tugas, nilai_ETS, nilai_EAS);

    await conn.query(
      `UPDATE nilai
       SET nilai_tugas=?,
           nilai_ETS=?,
           nilai_EAS=?,
           nilai_akhir=?,
           huruf_mutu=?,
           bobot_mutu=?
       WHERE id_nilai=?`,
      [
        nilai.nilai_tugas,
        nilai.nilai_ETS,
        nilai.nilai_EAS,
        nilai.nilai_akhir,
        nilai.huruf_mutu,
        nilai.bobot_mutu,
        c.req.param('id'),
      ]
    );

    await conn.query(
      'UPDATE detail_krs SET status_matkul=? WHERE id_dkrs=?',
      [nilai.status_matkul, detail.idDkrs]
    );
    await recalculateAcademicIndexesForKrs(conn, detail.idKrs, detail.NRP);
    await conn.commit();

    return c.json({ success: true, ...nilai });
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
  }
});

app.delete('/api/nilai/:id', async (c) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<Nilai[]>('SELECT id_dkrs FROM nilai WHERE id_nilai=?', [c.req.param('id')]);
    const nilai = rows[0];

    if (!nilai) {
      throw createClientError('Nilai tidak ditemukan');
    }

    await conn.query('DELETE FROM nilai WHERE id_nilai=?', [c.req.param('id')]);
    await conn.query('UPDATE detail_krs SET status_matkul=? WHERE id_dkrs=?', ['Aktif', nilai.id_dkrs]);
    await recalculateAcademicIndexesFromDetail(conn, Number(nilai.id_dkrs));
    await conn.commit();

    return c.json({ success: true });
  } catch (e) {
    await conn.rollback();
    return handleError(c, e);
  } finally {
    conn.release();
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
    const userLinks = normalizeUserRoleLinks(role, NRP, id_dosen);
    const [nextRows] = await pool.query<(RowDataPacket & { next_id: number })[]>(
      'SELECT COALESCE(MAX(id_user), 0) + 1 AS next_id FROM users'
    );
    const nextId = Number(nextRows[0]?.next_id ?? 1);
    const [res] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (id_user, email, password, role, NRP, id_dosen) VALUES (?, ?, ?, ?, ?, ?)',
      [nextId, email, password, userLinks.role, userLinks.NRP, userLinks.id_dosen]
    );
    return c.json({ success: true, id: res.insertId || nextId }, 201);
  } catch (e) {
    return handleError(c, e);
  }
});

app.put('/api/users/:id', async (c) => {
  try {
    const { email, role, NRP, id_dosen } = await c.req.json();
    const userLinks = normalizeUserRoleLinks(role, NRP, id_dosen);
    await pool.query(
      'UPDATE users SET email=?, role=?, NRP=?, id_dosen=? WHERE id_user=?',
      [email, userLinks.role, userLinks.NRP, userLinks.id_dosen, c.req.param('id')]
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
