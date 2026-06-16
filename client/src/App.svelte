<script lang="ts">
  import { onMount } from 'svelte'

  type Role = 'admin' | 'dosen' | 'mahasiswa'
  type DataValue = string | number | null
  type DataRow = Record<string, DataValue>
  type FormData = Record<string, DataValue>
  type FormMode = 'create' | 'edit'

  type UserSession = {
    id_user: number
    email: string
    role: Role
    NRP: number | null
    id_dosen: number | null
  }

  type ReferenceConfig = {
    endpoint: string
    valueField: string
    labelFields: string[]
  }

  type Field = {
    name: string
    label: string
    type?: string
    options?: string[]
    nullable?: boolean
    reference?: ReferenceConfig
  }

  type Resource = {
    key: string
    label: string
    endpoint: string
    idField: string
    fields: Field[]
    createFields: string[]
    updateFields: string[]
    extraFields?: Field[]
  }

  type ReferenceOption = {
    value: string | number
    label: string
  }

  type NavItem = {
    key: string
    label: string
  }

  const semesterOptions = ['Ganjil', 'Genap']
  const statusAktifOptions = ['Aktif', 'Cuti', 'Nonaktif', 'Lulus', 'DO']
  const statusKrsOptions = ['Diajukan', 'Disetujui', 'Ditolak']
  const statusMatkulOptions = ['Aktif', 'Lulus', 'Mengulang']
  const roleOptions = ['admin', 'dosen', 'mahasiswa']
  const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']

  const periodeReference: ReferenceConfig = {
    endpoint: '/api/periodeaktif',
    valueField: 'id_periode',
    labelFields: ['id_periode', 'tahun', 'semester'],
  }

  const departemenReference: ReferenceConfig = {
    endpoint: '/api/departemen',
    valueField: 'id_departemen',
    labelFields: ['id_departemen', 'nama_departemen'],
  }

  const mahasiswaReference: ReferenceConfig = {
    endpoint: '/api/mahasiswa',
    valueField: 'NRP',
    labelFields: ['NRP', 'nama_mahasiswa'],
  }

  const dosenReference: ReferenceConfig = {
    endpoint: '/api/dosen',
    valueField: 'id_dosen',
    labelFields: ['id_dosen', 'nama_dosen'],
  }

  const mataKuliahReference: ReferenceConfig = {
    endpoint: '/api/matakuliah',
    valueField: 'id_matkul',
    labelFields: ['id_matkul', 'nama_matkul'],
  }

  const kelasReference: ReferenceConfig = {
    endpoint: '/api/kelas',
    valueField: 'id_kelas',
    labelFields: ['id_kelas', 'nama_kelas'],
  }

  const jadwalReference: ReferenceConfig = {
    endpoint: '/api/jadwal',
    valueField: 'id_jadwal',
    labelFields: ['id_jadwal', 'hari', 'jam_mulai', 'jam_selesai'],
  }

  const krsReference: ReferenceConfig = {
    endpoint: '/api/krs',
    valueField: 'id_krs',
    labelFields: ['id_krs', 'NRP', 'id_periode', 'status_krs'],
  }

  const detailKrsReference: ReferenceConfig = {
    endpoint: '/api/detailkrs/disetujui',
    valueField: 'id_dkrs',
    labelFields: ['id_dkrs', 'NRP', 'nama_matkul', 'tahun', 'semester', 'status_krs'],
  }

  const resources: Resource[] = [
    {
      key: 'mahasiswa',
      label: 'Mahasiswa',
      endpoint: '/api/mahasiswa',
      idField: 'NRP',
      fields: [
        { name: 'NRP', label: 'NRP', type: 'number' },
        { name: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
        { name: 'angkatan', label: 'Angkatan', type: 'number' },
        { name: 'semester_ke', label: 'Semester Ke', type: 'number' },
        { name: 'status_aktif', label: 'Status Aktif', options: statusAktifOptions },
        { name: 'id_departemen', label: 'Departemen', type: 'number', reference: departemenReference },
        { name: 'id_dosen_wali', label: 'Dosen Wali', type: 'number', nullable: true, reference: dosenReference },
        { name: 'ipk', label: 'IPK', type: 'number' },
      ],
      createFields: ['NRP', 'nama_mahasiswa', 'angkatan', 'id_departemen', 'id_dosen_wali'],
      updateFields: ['nama_mahasiswa', 'angkatan', 'id_departemen', 'id_dosen_wali'],
    },
    {
      key: 'dosen',
      label: 'Dosen',
      endpoint: '/api/dosen',
      idField: 'id_dosen',
      fields: [
        { name: 'id_dosen', label: 'ID', type: 'number' },
        { name: 'nama_dosen', label: 'Nama Dosen' },
        { name: 'jabatan_akademik', label: 'Jabatan Akademik' },
        { name: 'id_departemen', label: 'Departemen', type: 'number', reference: departemenReference },
      ],
      createFields: ['nama_dosen', 'jabatan_akademik', 'id_departemen'],
      updateFields: ['nama_dosen', 'jabatan_akademik', 'id_departemen'],
    },
    {
      key: 'jadwal',
      label: 'Jadwal Kuliah',
      endpoint: '/api/jadwal',
      idField: 'id_jadwal',
      fields: [
        { name: 'id_jadwal', label: 'ID', type: 'number' },
        { name: 'hari', label: 'Hari', options: hariOptions },
        { name: 'jam_mulai', label: 'Jam Mulai', type: 'time' },
        { name: 'jam_selesai', label: 'Jam Selesai', type: 'time' },
        { name: 'id_periode', label: 'Periode', type: 'number', reference: periodeReference },
        { name: 'id_matkul', label: 'Mata Kuliah', reference: mataKuliahReference },
        { name: 'id_kelas', label: 'Kelas', type: 'number', reference: kelasReference },
        { name: 'id_dosen', label: 'Dosen', type: 'number', reference: dosenReference },
      ],
      createFields: ['hari', 'jam_mulai', 'jam_selesai', 'id_matkul', 'id_kelas', 'id_dosen'],
      updateFields: ['hari', 'jam_mulai', 'jam_selesai', 'id_matkul', 'id_kelas', 'id_dosen'],
    },
    {
      key: 'mata_kuliah',
      label: 'Mata Kuliah',
      endpoint: '/api/matakuliah',
      idField: 'id_matkul',
      fields: [
        { name: 'id_matkul', label: 'ID Mata Kuliah' },
        { name: 'nama_matkul', label: 'Nama Mata Kuliah' },
        { name: 'sks', label: 'SKS', type: 'number' },
        { name: 'id_departemen', label: 'Departemen', type: 'number', reference: departemenReference },
      ],
      createFields: ['id_matkul', 'nama_matkul', 'sks', 'id_departemen'],
      updateFields: ['nama_matkul', 'sks', 'id_departemen'],
    },
    {
      key: 'krs',
      label: 'KRS',
      endpoint: '/api/krs',
      idField: 'id_krs',
      fields: [
        { name: 'id_krs', label: 'ID', type: 'number' },
        { name: 'NRP', label: 'NRP', type: 'number', reference: mahasiswaReference },
        { name: 'total_sks', label: 'Total SKS', type: 'number' },
        { name: 'ips', label: 'IPS', type: 'number' },
        { name: 'status_krs', label: 'Status KRS', options: statusKrsOptions },
        { name: 'id_periode', label: 'Periode', type: 'number', reference: periodeReference },
        { name: 'tanggal_pengajuan', label: 'Tanggal Pengajuan' },
        { name: 'tanggal_diproses', label: 'Tanggal Diproses' },
      ],
      createFields: ['NRP'],
      updateFields: ['NRP', 'status_krs'],
    },
    {
      key: 'departemen',
      label: 'Departemen',
      endpoint: '/api/departemen',
      idField: 'id_departemen',
      fields: [
        { name: 'id_departemen', label: 'ID', type: 'number' },
        { name: 'nama_departemen', label: 'Nama Departemen' },
        { name: 'kepala_departemen', label: 'Kepala Departemen' },
      ],
      createFields: ['nama_departemen', 'kepala_departemen'],
      updateFields: ['nama_departemen', 'kepala_departemen'],
    },
    {
      key: 'nilai',
      label: 'Nilai',
      endpoint: '/api/nilai',
      idField: 'id_nilai',
      fields: [
        { name: 'id_nilai', label: 'ID', type: 'number' },
        { name: 'nilai_tugas', label: 'Tugas', type: 'number' },
        { name: 'nilai_ETS', label: 'ETS', type: 'number' },
        { name: 'nilai_EAS', label: 'EAS', type: 'number' },
        { name: 'nilai_akhir', label: 'Akhir', type: 'number' },
        { name: 'huruf_mutu', label: 'Huruf Mutu' },
        { name: 'id_dkrs', label: 'Detail KRS', type: 'number', reference: detailKrsReference },
        { name: 'bobot_mutu', label: 'Bobot Mutu', type: 'number' },
      ],
      createFields: ['nilai_tugas', 'nilai_ETS', 'nilai_EAS', 'id_dkrs'],
      updateFields: ['nilai_tugas', 'nilai_ETS', 'nilai_EAS'],
    },
    {
      key: 'kelas',
      label: 'Kelas',
      endpoint: '/api/kelas',
      idField: 'id_kelas',
      fields: [
        { name: 'id_kelas', label: 'ID', type: 'number' },
        { name: 'nama_kelas', label: 'Nama Kelas' },
        { name: 'kapasitas_kelas', label: 'Kapasitas', type: 'number' },
      ],
      createFields: ['nama_kelas', 'kapasitas_kelas'],
      updateFields: ['nama_kelas', 'kapasitas_kelas'],
    },
    {
      key: 'periode_aktif',
      label: 'Periode Aktif',
      endpoint: '/api/periodeaktif',
      idField: 'id_periode',
      fields: [
        { name: 'id_periode', label: 'ID', type: 'number' },
        { name: 'tahun', label: 'Tahun', type: 'number' },
        { name: 'semester', label: 'Semester', options: semesterOptions },
        { name: 'is_aktif', label: 'Aktif', type: 'checkbox' },
        { name: 'updated_at', label: 'Updated At' },
      ],
      createFields: ['tahun', 'semester', 'is_aktif'],
      updateFields: ['tahun', 'semester', 'is_aktif'],
    },
    {
      key: 'users',
      label: 'Users',
      endpoint: '/api/users',
      idField: 'id_user',
      fields: [
        { name: 'id_user', label: 'ID', type: 'number' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'role', label: 'Role', options: roleOptions },
        { name: 'created_at', label: 'Created At' },
        { name: 'updated_at', label: 'Updated At' },
        { name: 'NRP', label: 'NRP', type: 'number', nullable: true, reference: mahasiswaReference },
        { name: 'id_dosen', label: 'NIP', type: 'number', nullable: true, reference: dosenReference },
      ],
      createFields: ['email', 'password', 'role', 'NRP', 'id_dosen'],
      updateFields: ['email', 'role', 'NRP', 'id_dosen'],
      extraFields: [{ name: 'password', label: 'Password', type: 'password' }],
    },
  ]

  const adminNav: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'mahasiswa', label: 'Mahasiswa' },
    { key: 'dosen', label: 'Dosen' },
    { key: 'departemen', label: 'Departemen' },
    { key: 'mata_kuliah', label: 'Mata Kuliah' },
    { key: 'jadwal', label: 'Jadwal Kuliah' },
    { key: 'krs', label: 'KRS' },
    { key: 'nilai', label: 'Nilai' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'periode_aktif', label: 'Periode Aktif' },
    { key: 'users', label: 'Users' },
  ]

  const dosenNav: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'mahasiswa_wali', label: 'Daftar Mahasiswa' },
    { key: 'jadwal_mengajar', label: 'Jadwal Mengajar' },
    { key: 'rekap_nilai', label: 'Rekap Nilai' },
    { key: 'krs_dosen', label: 'KRS' },
  ]

  const mahasiswaNav: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'krs_mahasiswa', label: 'KRS' },
    { key: 'jadwal_mahasiswa', label: 'Jadwal Kuliah' },
    { key: 'transkrip', label: 'Transkrip & IPK' },
    { key: 'riwayat', label: 'Riwayat Studi' },
  ]

  const collections = [
    { key: 'departemen', endpoint: '/api/departemen' },
    { key: 'mahasiswa', endpoint: '/api/mahasiswa' },
    { key: 'dosen', endpoint: '/api/dosen' },
    { key: 'mata_kuliah', endpoint: '/api/matakuliah' },
    { key: 'kelas', endpoint: '/api/kelas' },
    { key: 'jadwal', endpoint: '/api/jadwal' },
    { key: 'krs', endpoint: '/api/krs' },
    { key: 'detail_krs', endpoint: '/api/detailkrs' },
    { key: 'nilai', endpoint: '/api/nilai' },
    { key: 'periode_aktif', endpoint: '/api/periodeaktif' },
    { key: 'users', endpoint: '/api/users' },
    { key: 'activities', endpoint: '/api/activities' },
  ]

  let currentUser: UserSession | null = null
  let selectedKey = 'dashboard'
  let rows: DataRow[] = []
  let formData: FormData = {}
  let formMode: FormMode = 'create'
  let editingRow: DataRow | null = null
  let searchTerm = ''
  let isLoading = false
  let isSaving = false
  let errorMessage = ''
  let successMessage = ''
  let isInitialDataLoading = true
  let mahasiswaDepartemenFilter: DataValue = ''
  let mahasiswaAngkatanFilter: DataValue = ''
  let dosenDepartemenFilter: DataValue = ''
  let mataKuliahDepartemenFilter: DataValue = ''
  let jadwalDepartemenFilter: DataValue = ''
  let jadwalPeriodeFilter: DataValue = ''
  let referenceOptions: Record<string, ReferenceOption[]> = {}
  let allData: Record<string, DataRow[]> = {}
  let dataVersion = 0
  let loginForm = { email: '', password: '' }
  let selectedKrsNrp: DataValue = null
  let isKrsEditMode = false
  let selectedJadwalId: DataValue = ''
  let selectedKrsOverride: DataRow | null = null
  let selectedNilaiMatkulId: DataValue = ''
  let editingNilaiDetail: DataRow | null = null
  let nilaiFormData: FormData = {}
  let isLogoutDialogOpen = false

  const getResource = (key: string) => resources.find((item) => item.key === key) ?? null
  const getCollection = (key: string) => allData[key] ?? []

  $: resource = getResource(selectedKey)
  $: activeFields = resource ? getActiveFields(resource, formMode, formData.role) : []
  $: filteredRows = resource
    ? getFilteredRows(resource, rows, searchTerm, mahasiswaDepartemenFilter, mahasiswaAngkatanFilter, dosenDepartemenFilter, mataKuliahDepartemenFilter, jadwalDepartemenFilter, jadwalPeriodeFilter, dataVersion)
    : []
  $: activePeriode = getActivePeriode(dataVersion)
  $: syncSelectedNilaiMatkul(dataVersion, selectedKey, currentUser?.role)
  $: navItems = currentUser?.role === 'dosen'
    ? dosenNav
    : currentUser?.role === 'mahasiswa'
      ? mahasiswaNav
      : adminNav

  onMount(() => {
    loadInitialData()
  })

  async function readResponse(response: Response) {
    const text = await response.text()
    return text ? JSON.parse(text) : null
  }

  async function fetchJson(endpoint: string) {
    const response = await fetch(endpoint, { cache: 'no-store' })
    const data = await readResponse(response)

    if (!response.ok) {
      throw new Error(data?.error ?? 'Failed to load data')
    }

    return data
  }

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  async function loadInitialData() {
    isInitialDataLoading = true
    await loadAllData({ retries: 3 })
    isInitialDataLoading = false
  }

  async function loadAllData(options: { retries?: number } = {}) {
    const attempts = Math.max(1, options.retries ?? 1)

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const results = await Promise.all(
        collections.map(async (collection) => {
          try {
            const data = await fetchJson(collection.endpoint)
            return {
              key: collection.key,
              rows: Array.isArray(data) ? data : [],
              ok: true,
            }
          } catch {
            return {
              key: collection.key,
              rows: getCollection(collection.key),
              ok: false,
            }
          }
        })
      )

      allData = Object.fromEntries(results.map((result) => [result.key, result.rows]))
      dataVersion += 1

      if (results.some((result) => result.ok) || attempt === attempts) {
        return
      }

      await wait(500 * attempt)
    }
  }

  async function handleLogin() {
    isSaving = true
    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Login gagal')
      }

      currentUser = data.user
      selectedKey = 'dashboard'
      searchTerm = ''
      resetForm('create')
      await loadAllData()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Login gagal'
    } finally {
      isSaving = false
    }
  }

  function requestLogout() {
    isLogoutDialogOpen = true
  }

  function cancelLogout() {
    isLogoutDialogOpen = false
  }

  function confirmLogout() {
    logout()
  }

  function logout() {
    currentUser = null
    selectedKey = 'dashboard'
    rows = []
    formData = {}
    editingRow = null
    errorMessage = ''
    successMessage = ''
    isLogoutDialogOpen = false
  }

  function getField(resourceConfig: Resource, fieldName: string): Field {
    return (
      resourceConfig.fields.find((field) => field.name === fieldName) ??
      resourceConfig.extraFields?.find((field) => field.name === fieldName) ?? {
        name: fieldName,
        label: fieldName,
      }
    )
  }

  function getActiveFields(
    resourceConfig: Resource,
    mode: FormMode,
    roleValue: DataValue = formData.role
  ): Field[] {
    let names = mode === 'edit' ? resourceConfig.updateFields : resourceConfig.createFields

    if (resourceConfig.key === 'users') {
      names = names.filter((name) => name !== 'NRP' && name !== 'id_dosen')

      if (roleValue === 'mahasiswa') {
        names = [...names, 'NRP']
      }

      if (roleValue === 'dosen') {
        names = [...names, 'id_dosen']
      }
    }

    return names.map((name) => getField(resourceConfig, name))
  }

  function getReferenceKey(reference: ReferenceConfig) {
    return `${reference.endpoint}:${reference.valueField}`
  }

  function getFieldReferenceKey(field: Field) {
    return field.reference ? getReferenceKey(field.reference) : ''
  }

  function getResourceReferenceConfigs(resourceConfig: Resource): ReferenceConfig[] {
    const refs = new Map<string, ReferenceConfig>()

    for (const field of [...resourceConfig.fields, ...(resourceConfig.extraFields ?? [])]) {
      if (field.reference) {
        refs.set(getReferenceKey(field.reference), field.reference)
      }
    }

    return Array.from(refs.values())
  }

  function formatReferenceLabel(row: DataRow, reference: ReferenceConfig) {
    const labelParts = reference.labelFields
      .map((fieldName) => row[fieldName])
      .filter((value) => value !== null && value !== undefined && String(value) !== '')
      .map(String)

    return labelParts.length > 0 ? labelParts.join(' - ') : String(row[reference.valueField] ?? '')
  }

  async function loadReferenceOptions(resourceConfig: Resource | null = resource) {
    if (!resourceConfig) {
      return
    }

    const nextOptions = { ...referenceOptions }

    for (const reference of getResourceReferenceConfigs(resourceConfig)) {
      const key = getReferenceKey(reference)

      try {
        const response = await fetch(reference.endpoint)
        const data = await readResponse(response)

        if (!response.ok || !Array.isArray(data)) {
          nextOptions[key] = []
          continue
        }

        nextOptions[key] = data
          .filter((row: DataRow) => row[reference.valueField] !== null && row[reference.valueField] !== undefined)
          .map((row: DataRow) => ({
            value: row[reference.valueField] as string | number,
            label: formatReferenceLabel(row, reference),
          }))
      } catch {
        nextOptions[key] = []
      }
    }

    referenceOptions = nextOptions
  }

  function getFieldOptions(field: Field, selectedDepartemen: DataValue = formData.id_departemen, _version = dataVersion) {
    const options = field.reference ? referenceOptions[getFieldReferenceKey(field)] ?? [] : []

    if (resource?.key !== 'mahasiswa' || field.name !== 'id_dosen_wali') {
      return options
    }

    if (!selectedDepartemen) {
      return []
    }

    const allowedDosenIds = new Set(
      getCollection('dosen')
        .filter((row) => sameId(row.id_departemen, selectedDepartemen))
        .map((row) => String(row.id_dosen))
    )

    return options.filter((option) => allowedDosenIds.has(String(option.value)))
  }

  function resetForm(mode: FormMode = 'create', row: DataRow | null = null, resourceConfig: Resource | null = resource) {
    if (!resourceConfig) {
      formMode = mode
      editingRow = row
      formData = {}
      return
    }

    const nextFields = getActiveFields(resourceConfig, mode, row?.role ?? '')
    const nextData: FormData = {}

    for (const field of nextFields) {
      nextData[field.name] = row?.[field.name] ?? ''
    }

    formMode = mode
    editingRow = row
    formData = nextData
  }

  async function fetchRows(resourceConfig: Resource | null = resource) {
    if (!resourceConfig) {
      return
    }

    isLoading = true
    errorMessage = ''

    try {
      const data = await fetchJson(resourceConfig.endpoint)
      rows = Array.isArray(data) ? data : []
    } catch (error) {
      rows = []
      errorMessage = error instanceof Error ? error.message : 'Failed to load data'
    } finally {
      isLoading = false
    }
  }

  async function selectView(key: string) {
    const nextResource = getResource(key)

    selectedKey = key
    searchTerm = ''
    errorMessage = ''
    successMessage = ''

    if (key !== 'krs') {
      selectedKrsNrp = null
      selectedKrsOverride = null
      isKrsEditMode = false
      selectedJadwalId = ''
    }

    if (key !== 'nilai') {
      selectedNilaiMatkulId = ''
      editingNilaiDetail = null
      nilaiFormData = {}
    }

    if (key !== 'mahasiswa') {
      mahasiswaDepartemenFilter = ''
      mahasiswaAngkatanFilter = ''
    }

    if (key !== 'dosen') {
      dosenDepartemenFilter = ''
    }

    if (key !== 'mata_kuliah') {
      mataKuliahDepartemenFilter = ''
    }

    if (key !== 'jadwal') {
      jadwalDepartemenFilter = ''
      jadwalPeriodeFilter = ''
    }

    if (nextResource) {
      resetForm('create', null, nextResource)
      await fetchRows(nextResource)
      await loadReferenceOptions(nextResource)
    } else {
      resetForm('create', null, null)
      await loadAllData()
    }
  }

  async function refreshCurrentView(options: { keepMessages?: boolean } = {}) {
    if (!options.keepMessages) {
      errorMessage = ''
      successMessage = ''
      selectedKrsOverride = null
    }

    await loadAllData()

    if (resource) {
      await fetchRows(resource)
      await loadReferenceOptions(resource)
    }
  }

  async function refreshAfterMutation() {
    await refreshCurrentView({ keepMessages: true })
  }

  function upsertCollectionRow(collectionKey: string, idField: string, row: DataRow | null | undefined) {
    if (!row) {
      return
    }

    const rowId = row?.[idField]

    if (rowId === null || rowId === undefined) {
      return
    }

    const currentRows = getCollection(collectionKey)
    const nextRows = currentRows.some((item) => sameId(item[idField], rowId))
      ? currentRows.map((item) => (sameId(item[idField], rowId) ? { ...item, ...row } : item))
      : [...currentRows, row]

    allData = {
      ...allData,
      [collectionKey]: nextRows,
    }
    dataVersion += 1

    if (resource?.key === collectionKey) {
      rows = rows.some((item) => sameId(item[idField], rowId))
        ? rows.map((item) => (sameId(item[idField], rowId) ? { ...item, ...row } : item))
        : [...rows, row]
    }
  }

  function editRow(row: DataRow) {
    if (!resource) {
      return
    }

    if (resource.key === 'mahasiswa') {
      openStudentKrs(row)
      return
    }

    errorMessage = ''
    successMessage = ''
    resetForm('edit', row, resource)
  }

  async function openStudentKrs(row: DataRow) {
    const krsResource = getResource('krs')

    selectedKrsNrp = row.NRP
    selectedKrsOverride = null
    selectedKey = 'krs'
    searchTerm = ''
    errorMessage = ''
    successMessage = ''
    isKrsEditMode = false
    selectedJadwalId = ''

    if (krsResource) {
      resetForm('create', null, krsResource)
      await loadAllData()
      await fetchRows(krsResource)
      await loadReferenceOptions(krsResource)
    }
  }

  async function openDosenKrsDetail(row: DataRow) {
    selectedKrsNrp = row.NRP
    selectedKrsOverride = null
    selectedKey = 'krs_dosen_detail'
    searchTerm = ''
    errorMessage = ''
    successMessage = ''
    isKrsEditMode = false
    selectedJadwalId = ''
    resetForm('create', null, null)
    await loadAllData()
  }

  function setFieldValue(field: Field, event: Event) {
    errorMessage = ''
    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement
    const value = field.type === 'checkbox' && target instanceof HTMLInputElement
      ? (target.checked ? 1 : 0)
      : target instanceof HTMLSelectElement
        ? readSelectValue(target)
        : target.value
    const nextData: FormData = {
      ...formData,
      [field.name]: value,
    }

    if (resource?.key === 'users' && field.name === 'role') {
      if (value !== 'mahasiswa') {
        nextData.NRP = ''
      }

      if (value !== 'dosen') {
        nextData.id_dosen = ''
      }
    }

    if (resource?.key === 'mahasiswa' && field.name === 'id_departemen') {
      const matchingDosen = getCollection('dosen').filter((row) => sameId(row.id_departemen, value))
      const wali = nextData.id_dosen_wali
        ? byId('dosen', 'id_dosen', nextData.id_dosen_wali)
        : null

      if (matchingDosen.length === 1) {
        nextData.id_dosen_wali = matchingDosen[0].id_dosen ?? ''
      } else if (wali && sameId(wali.id_departemen, value)) {
        nextData.id_dosen_wali = wali.id_dosen ?? ''
      } else {
        nextData.id_dosen_wali = ''
      }
    }

    formData = nextData
  }

  function normalizeValue(field: Field, value: DataValue | undefined): DataValue {
    if (field.type === 'checkbox') {
      return value === 1 || value === '1' ? 1 : 0
    }

    if (field.type === 'number') {
      return value === '' || value === null || value === undefined ? null : Number(value)
    }

    if ((value === '' || value === null || value === undefined) && field.nullable) {
      return null
    }

    return value ?? ''
  }

  async function submitForm() {
    if (!resource) {
      return
    }

    isSaving = true
    errorMessage = ''
    successMessage = ''

    const payload: FormData = {}

    for (const field of activeFields) {
      payload[field.name] = normalizeValue(field, formData[field.name])
    }

    if (formMode === 'edit' && !editingRow) {
      errorMessage = 'No row selected.'
      isSaving = false
      return
    }

    const selectedRow = editingRow!
    const endpoint =
      formMode === 'edit'
        ? `${resource.endpoint}/${selectedRow[resource.idField]}`
        : resource.endpoint

    try {
      const response = await fetch(endpoint, {
        method: formMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to save data')
      }

      successMessage = formMode === 'edit' ? 'Data updated.' : 'Data created.'

      if (typeof data?.updatedMahasiswa === 'number') {
        successMessage = `Periode aktif saved. ${data.updatedMahasiswa} mahasiswa updated.`
      }

      resetForm('create', null, resource)
      await loadAllData()
      await loadReferenceOptions(resource)
      await fetchRows(resource)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to save data'
    } finally {
      isSaving = false
    }
  }

  async function deleteRow(row: DataRow) {
    if (!resource) {
      return
    }

    const id = row[resource.idField]

    if (!window.confirm(`Delete ${resource.label} #${id}?`)) {
      return
    }

    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch(`${resource.endpoint}/${id}`, { method: 'DELETE' })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to delete data')
      }

      successMessage = 'Data deleted.'
      resetForm('create', null, resource)
      await loadAllData()
      await loadReferenceOptions(resource)
      await fetchRows(resource)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete data'
    }
  }

  async function requestCuti(row: DataRow) {
    if (!window.confirm('Apakah kamu yakin ingin mengajukan cuti?')) {
      return
    }

    const id = row.id_krs
    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch(`/api/krs/${id}/cuti`, { method: 'PUT' })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to submit cuti')
      }

      successMessage = `Mahasiswa ${data.NRP} sekarang berstatus Cuti.`
      await refreshAfterMutation()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to submit cuti'
    }
  }

  function startKrsEdit(krs: DataRow | null | undefined) {
    if (!krs) {
      errorMessage = 'KRS belum dibuat.'
      return
    }

    if (!canCurrentUserEditKrs(krs)) {
      errorMessage = 'KRS sudah disetujui. Mahasiswa tidak bisa mengubah KRS ini.'
      return
    }

    isKrsEditMode = true
    selectedJadwalId = ''
    errorMessage = ''
    successMessage = ''
  }

  function setSelectedJadwal(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    selectedJadwalId = readSelectValue(target)
  }

  async function createKrsForStudent(nrp: DataValue | undefined) {
    if (!nrp) {
      errorMessage = 'NRP mahasiswa tidak ditemukan.'
      return
    }

    isSaving = true
    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch('/api/krs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NRP: nrp }),
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to create KRS')
      }

      successMessage = `KRS untuk ${getMahasiswaName(nrp)} berhasil dibuat.`
      await refreshAfterMutation()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to create KRS'
    } finally {
      isSaving = false
    }
  }

  async function addSelectedJadwalToKrs(krs: DataRow | null | undefined) {
    if (!krs) {
      errorMessage = 'KRS belum dibuat.'
      return
    }

    if (!canCurrentUserEditKrs(krs)) {
      errorMessage = 'KRS sudah disetujui. Hanya admin atau dosen yang bisa mengubahnya.'
      return
    }

    if (!selectedJadwalId) {
      errorMessage = 'Pilih mata kuliah terlebih dahulu.'
      return
    }

    isSaving = true
    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch('/api/detailkrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_krs: krs.id_krs,
          id_jadwal: selectedJadwalId,
          status_matkul: 'Aktif',
        }),
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to add mata kuliah')
      }

      selectedJadwalId = ''
      successMessage = 'Mata kuliah berhasil ditambahkan ke KRS.'
      await refreshAfterMutation()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to add mata kuliah'
    } finally {
      isSaving = false
    }
  }

  async function removeDetailFromKrs(detail: DataRow, krs: DataRow | null | undefined) {
    if (!krs || !canCurrentUserEditKrs(krs)) {
      errorMessage = 'KRS sudah disetujui. Hanya admin atau dosen yang bisa mengubahnya.'
      return
    }

    if (!window.confirm('Drop mata kuliah ini dari KRS?')) {
      return
    }

    isSaving = true
    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch(`/api/detailkrs/${detail.id_dkrs}`, { method: 'DELETE' })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to drop mata kuliah')
      }

      successMessage = 'Mata kuliah berhasil di-drop dari KRS.'
      await refreshAfterMutation()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to drop mata kuliah'
    } finally {
      isSaving = false
    }
  }

  async function updateKrsStatus(row: DataRow, status: string) {
    isSaving = true
    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch(`/api/krs/${row.id_krs}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NRP: row.NRP, status_krs: status }),
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to update KRS')
      }

      let updatedKrs = (data?.krs ?? {
        ...row,
        status_krs: status,
        id_periode: data?.id_periode ?? row.id_periode,
      }) as DataRow

      const freshKrs = await fetchJson(`/api/krs/${row.id_krs}`)

      if (freshKrs) {
        updatedKrs = freshKrs as DataRow
      }

      upsertCollectionRow('krs', 'id_krs', updatedKrs)
      selectedKrsOverride = updatedKrs
      successMessage = `KRS #${row.id_krs} ${status}.`
      await refreshAfterMutation()
      upsertCollectionRow('krs', 'id_krs', updatedKrs)
      selectedKrsOverride = updatedKrs
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to update KRS'
    } finally {
      isSaving = false
    }
  }

  function syncSelectedNilaiMatkul(_version = dataVersion, key = selectedKey, role = currentUser?.role) {
    if (key !== 'nilai' || role !== 'admin') {
      return
    }

    const options = adminNilaiMatkulOptions(_version)

    if (options.length === 0) {
      selectedNilaiMatkulId = ''
      return
    }

    if (!selectedNilaiMatkulId || !options.some((row) => sameId(row.id_matkul, selectedNilaiMatkulId))) {
      const optionWithStudents = options.find((row) =>
        getCollection('detail_krs').some((detail) => sameId(detailMatkulId(detail), row.id_matkul))
      )

      selectedNilaiMatkulId = optionWithStudents?.id_matkul ?? options[0].id_matkul ?? ''
    }
  }

  function adminNilaiMatkulOptions(_version = dataVersion) {
    return [...getCollection('mata_kuliah')]
      .sort((left, right) => String(left.nama_matkul ?? '').localeCompare(String(right.nama_matkul ?? '')))
  }

  function adminNilaiRows(_version = dataVersion) {
    const term = searchTerm.trim().toLowerCase()

    if (!selectedNilaiMatkulId) {
      return []
    }

    return getCollection('detail_krs')
      .filter((detail) => sameId(detailMatkulId(detail), selectedNilaiMatkulId))
      .filter((detail) => {
        if (!term) {
          return true
        }

        return [detail.nama_mahasiswa, detail.NRP]
          .some((value) => String(value ?? '').toLowerCase().includes(term))
      })
      .sort((left, right) => String(left.nama_mahasiswa ?? '').localeCompare(String(right.nama_mahasiswa ?? '')))
  }

  function setSelectedNilaiMatkul(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    selectedNilaiMatkulId = readSelectValue(target)
    editingNilaiDetail = null
    nilaiFormData = {}
    errorMessage = ''
    successMessage = ''
  }

  function startNilaiEdit(detail: DataRow) {
    if (detail.status_krs !== 'Disetujui') {
      errorMessage = 'Nilai hanya bisa diinput untuk KRS yang sudah disetujui.'
      return
    }

    const nilai = nilaiByDetail(detail.id_dkrs)

    editingNilaiDetail = detail
    nilaiFormData = {
      nilai_tugas: nilai?.nilai_tugas ?? '',
      nilai_ETS: nilai?.nilai_ETS ?? '',
      nilai_EAS: nilai?.nilai_EAS ?? '',
    }
    errorMessage = ''
    successMessage = ''
  }

  function cancelNilaiEdit() {
    editingNilaiDetail = null
    nilaiFormData = {}
  }

  function setNilaiField(fieldName: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement
    nilaiFormData = {
      ...nilaiFormData,
      [fieldName]: target.value,
    }
  }

  async function saveNilaiForDetail() {
    if (!editingNilaiDetail) {
      return
    }

    const nilaiTugas = Number(nilaiFormData.nilai_tugas)
    const nilaiEts = Number(nilaiFormData.nilai_ETS)
    const nilaiEas = Number(nilaiFormData.nilai_EAS)

    if ([nilaiFormData.nilai_tugas, nilaiFormData.nilai_ETS, nilaiFormData.nilai_EAS].some((value) => value === '' || value === null || value === undefined)) {
      errorMessage = 'Nilai tugas, ETS, dan EAS wajib diisi.'
      return
    }

    if ([nilaiTugas, nilaiEts, nilaiEas].some((value) => Number.isNaN(value))) {
      errorMessage = 'Nilai harus berupa angka.'
      return
    }

    const existingNilai = nilaiByDetail(editingNilaiDetail.id_dkrs)
    const payload = {
      nilai_tugas: nilaiTugas,
      nilai_ETS: nilaiEts,
      nilai_EAS: nilaiEas,
      ...(existingNilai ? {} : { id_dkrs: editingNilaiDetail.id_dkrs }),
    }

    isSaving = true
    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch(existingNilai ? `/api/nilai/${existingNilai.id_nilai}` : '/api/nilai', {
        method: existingNilai ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to save nilai')
      }

      successMessage = existingNilai ? 'Nilai berhasil diperbarui.' : 'Nilai berhasil diinput.'
      cancelNilaiEdit()
      await refreshAfterMutation()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to save nilai'
    } finally {
      isSaving = false
    }
  }

  function sameId(left: DataValue | undefined, right: DataValue | undefined) {
    return String(left ?? '') === String(right ?? '')
  }

  function readSelectValue(target: HTMLSelectElement): DataValue {
    const selectedOption = target.selectedOptions[0] as (HTMLOptionElement & { __value?: DataValue }) | undefined

    if (selectedOption && Object.prototype.hasOwnProperty.call(selectedOption, '__value')) {
      return selectedOption.__value ?? ''
    }

    return target.value
  }

  function isActiveFlag(value: unknown) {
    const normalized = String(value ?? '').toLowerCase()
    return value === 1 || value === true || normalized === '1' || normalized === 'true'
  }

  function canCurrentUserEditKrs(krs: DataRow | null | undefined) {
    if (!krs || !currentUser) {
      return false
    }

    if (currentUser.role === 'admin' || currentUser.role === 'dosen') {
      return true
    }

    return krs.status_krs !== 'Disetujui'
  }

  function canCurrentUserApproveKrs() {
    return currentUser?.role === 'admin' || currentUser?.role === 'dosen'
  }

  function krsStatusLabel(krs: DataRow | null | undefined) {
    if (!krs) {
      return 'Belum Dibuat'
    }

    return krs.status_krs === 'Diajukan' ? 'Belum Disetujui' : String(krs.status_krs ?? '-')
  }

  function getActivePeriode(_version = dataVersion) {
    return getCollection('periode_aktif').find((periode) => isActiveFlag(periode.is_aktif)) ?? null
  }

  function byId(collectionKey: string, idField: string, value: DataValue | undefined) {
    return getCollection(collectionKey).find((row) => sameId(row[idField], value))
  }

  function labelFor(collectionKey: string, idField: string, labelField: string, value: DataValue | undefined) {
    return String(byId(collectionKey, idField, value)?.[labelField] ?? value ?? '-')
  }

  function getMahasiswaName(nrp: DataValue | undefined) {
    return labelFor('mahasiswa', 'NRP', 'nama_mahasiswa', nrp)
  }

  function getDosenName(idDosen: DataValue | undefined) {
    return labelFor('dosen', 'id_dosen', 'nama_dosen', idDosen)
  }

  function getMatkulName(idMatkul: DataValue | undefined) {
    return labelFor('mata_kuliah', 'id_matkul', 'nama_matkul', idMatkul)
  }

  function getKelasName(idKelas: DataValue | undefined) {
    return labelFor('kelas', 'id_kelas', 'nama_kelas', idKelas)
  }

  function getDepartemenName(idDepartemen: DataValue | undefined) {
    return labelFor('departemen', 'id_departemen', 'nama_departemen', idDepartemen)
  }

  function getPeriodeLabel(idPeriode: DataValue | undefined) {
    const periode = byId('periode_aktif', 'id_periode', idPeriode)
    return periode ? `${periode.semester ?? '-'} ${periode.tahun ?? '-'}` : '-'
  }

  function getKrsPeriodeLabel(krs: DataRow | null | undefined) {
    if (krs?.id_periode) {
      return getPeriodeLabel(krs.id_periode)
    }

    return activePeriode ? `${activePeriode.semester} ${activePeriode.tahun}` : 'Periode belum aktif'
  }

  function formatTimeRange(row: DataRow) {
    return `${row.hari ?? '-'}, ${String(row.jam_mulai ?? '-').slice(0, 5)} - ${String(row.jam_selesai ?? '-').slice(0, 5)}`
  }

  function formatValue(value: DataValue | undefined) {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    const text = String(value)

    if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
      return text.replace('T', ' ').slice(0, 16)
    }

    return text
  }

  function formatTableValue(resourceConfig: Resource, row: DataRow, field: Field) {
    if (resourceConfig.key === 'mahasiswa') {
      if (field.name === 'id_departemen') {
        return getDepartemenName(row.id_departemen)
      }

      if (field.name === 'id_dosen_wali') {
        return getDosenName(row.id_dosen_wali)
      }
    }

    if (resourceConfig.key === 'dosen' && field.name === 'id_departemen') {
      return getDepartemenName(row.id_departemen)
    }

    if (resourceConfig.key === 'mata_kuliah' && field.name === 'id_departemen') {
      return getDepartemenName(row.id_departemen)
    }

    if (resourceConfig.key === 'jadwal') {
      if (field.name === 'id_periode') {
        return getPeriodeLabel(row.id_periode)
      }

      if (field.name === 'id_matkul') {
        return getMatkulName(row.id_matkul)
      }

      if (field.name === 'id_kelas') {
        return getKelasName(row.id_kelas)
      }

      if (field.name === 'id_dosen') {
        return getDosenName(row.id_dosen)
      }
    }

    return formatValue(row[field.name])
  }

  function getFilteredRows(
    resourceConfig: Resource,
    rowList: DataRow[],
    termValue: string,
    departemenFilter: DataValue,
    angkatanFilter: DataValue,
    dosenFilter: DataValue,
    mataKuliahFilter: DataValue,
    jadwalDepartemen: DataValue,
    jadwalPeriode: DataValue,
    _version = dataVersion
  ) {
    const term = termValue.trim().toLowerCase()

    return rowList.filter((row) => {
      if (resourceConfig.key === 'mahasiswa') {
        if (departemenFilter && !sameId(row.id_departemen, departemenFilter)) {
          return false
        }

        if (angkatanFilter && !sameId(row.angkatan, angkatanFilter)) {
          return false
        }
      }

      if (resourceConfig.key === 'dosen' && dosenFilter && !sameId(row.id_departemen, dosenFilter)) {
        return false
      }

      if (resourceConfig.key === 'mata_kuliah' && mataKuliahFilter && !sameId(row.id_departemen, mataKuliahFilter)) {
        return false
      }

      if (resourceConfig.key === 'jadwal') {
        const matkul = byId('mata_kuliah', 'id_matkul', row.id_matkul)

        if (jadwalDepartemen && !sameId(matkul?.id_departemen, jadwalDepartemen)) {
          return false
        }

        if (jadwalPeriode && !sameId(row.id_periode, jadwalPeriode)) {
          return false
        }
      }

      if (!term) {
        return true
      }

      const values = resourceConfig.key === 'mahasiswa'
        ? [...Object.values(row), getDepartemenName(row.id_departemen), getDosenName(row.id_dosen_wali)]
        : resourceConfig.key === 'dosen'
          ? [...Object.values(row), getDepartemenName(row.id_departemen)]
          : resourceConfig.key === 'mata_kuliah'
            ? [...Object.values(row), getDepartemenName(row.id_departemen)]
            : resourceConfig.key === 'jadwal'
              ? [
                  ...Object.values(row),
                  getPeriodeLabel(row.id_periode),
                  getMatkulName(row.id_matkul),
                  getKelasName(row.id_kelas),
                  getDosenName(row.id_dosen),
                  getDepartemenName(byId('mata_kuliah', 'id_matkul', row.id_matkul)?.id_departemen),
                ]
            : Object.values(row)

      return values.some((value) => String(value ?? '').toLowerCase().includes(term))
    })
  }

  function mahasiswaAngkatanOptions(_version = dataVersion) {
    return Array.from(
      new Set(
        getCollection('mahasiswa')
          .map((row) => row.angkatan)
          .filter((value) => value !== null && value !== undefined && String(value) !== '')
      )
    ).sort((left, right) => Number(left) - Number(right) || String(left).localeCompare(String(right)))
  }

  function setMahasiswaDepartemenFilter(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    mahasiswaDepartemenFilter = readSelectValue(target)
  }

  function setMahasiswaAngkatanFilter(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    mahasiswaAngkatanFilter = readSelectValue(target)
  }

  function setDosenDepartemenFilter(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    dosenDepartemenFilter = readSelectValue(target)
  }

  function setMataKuliahDepartemenFilter(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    mataKuliahDepartemenFilter = readSelectValue(target)
  }

  function setJadwalDepartemenFilter(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    jadwalDepartemenFilter = readSelectValue(target)
  }

  function setJadwalPeriodeFilter(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    jadwalPeriodeFilter = readSelectValue(target)
  }

  function formatActivityTime(value: DataValue | undefined) {
    if (!value) {
      return '-'
    }

    const text = String(value)

    if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
      const date = new Date(text)
      return Number.isNaN(date.getTime())
        ? '-'
        : date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jakarta',
          })
    }

    return text
  }

  function recentActivities(_version = dataVersion) {
    const logs = getCollection('activities')
    const hasPeriodeLog = logs.some((row) => String(row.keterangan ?? '').toLowerCase().includes('periode aktif'))
    const fallbackLogs = activePeriode && !hasPeriodeLog
      ? [{
          id: 'periode-aktif',
          waktu: formatActivityTime(activePeriode.updated_at),
          created_at: activePeriode.updated_at,
          keterangan: `Periode aktif ${activePeriode.semester} ${activePeriode.tahun} sedang berjalan.`,
        } as DataRow]
      : []

    return [...logs, ...fallbackLogs]
      .sort((left, right) => {
        const leftTime = new Date(String(left.created_at ?? '')).getTime()
        const rightTime = new Date(String(right.created_at ?? '')).getTime()
        return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime)
      })
      .slice(0, 6)
  }

  function activeUserName() {
    if (!currentUser) {
      return ''
    }

    if (currentUser.role === 'dosen') {
      return getDosenName(currentUser.id_dosen)
    }

    if (currentUser.role === 'mahasiswa') {
      return getMahasiswaName(currentUser.NRP)
    }

    return 'Admin Utama'
  }

  function currentDosen() {
    if (currentUser?.role !== 'dosen') {
      return null
    }

    return byId('dosen', 'id_dosen', currentUser.id_dosen) ?? getCollection('dosen')[0] ?? null
  }

  function currentDosenTotalSks() {
    return currentDosenSchedule().reduce(
      (total, row) => total + Number(byId('mata_kuliah', 'id_matkul', row.id_matkul)?.sks ?? 0),
      0
    )
  }

  function dashboardTitle() {
    if (!currentUser) {
      return 'SIAKAD'
    }

    if (selectedKey === 'dashboard') {
      return 'Dashboard'
    }

    return navItems.find((item) => item.key === selectedKey)?.label ?? resource?.label ?? 'SIAKAD'
  }

  function metricValue(collectionKey: string) {
    if (isInitialDataLoading && getCollection(collectionKey).length === 0) {
      return '...'
    }

    return getCollection(collectionKey).length
  }

  function pendingKrsRows() {
    return getCollection('krs').filter((row) => row.status_krs === 'Diajukan')
  }

  function activeScheduleCount() {
    if (!activePeriode) {
      return 0
    }

    return getCollection('jadwal').filter((row) => sameId(row.id_periode, activePeriode.id_periode)).length
  }

  function dashboardInfoItems() {
    return [
      { label: 'KRS Pending', value: isInitialDataLoading ? '...' : pendingKrsRows().length },
      { label: 'Jadwal Periode Ini', value: isInitialDataLoading ? '...' : activeScheduleCount() },
      { label: 'Nilai Tercatat', value: isInitialDataLoading ? '...' : getCollection('nilai').length },
    ]
  }

  function currentDosenSchedule() {
    return getCollection('jadwal').filter((row) => (
      currentUser?.role !== 'dosen' || !currentUser.id_dosen || sameId(row.id_dosen, currentUser.id_dosen)
    ))
  }

  function currentMahasiswaRows() {
    if (currentUser?.role !== 'dosen' || !currentUser.id_dosen) {
      return getCollection('mahasiswa')
    }

    return getCollection('mahasiswa').filter((row) => sameId(row.id_dosen_wali, currentUser?.id_dosen))
  }

  function currentDosenKrsRows() {
    const waliNrps = new Set(currentMahasiswaRows().map((row) => String(row.NRP)))
    const rows = getCollection('krs').filter((row) => waliNrps.has(String(row.NRP)))

    return rows.length > 0 ? rows : getCollection('krs')
  }

  function nilaiRowsForDosen() {
    const allowedJadwal = new Set(currentDosenSchedule().map((row) => String(row.id_jadwal)))
    const allowedDkrs = new Set(
      getCollection('detail_krs')
        .filter((row) => allowedJadwal.has(String(row.id_jadwal)))
        .map((row) => String(row.id_dkrs))
    )

    return getCollection('nilai').filter((row) => allowedDkrs.has(String(row.id_dkrs)))
  }

  function nilaiDetailRowsForDosen() {
    const allowedJadwal = new Set(currentDosenSchedule().map((row) => String(row.id_jadwal)))
    const term = searchTerm.trim().toLowerCase()

    return getCollection('detail_krs')
      .filter((detail) => allowedJadwal.has(String(detail.id_jadwal)))
      .filter((detail) => {
        if (!term) {
          return true
        }

        return [
          detail.nama_mahasiswa,
          getMahasiswaName(detail.NRP),
          detail.NRP,
          detailMatkulName(detail),
        ].some((value) => String(value ?? '').toLowerCase().includes(term))
      })
      .sort((left, right) =>
        String(detailMatkulName(left)).localeCompare(String(detailMatkulName(right))) ||
        String(getMahasiswaName(left.NRP)).localeCompare(String(getMahasiswaName(right.NRP)))
      )
  }

  function currentStudent() {
    if (currentUser?.role !== 'mahasiswa') {
      return null
    }

    return byId('mahasiswa', 'NRP', currentUser.NRP) ?? getCollection('mahasiswa')[0] ?? null
  }

  function selectedKrsStudent() {
    if (selectedKrsNrp) {
      return byId('mahasiswa', 'NRP', selectedKrsNrp) ?? null
    }

    return currentStudent()
  }

  function studentKrsRows(student: DataRow | null = selectedKrsStudent()) {
    if (!student) {
      return []
    }

    return getCollection('krs').filter((row) => sameId(row.NRP, student.NRP))
  }

  function applySelectedKrsOverride(krs: DataRow | null, student: DataRow | null) {
    if (!selectedKrsOverride || !student || !sameId(selectedKrsOverride.NRP, student.NRP)) {
      return krs
    }

    if (krs && sameId(krs.id_krs, selectedKrsOverride.id_krs)) {
      return { ...krs, ...selectedKrsOverride }
    }

    const periodeMatches = activePeriode
      ? sameId(selectedKrsOverride.id_periode, activePeriode.id_periode)
      : true

    return periodeMatches ? selectedKrsOverride : krs
  }

  function activeKrsForStudent(student: DataRow | null = selectedKrsStudent(), _version = dataVersion) {
    const rows = studentKrsRows(student)
    const activeKrs = activePeriode
      ? rows.find((row) => sameId(row.id_periode, activePeriode.id_periode)) ?? null
      : rows[0] ?? null

    return applySelectedKrsOverride(activeKrs, student)
  }

  function detailRowsForKrs(krs: DataRow | null | undefined) {
    if (!krs) {
      return []
    }

    return getCollection('detail_krs').filter((row) => sameId(row.id_krs, krs.id_krs))
  }

  function availableJadwalRowsForKrs(krs: DataRow | null | undefined) {
    const periodeId = krs?.id_periode ?? activePeriode?.id_periode
    const student = byId('mahasiswa', 'NRP', krs?.NRP)
    const studentDepartemen = student?.id_departemen
    const usedJadwalIds = new Set(detailRowsForKrs(krs).map((row) => String(row.id_jadwal)))

    if (!studentDepartemen) {
      return []
    }

    return getCollection('jadwal').filter((row) => (
      sameId(row.id_periode, periodeId) &&
      !usedJadwalIds.has(String(row.id_jadwal)) &&
      sameId(byId('mata_kuliah', 'id_matkul', row.id_matkul)?.id_departemen, studentDepartemen)
    ))
  }

  function formatJadwalOption(row: DataRow) {
    const sks = byId('mata_kuliah', 'id_matkul', row.id_matkul)?.sks ?? '-'
    const kapasitas = byId('kelas', 'id_kelas', row.id_kelas)?.kapasitas_kelas ?? '-'
    const terisi = getCollection('detail_krs').filter((detail) => sameId(detail.id_jadwal, row.id_jadwal)).length

    return `${getMatkulName(row.id_matkul)} - ${getKelasName(row.id_kelas)} - ${getDosenName(row.id_dosen)} - ${formatTimeRange(row)} - ${sks} SKS - Kapasitas ${terisi}/${kapasitas}`
  }

  function currentStudentKrsRows() {
    const student = currentStudent()

    if (!student) {
      return []
    }

    return getCollection('krs').filter((row) => sameId(row.NRP, student.NRP))
  }

  function periodeOrderValue(row: DataRow | null | undefined) {
    const periode = byId('periode_aktif', 'id_periode', row?.id_periode)
    const tahun = Number(periode?.tahun ?? row?.tahun ?? 0)
    const semester = String(periode?.semester ?? row?.semester ?? '')
    const semesterOrder = semester === 'Genap' ? 2 : 1

    return tahun * 10 + semesterOrder
  }

  function studentKrsHistoryRows() {
    return [...currentStudentKrsRows()].sort((left, right) => periodeOrderValue(left) - periodeOrderValue(right))
  }

  function currentStudentDetailRows() {
    const krsIds = new Set(currentStudentKrsRows().map((row) => String(row.id_krs)))
    return getCollection('detail_krs').filter((row) => krsIds.has(String(row.id_krs)))
  }

  function currentStudentActiveDetailRows() {
    return detailRowsForKrs(activeKrsForStudent(currentStudent()))
  }

  function nilaiByDetail(idDkrs: DataValue | undefined) {
    return getCollection('nilai').find((row) => sameId(row.id_dkrs, idDkrs))
  }

  function jadwalByDetail(row: DataRow) {
    return byId('jadwal', 'id_jadwal', row.id_jadwal)
  }

  function detailMatkulId(row: DataRow) {
    return row.id_matkul ?? jadwalByDetail(row)?.id_matkul ?? null
  }

  function detailMatkulName(row: DataRow) {
    return row.nama_matkul ?? getMatkulName(detailMatkulId(row))
  }

  function detailSks(row: DataRow) {
    return Number(row.sks ?? byId('mata_kuliah', 'id_matkul', detailMatkulId(row))?.sks ?? 0)
  }

  function gradePoint(value: DataValue | undefined) {
    const grade = String(value ?? '').toUpperCase()
    const points: Record<string, number> = {
      A: 4,
      AB: 3.5,
      B: 3,
      BC: 2.5,
      C: 2,
      D: 1,
      E: 0,
    }

    return Object.prototype.hasOwnProperty.call(points, grade) ? points[grade] : null
  }

  function detailWeightedScore(row: DataRow) {
    const point = gradePoint(nilaiByDetail(row.id_dkrs)?.huruf_mutu)

    if (point === null) {
      return null
    }

    return detailSks(row) * point
  }

  function formatScore(value: number | null) {
    if (value === null || !Number.isFinite(value)) {
      return '-'
    }

    return Number.isInteger(value) ? String(value) : value.toFixed(1)
  }

  function formatGpa(value: DataValue | number | undefined) {
    const numeric = Number(value ?? 0)
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00'
  }

  function semesterLabel(row: DataRow | null | undefined) {
    const periode = byId('periode_aktif', 'id_periode', row?.id_periode)
    const semester = String(periode?.semester ?? row?.semester ?? '-')
    const tahun = periode?.tahun ?? row?.tahun ?? '-'

    return `${semester === 'Ganjil' ? 'Gasal' : semester} ${tahun}`
  }

  function semesterDetailRows(krs: DataRow | null | undefined) {
    return detailRowsForKrs(krs)
      .filter((row) => Boolean(jadwalByDetail(row)))
      .sort((left, right) => String(detailMatkulId(left) ?? '').localeCompare(String(detailMatkulId(right) ?? '')))
  }

  function semesterTotalSks(krs: DataRow | null | undefined) {
    const rows = semesterDetailRows(krs)
    const total = rows.reduce((sum, row) => sum + detailSks(row), 0)
    return total || Number(krs?.total_sks ?? 0)
  }

  function semesterIps(krs: DataRow | null | undefined) {
    const rows = semesterDetailRows(krs)
    const totalSks = rows.reduce((sum, row) => sum + detailSks(row), 0)
    const totalScore = rows.reduce((sum, row) => sum + (detailWeightedScore(row) ?? 0), 0)
    const calculated = totalSks > 0 ? totalScore / totalSks : 0

    return calculated > 0 ? calculated : Number(krs?.ips ?? 0)
  }

  function transcriptDetailRows() {
    return currentStudentDetailRows()
      .filter((row) => Boolean(jadwalByDetail(row)))
      .sort((left, right) => periodeOrderValue(byId('krs', 'id_krs', left.id_krs)) - periodeOrderValue(byId('krs', 'id_krs', right.id_krs))
        || String(detailMatkulId(left) ?? '').localeCompare(String(detailMatkulId(right) ?? '')))
  }

  function transcriptTotalSks() {
    const total = transcriptDetailRows().reduce((sum, row) => sum + detailSks(row), 0)
    return total || totalStudentSks()
  }

  function transcriptIpk() {
    const rows = transcriptDetailRows()
    const totalSks = rows.reduce((sum, row) => sum + detailSks(row), 0)
    const totalScore = rows.reduce((sum, row) => sum + (detailWeightedScore(row) ?? 0), 0)
    const calculated = totalSks > 0 ? totalScore / totalSks : 0

    return calculated > 0 ? calculated : Number(currentStudent()?.ipk ?? 0)
  }

  function printTranscript() {
    window.print()
  }

  function totalStudentSks() {
    return currentStudentKrsRows().reduce((total, row) => total + Number(row.total_sks ?? 0), 0)
  }

  function currentIps() {
    return currentStudentKrsRows()[0]?.ips ?? '0.00'
  }
</script>

<svelte:head>
  <title>SIAKAD Universitas Cendekia</title>
</svelte:head>

{#if !currentUser}
  <main class="login-screen">
    <section class="login-brand">
      <p class="eyebrow">SIAKAD</p>
      <h1>Universitas Cendekia</h1>
      <div class="login-stats" aria-label="Ringkasan sistem">
        <div><strong>{metricValue('mahasiswa')}</strong><span>Mahasiswa</span></div>
        <div><strong>{metricValue('dosen')}</strong><span>Dosen</span></div>
        <div><strong>{metricValue('departemen')}</strong><span>Departemen</span></div>
      </div>
    </section>

    <section class="login-panel">
      <p class="eyebrow">Login</p>
      <h2>Masuk ke SIAKAD</h2>

      {#if errorMessage}
        <p class="notice error">{errorMessage}</p>
      {/if}

      <form on:submit|preventDefault={handleLogin}>
        <label>
          <span>Email</span>
          <input bind:value={loginForm.email} type="email" autocomplete="username" />
        </label>
        <label>
          <span>Password</span>
          <input bind:value={loginForm.password} type="password" autocomplete="current-password" />
        </label>
        <button class="primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Memeriksa...' : 'Login'}
        </button>
      </form>
    </section>
  </main>
{:else}
  <main class="app-page">
    <header class="app-header">
      <div class="brand-mark">
        <p class="eyebrow">SIAKAD</p>
        <h1>Universitas Cendekia</h1>
      </div>

      <div class="header-actions">
        {#if currentUser.role === 'admin' && selectedKey === 'dashboard'}
          <label class="quick-search">
            <span class="sr-only">Cari Cepat</span>
            <input bind:value={searchTerm} type="search" placeholder="Cari Cepat" />
          </label>
        {/if}
        <button class="manual-refresh" type="button" on:click={() => refreshCurrentView()} disabled={isLoading || isSaving}>
          Refresh
        </button>
        <button class="user-pill" type="button" on:click={requestLogout} title="Menu akun">
          <span class="mini-avatar" aria-hidden="true"></span>
          <span>{activeUserName()}</span>
          <span aria-hidden="true">v</span>
        </button>
      </div>
    </header>

    <div class="app-layout">
      <aside class="side-card" aria-label="Navigasi">
        <nav>
          {#each navItems as item}
            <button
              class:selected={selectedKey === item.key}
              type="button"
              on:click={() => selectView(item.key)}
            >
              {item.label}
            </button>
          {/each}
        </nav>
      </aside>

      <section class="page-shell">
        {#if currentUser.role === 'dosen'}
          {@const dosen = currentDosen()}
          <section class="profile-hero hero-dosen">
            <div class="hero-person">
              <span class="avatar-large" aria-hidden="true"></span>
              <div>
                <h2>{dosen?.nama_dosen ?? activeUserName()}</h2>
                <p>{getDepartemenName(dosen?.id_departemen)} - Dosen</p>
                <p>NIP: {currentUser.id_dosen ?? '-'}</p>
              </div>
            </div>
            <div class="hero-stats">
              <div><strong>{currentDosenSchedule().length}</strong><span>Mata Kuliah</span></div>
              <div><strong>{currentDosenTotalSks()}</strong><span>Total SKS</span></div>
            </div>
          </section>
        {:else if currentUser.role === 'mahasiswa'}
          {@const student = currentStudent()}
          <section class="profile-hero hero-mahasiswa">
            <div class="hero-person">
              <span class="avatar-large" aria-hidden="true"></span>
              <div>
                <h2>{student?.nama_mahasiswa ?? activeUserName()}</h2>
                <p>{student?.NRP ?? currentUser.NRP ?? '-'} - {getDepartemenName(student?.id_departemen)}</p>
                <p>{currentUser.email}</p>
              </div>
            </div>
            <div class="hero-stats">
              <div><strong>{currentStudentKrsRows()[0]?.total_sks ?? 0}</strong><span>SKS Semester Ini</span></div>
              <div><strong>{student?.ipk ?? '0.00'}</strong><span>IPK</span></div>
              <div><strong>{currentIps()}</strong><span>IPS</span></div>
            </div>
          </section>
        {/if}

      {#if errorMessage}
        <p class="notice error">{errorMessage}</p>
      {/if}

      {#if successMessage}
        <p class="notice success">{successMessage}</p>
      {/if}

      {#if selectedKey === 'dashboard' && currentUser.role === 'admin'}
        <section class="admin-top-row">
          <article class="metric-card"><span>Total Mahasiswa</span><strong>{metricValue('mahasiswa')}</strong></article>
          <article class="metric-card"><span>Total Dosen</span><strong>{metricValue('dosen')}</strong></article>
          <article class="metric-card"><span>Jumlah Departemen</span><strong>{metricValue('departemen')}</strong></article>
        </section>

        <section class="admin-info-row">
          <article class="period-card">
            <span class="panel-kicker">Periode</span>
            <h3>Masa Periode Aktif</h3>
            <p>{activePeriode ? `Semester ${activePeriode.semester} - Tahun Ajaran ${activePeriode.tahun}` : 'Periode belum aktif'}</p>
          </article>

          <article class="panel quick-panel">
            <span class="panel-kicker">Navigasi</span>
            <h3>Akses Cepat</h3>
            <div class="quick-actions">
              <button type="button" on:click={() => selectView('mahasiswa')}>Tambah Mahasiswa</button>
              <button type="button" on:click={() => selectView('dosen')}>Tambah Dosen</button>
              <button type="button" on:click={() => selectView('jadwal')}>Atur Jadwal Kuliah</button>
              <button type="button" on:click={() => selectView('departemen')}>Tambah Departemen</button>
            </div>
          </article>

          <article class="panel info-panel">
            <span class="panel-kicker">Info</span>
            <h3>Ringkasan Akademik</h3>
            <div class="info-list">
              {#each dashboardInfoItems() as item}
                <p>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </p>
              {/each}
            </div>
          </article>
        </section>

        <section class="dashboard-grid">
          <article class="panel panel-wide">
            <div class="panel-head">
              <h3>KRS Pending</h3>
              <button type="button" on:click={() => selectView('krs')}>Show All</button>
            </div>
            <div class="table-shell compact">
              <table>
                <thead><tr><th>NRP</th><th>Nama</th><th>SKS</th><th>Status</th></tr></thead>
                <tbody>
                  {#each pendingKrsRows().slice(0, 6) as row}
                    <tr>
                      <td>{row.NRP}</td>
                      <td>{getMahasiswaName(row.NRP)}</td>
                      <td>{row.total_sks ?? 0}</td>
                      <td><span class="status pending">{row.status_krs}</span></td>
                    </tr>
                  {:else}
                    <tr><td colspan="4" class="empty-cell">Tidak ada KRS pending.</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </article>

          <article class="panel">
            <h3>Peringatan</h3>
            <ul class="alert-list">
              <li>Jadwal bentrok terdeteksi</li>
              <li>Nilai belum diinput</li>
              <li>Kuota kelas penuh</li>
            </ul>
          </article>

          <article class="panel panel-wide">
            <div class="panel-head">
              <h3>Aktivitas Terakhir</h3>
              <button type="button" on:click={() => selectView('users')}>Show All</button>
            </div>
            <div class="activity-list">
              {#each recentActivities(dataVersion) as activity}
                <p>
                  <span>{formatActivityTime(activity.waktu ?? activity.created_at)}</span>
                  {activity.keterangan}
                </p>
              {:else}
                <p><span>-</span>Belum ada aktivitas terbaru.</p>
              {/each}
            </div>
          </article>
        </section>
      {:else if selectedKey === 'dashboard' && currentUser.role === 'dosen'}
        <section class="role-dashboard-grid">
          <article class="panel notification-panel">
            <h3>Notifikasi</h3>
            <ul class="alert-list">
              <li>Input nilai: {nilaiRowsForDosen().length} nilai tercatat.</li>
              <li>KRS pending: {currentDosenKrsRows().filter((row) => row.status_krs === 'Diajukan').length} pengajuan.</li>
            </ul>
          </article>

          <article class="panel schedule-panel">
            <h3>Jadwal Mengajar</h3>
            <div class="schedule-list">
              {#each currentDosenSchedule().slice(0, 6) as row}
                <div>
                  <strong>{formatTimeRange(row)}</strong>
                  <span>{getMatkulName(row.id_matkul)} - {getKelasName(row.id_kelas)}</span>
                </div>
              {/each}
            </div>
          </article>
        </section>
      {:else if selectedKey === 'dashboard' && currentUser.role === 'mahasiswa'}
        <section class="dashboard-grid">
          <article class="panel panel-wide">
            <h3>Jadwal Kuliah</h3>
            <div class="schedule-list">
              {#each currentStudentDetailRows().slice(0, 5) as detail}
                {@const jadwal = jadwalByDetail(detail)}
                {#if jadwal}
                  <div>
                    <strong>{formatTimeRange(jadwal)}</strong>
                    <span>{getMatkulName(jadwal.id_matkul)} - {getKelasName(jadwal.id_kelas)}</span>
                  </div>
                {/if}
              {/each}
            </div>
          </article>

          <article class="panel">
            <h3>Notifikasi</h3>
            <ul class="alert-list">
              <li>Status KRS: {currentStudentKrsRows()[0]?.status_krs ?? 'Belum tersedia'}</li>
              <li>Evaluasi akhir semester: {getCollection('nilai').length} nilai tercatat.</li>
            </ul>
          </article>
        </section>
      {:else if selectedKrsNrp && ((currentUser.role === 'admin' && resource?.key === 'krs') || (currentUser.role === 'dosen' && selectedKey === 'krs_dosen_detail'))}
        {@const student = selectedKrsStudent()}
        {@const krs = activeKrsForStudent(student, dataVersion)}
        {@const details = detailRowsForKrs(krs)}
        <section class="admin-krs-layout">
          <article class="krs-card">
            <div class="krs-card-head">
              <div>
                <h3>{student?.nama_mahasiswa ?? getMahasiswaName(selectedKrsNrp)}</h3>
                <p>{student?.NRP ?? selectedKrsNrp}</p>
              </div>
              <div class="krs-card-tools">
                <span class="period-chip">{getKrsPeriodeLabel(krs)}</span>
                <label class="search">
                  <span>Cari Mahasiswa</span>
                  <input bind:value={searchTerm} type="search" placeholder="Cari Mahasiswa" />
                </label>
              </div>
            </div>

            <div class="table-shell krs-table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Mata Kuliah</th><th>Kode</th><th>Kelas</th><th>Dosen</th><th>Waktu</th><th>SKS</th>
                    {#if canCurrentUserEditKrs(krs)}<th>Actions</th>{/if}
                  </tr>
                </thead>
                <tbody>
                  {#if !krs || details.length === 0}
                    <tr>
                      <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
                      {#if canCurrentUserEditKrs(krs)}<td>-</td>{/if}
                    </tr>
                  {:else}
                    {#each details as detail}
                      {@const jadwal = jadwalByDetail(detail)}
                      {#if jadwal}
                        <tr>
                          <td>{getMatkulName(jadwal.id_matkul)}</td>
                          <td>{jadwal.id_matkul}</td>
                          <td>{getKelasName(jadwal.id_kelas)}</td>
                          <td>{getDosenName(jadwal.id_dosen)}</td>
                          <td>{formatTimeRange(jadwal)}</td>
                          <td>{byId('mata_kuliah', 'id_matkul', jadwal.id_matkul)?.sks ?? '-'}</td>
                          {#if canCurrentUserEditKrs(krs)}
                            <td class="actions">
                              <button class="danger" type="button" on:click={() => removeDetailFromKrs(detail, krs)}>Drop</button>
                            </td>
                          {/if}
                        </tr>
                      {/if}
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>

            {#if krs}
              <div class="krs-total-row"><span>Total / Batas SKS</span><strong>{krs.total_sks ?? 0}/24</strong></div>
              <div class="krs-action-row">
                {#if canCurrentUserEditKrs(krs)}
                  <button class="inline-pill" type="button" on:click={() => startKrsEdit(krs)}>Edit</button>
                {/if}
                {#if canCurrentUserApproveKrs()}
                  {#if krs.status_krs !== 'Disetujui'}
                    <button class="approve-button" type="button" on:click={() => updateKrsStatus(krs, 'Disetujui')} disabled={isSaving}>Setujui KRS</button>
                  {:else}
                    <button class="secondary-pill" type="button" on:click={() => updateKrsStatus(krs, 'Diajukan')} disabled={isSaving}>Kembalikan ke Belum Disetujui</button>
                  {/if}
                  {#if krs.status_krs !== 'Ditolak'}
                    <button class="reject-button" type="button" on:click={() => updateKrsStatus(krs, 'Ditolak')} disabled={isSaving}>Tolak KRS</button>
                  {/if}
                {/if}
              </div>
              {#if isKrsEditMode && canCurrentUserEditKrs(krs)}
                <div class="available-course-picker">
                  <label>
                    <span>Mata Kuliah Tersedia</span>
                    <select value={selectedJadwalId ?? ''} on:change={setSelectedJadwal}>
                      <option value="">Pilih mata kuliah</option>
                      {#each availableJadwalRowsForKrs(krs) as jadwal}
                        <option value={jadwal.id_jadwal}>{formatJadwalOption(jadwal)}</option>
                      {/each}
                    </select>
                  </label>
                  <button class="primary" type="button" on:click={() => addSelectedJadwalToKrs(krs)} disabled={isSaving}>
                    Tambah
                  </button>
                </div>
              {/if}
              <div class:approved-strip={krs.status_krs === 'Disetujui'} class:rejected-strip={krs.status_krs === 'Ditolak'} class="krs-status-strip">
                {krsStatusLabel(krs)}
              </div>
            {:else}
              <button class="create-krs-strip" type="button" on:click={() => createKrsForStudent(student?.NRP ?? selectedKrsNrp)} disabled={isSaving}>
                {isSaving ? '...' : '+'}
              </button>
            {/if}
          </article>

          <section class="editor-card">
            <div class="section-head compact">
              <div>
                <p class="eyebrow">Form</p>
                <h2>Tambah KRS</h2>
              </div>
            </div>
            <div class="krs-helper-form">
              <label><span>Mahasiswa</span><input value={student?.nama_mahasiswa ?? '-'} disabled /></label>
              <label><span>NRP</span><input value={student?.NRP ?? selectedKrsNrp ?? '-'} disabled /></label>
              <label><span>Periode</span><input value={getKrsPeriodeLabel(krs)} disabled /></label>
              <button class="primary" type="button" on:click={() => createKrsForStudent(student?.NRP ?? selectedKrsNrp)} disabled={Boolean(krs) || isSaving}>
                {krs ? 'Sudah Ada' : 'Create'}
              </button>
            </div>
          </section>
        </section>
      {:else if selectedKey === 'nilai' && currentUser.role === 'admin'}
        <section class="crud-layout admin-nilai-layout">
          <section class="content-card">
            <div class="nilai-toolbar">
              <label class="matkul-select">
                <span class="sr-only">Pilih Mata Kuliah</span>
                <select value={selectedNilaiMatkulId ?? ''} on:change={setSelectedNilaiMatkul}>
                  <option value="">Pilih mata kuliah</option>
                  {#each adminNilaiMatkulOptions(dataVersion) as matkul}
                    <option value={matkul.id_matkul}>{matkul.nama_matkul ?? matkul.id_matkul}</option>
                  {/each}
                </select>
              </label>
              <label class="search">
                <span>Cari Nama Mahasiswa</span>
                <input bind:value={searchTerm} type="search" placeholder="Cari Nama Mahasiswa" />
              </label>
            </div>

            <div class="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>NRP</th>
                    <th>Tugas</th>
                    <th>ETS</th>
                    <th>EAS</th>
                    <th>Akhir</th>
                    <th>Huruf Mutu</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#if !selectedNilaiMatkulId}
                    <tr><td colspan="8" class="empty-cell">Pilih mata kuliah terlebih dahulu.</td></tr>
                  {:else if adminNilaiRows(dataVersion).length === 0}
                    <tr><td colspan="8" class="empty-cell">Belum ada mahasiswa terdaftar pada mata kuliah ini.</td></tr>
                  {:else}
                    {#each adminNilaiRows(dataVersion) as detail}
                      {@const nilai = nilaiByDetail(detail.id_dkrs)}
                      <tr>
                        <td>{detail.nama_mahasiswa ?? getMahasiswaName(detail.NRP)}</td>
                        <td>{detail.NRP}</td>
                        <td>{nilai?.nilai_tugas ?? '-'}</td>
                        <td>{nilai?.nilai_ETS ?? '-'}</td>
                        <td>{nilai?.nilai_EAS ?? '-'}</td>
                        <td>{nilai?.nilai_akhir ?? '-'}</td>
                        <td>{nilai?.huruf_mutu ?? '-'}</td>
                        <td class="actions">
                          <button
                            type="button"
                            disabled={detail.status_krs !== 'Disetujui'}
                            title={detail.status_krs === 'Disetujui' ? 'Input nilai' : 'KRS belum disetujui'}
                            on:click={() => startNilaiEdit(detail)}
                          >
                            {detail.status_krs === 'Disetujui' ? 'Edit' : 'Menunggu KRS'}
                          </button>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </section>

          <section class="editor-card">
            <div class="section-head compact">
              <div>
                <p class="eyebrow">Form</p>
                <h2>{editingNilaiDetail ? 'Input Nilai' : 'Tambah Nilai'}</h2>
              </div>
            </div>

            {#if editingNilaiDetail}
              <form on:submit|preventDefault={saveNilaiForDetail}>
                <label>
                  <span>Nama</span>
                  <input value={editingNilaiDetail.nama_mahasiswa ?? getMahasiswaName(editingNilaiDetail.NRP)} disabled />
                </label>
                <label>
                  <span>NRP</span>
                  <input value={editingNilaiDetail.NRP ?? '-'} disabled />
                </label>
                <label>
                  <span>Mata Kuliah</span>
                  <input value={detailMatkulName(editingNilaiDetail)} disabled />
                </label>
                <label>
                  <span>Tugas</span>
                  <input
                    value={nilaiFormData.nilai_tugas ?? ''}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    on:input={(event) => setNilaiField('nilai_tugas', event)}
                  />
                </label>
                <label>
                  <span>ETS</span>
                  <input
                    value={nilaiFormData.nilai_ETS ?? ''}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    on:input={(event) => setNilaiField('nilai_ETS', event)}
                  />
                </label>
                <label>
                  <span>EAS</span>
                  <input
                    value={nilaiFormData.nilai_EAS ?? ''}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    on:input={(event) => setNilaiField('nilai_EAS', event)}
                  />
                </label>

                <div class="form-actions">
                  <button class="primary" type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Simpan'}
                  </button>
                  <button type="button" on:click={cancelNilaiEdit}>Cancel</button>
                </div>
              </form>
            {:else}
              <div class="krs-helper-form">
                <p class="empty-note">Pilih mahasiswa dari tabel untuk menginput atau mengubah nilai.</p>
              </div>
            {/if}
          </section>
        </section>
      {:else if resource && currentUser.role === 'admin'}
        <section class="crud-layout">
          <section class="content-card">
            <div class="section-head">
              <div>
                <p class="eyebrow">Table</p>
                <h2>{resource.label}</h2>
              </div>
              <div class="table-tools">
                {#if resource.key === 'mahasiswa'}
                  <label class="table-filter">
                    <span>Filter Departemen</span>
                    <select value={mahasiswaDepartemenFilter ?? ''} on:change={setMahasiswaDepartemenFilter}>
                      <option value="">Semua Departemen</option>
                      {#each getCollection('departemen') as departemen}
                        <option value={departemen.id_departemen}>{departemen.nama_departemen}</option>
                      {/each}
                    </select>
                  </label>
                  <label class="table-filter narrow">
                    <span>Filter Angkatan</span>
                    <select value={mahasiswaAngkatanFilter ?? ''} on:change={setMahasiswaAngkatanFilter}>
                      <option value="">Semua Angkatan</option>
                      {#each mahasiswaAngkatanOptions(dataVersion) as angkatan}
                        <option value={angkatan}>{angkatan}</option>
                      {/each}
                    </select>
                  </label>
                {/if}
                {#if resource.key === 'dosen'}
                  <label class="table-filter">
                    <span>Filter Departemen</span>
                    <select value={dosenDepartemenFilter ?? ''} on:change={setDosenDepartemenFilter}>
                      <option value="">Semua Departemen</option>
                      {#each getCollection('departemen') as departemen}
                        <option value={departemen.id_departemen}>{departemen.nama_departemen}</option>
                      {/each}
                    </select>
                  </label>
                {/if}
                {#if resource.key === 'mata_kuliah'}
                  <label class="table-filter">
                    <span>Filter Departemen</span>
                    <select value={mataKuliahDepartemenFilter ?? ''} on:change={setMataKuliahDepartemenFilter}>
                      <option value="">Semua Departemen</option>
                      {#each getCollection('departemen') as departemen}
                        <option value={departemen.id_departemen}>{departemen.nama_departemen}</option>
                      {/each}
                    </select>
                  </label>
                {/if}
                {#if resource.key === 'jadwal'}
                  <label class="table-filter">
                    <span>Filter Departemen</span>
                    <select value={jadwalDepartemenFilter ?? ''} on:change={setJadwalDepartemenFilter}>
                      <option value="">Semua Departemen</option>
                      {#each getCollection('departemen') as departemen}
                        <option value={departemen.id_departemen}>{departemen.nama_departemen}</option>
                      {/each}
                    </select>
                  </label>
                  <label class="table-filter narrow">
                    <span>Filter Periode</span>
                    <select value={jadwalPeriodeFilter ?? ''} on:change={setJadwalPeriodeFilter}>
                      <option value="">Semua Periode</option>
                      {#each getCollection('periode_aktif') as periode}
                        <option value={periode.id_periode}>{getPeriodeLabel(periode.id_periode)}</option>
                      {/each}
                    </select>
                  </label>
                {/if}
                <label class="search">
                  <span>Cari {resource.label}</span>
                  <input bind:value={searchTerm} type="search" placeholder="Cari data" />
                </label>
              </div>
            </div>

            <div class="table-shell">
              {#if isLoading}
                <p class="empty-state">Loading data...</p>
              {:else if filteredRows.length === 0}
                <p class="empty-state">No data found.</p>
              {:else}
                <table>
                  <thead>
                    <tr>
                      {#each resource.fields as field}
                        <th>{field.label}</th>
                      {/each}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each filteredRows as row}
                      <tr>
                        {#each resource.fields as field}
                          <td>{formatTableValue(resource, row, field)}</td>
                        {/each}
                        <td class="actions">
                          <button type="button" on:click={() => editRow(row)}>Edit</button>
                          {#if resource.key === 'krs'}
                            <button type="button" on:click={() => requestCuti(row)}>Cuti</button>
                          {/if}
                          <button class="danger" type="button" on:click={() => deleteRow(row)}>Delete</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </div>
          </section>

          <section class="editor-card">
            <div class="section-head compact">
              <div>
                <p class="eyebrow">Form</p>
                <h2>{formMode === 'edit' ? `Edit ${resource.label}` : `Tambah ${resource.label}`}</h2>
              </div>
            </div>

            <form on:submit|preventDefault={submitForm}>
              {#each activeFields as field}
                <label>
                  <span>{field.label}</span>
                  {#if field.type === 'checkbox'}
                    <input
                      checked={formData[field.name] === 1 || formData[field.name] === '1'}
                      type="checkbox"
                      on:change={(event) => setFieldValue(field, event)}
                    />
                  {:else if field.options || field.reference}
                    <select value={formData[field.name] ?? ''} on:change={(event) => setFieldValue(field, event)}>
                      <option value="">Pilih</option>
                      {#if field.options}
                        {#each field.options as option}
                          <option value={option}>{option}</option>
                        {/each}
                      {:else if field.reference}
                        {#each getFieldOptions(field, formData.id_departemen, dataVersion) as option}
                          <option value={option.value}>{option.label}</option>
                        {/each}
                      {/if}
                    </select>
                  {:else}
                    <input
                      value={formData[field.name] ?? ''}
                      type={field.type ?? 'text'}
                      step={field.type === 'number' ? '1' : undefined}
                      on:input={(event) => setFieldValue(field, event)}
                    />
                  {/if}
                </label>
              {/each}

              <div class="form-actions">
                <button class="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : formMode === 'edit' ? 'Update' : 'Create'}
                </button>
                {#if formMode === 'edit'}
                  <button type="button" on:click={() => resetForm('create')}>Cancel</button>
                {/if}
              </div>
            </form>
          </section>
        </section>
      {:else if selectedKey === 'jadwal_mengajar'}
        <article class="panel">
          <h3>Jadwal Mengajar</h3>
          <div class="table-shell">
            <table>
              <thead><tr><th>Hari</th><th>Waktu</th><th>Mata Kuliah</th><th>Kelas</th><th>Periode</th></tr></thead>
              <tbody>
                {#each currentDosenSchedule() as row}
                  <tr><td>{row.hari}</td><td>{formatTimeRange(row)}</td><td>{getMatkulName(row.id_matkul)}</td><td>{getKelasName(row.id_kelas)}</td><td>{getPeriodeLabel(row.id_periode)}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </article>
      {:else if selectedKey === 'mahasiswa_wali'}
        <article class="panel">
          <h3>Mahasiswa Wali</h3>
          <div class="table-shell">
            <table>
              <thead><tr><th>NRP</th><th>Nama</th><th>Angkatan</th><th>Status</th><th>IPK</th><th>Status KRS</th></tr></thead>
              <tbody>
                {#each currentMahasiswaRows() as row}
                  {@const krs = getCollection('krs').find((item) => sameId(item.NRP, row.NRP))}
                  <tr><td>{row.NRP}</td><td>{row.nama_mahasiswa}</td><td>{row.angkatan}</td><td>{row.status_aktif}</td><td>{row.ipk ?? '-'}</td><td>{krs?.status_krs ?? '-'}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </article>
      {:else if selectedKey === 'rekap_nilai'}
        <section class="crud-layout">
          <section class="content-card">
            <div class="section-head">
              <div>
                <p class="eyebrow">Table</p>
                <h2>Rekap Nilai</h2>
              </div>
              <label class="search">
                <span>Cari Mahasiswa</span>
                <input bind:value={searchTerm} type="search" placeholder="Cari Mahasiswa" />
              </label>
            </div>
            <div class="table-shell">
              <table>
                <thead><tr><th>NRP</th><th>Nama</th><th>Mata Kuliah</th><th>Tugas</th><th>ETS</th><th>EAS</th><th>Akhir</th><th>Huruf</th><th>Actions</th></tr></thead>
                <tbody>
                  {#each nilaiDetailRowsForDosen() as detail}
                    {@const nilai = nilaiByDetail(detail.id_dkrs)}
                    <tr>
                      <td>{detail.NRP ?? '-'}</td>
                      <td>{detail.nama_mahasiswa ?? getMahasiswaName(detail.NRP)}</td>
                      <td>{detailMatkulName(detail)}</td>
                      <td>{nilai?.nilai_tugas ?? '-'}</td>
                      <td>{nilai?.nilai_ETS ?? '-'}</td>
                      <td>{nilai?.nilai_EAS ?? '-'}</td>
                      <td>{nilai?.nilai_akhir ?? '-'}</td>
                      <td>{nilai?.huruf_mutu ?? '-'}</td>
                      <td class="actions">
                        <button
                          type="button"
                          disabled={detail.status_krs !== 'Disetujui'}
                          title={detail.status_krs === 'Disetujui' ? 'Input nilai' : 'KRS belum disetujui'}
                          on:click={() => startNilaiEdit(detail)}
                        >
                          {detail.status_krs === 'Disetujui' ? 'Edit' : 'Menunggu KRS'}
                        </button>
                      </td>
                    </tr>
                  {:else}
                    <tr><td colspan="9" class="empty-cell">Belum ada mahasiswa pada jadwal mengajar ini.</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </section>

          <section class="editor-card">
            <div class="section-head compact">
              <div>
                <p class="eyebrow">Form</p>
                <h2>{editingNilaiDetail ? 'Input Nilai' : 'Tambah Nilai'}</h2>
              </div>
            </div>

            {#if editingNilaiDetail}
              <form on:submit|preventDefault={saveNilaiForDetail}>
                <label>
                  <span>Nama</span>
                  <input value={editingNilaiDetail.nama_mahasiswa ?? getMahasiswaName(editingNilaiDetail.NRP)} disabled />
                </label>
                <label>
                  <span>NRP</span>
                  <input value={editingNilaiDetail.NRP ?? '-'} disabled />
                </label>
                <label>
                  <span>Mata Kuliah</span>
                  <input value={detailMatkulName(editingNilaiDetail)} disabled />
                </label>
                <label>
                  <span>Tugas</span>
                  <input value={nilaiFormData.nilai_tugas ?? ''} type="number" min="0" max="100" step="1" on:input={(event) => setNilaiField('nilai_tugas', event)} />
                </label>
                <label>
                  <span>ETS</span>
                  <input value={nilaiFormData.nilai_ETS ?? ''} type="number" min="0" max="100" step="1" on:input={(event) => setNilaiField('nilai_ETS', event)} />
                </label>
                <label>
                  <span>EAS</span>
                  <input value={nilaiFormData.nilai_EAS ?? ''} type="number" min="0" max="100" step="1" on:input={(event) => setNilaiField('nilai_EAS', event)} />
                </label>

                <div class="form-actions">
                  <button class="primary" type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Simpan'}
                  </button>
                  <button type="button" on:click={cancelNilaiEdit}>Cancel</button>
                </div>
              </form>
            {:else}
              <div class="krs-helper-form">
                <p class="empty-note">Pilih mahasiswa dari tabel untuk menginput atau mengubah nilai.</p>
              </div>
            {/if}
          </section>
        </section>
      {:else if selectedKey === 'krs_dosen'}
        <article class="panel">
          <h3>KRS</h3>
          <div class="table-shell">
            <table>
              <thead><tr><th>NRP</th><th>Nama</th><th>Periode</th><th>Total SKS</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {#each currentDosenKrsRows() as row}
                  <tr>
                    <td>{row.NRP}</td>
                    <td>{getMahasiswaName(row.NRP)}</td>
                    <td>{getPeriodeLabel(row.id_periode)}</td>
                    <td>{row.total_sks}</td>
                    <td><span class:pending={row.status_krs === 'Diajukan'} class:success={row.status_krs === 'Disetujui'} class="status">{row.status_krs}</span></td>
                    <td class="actions">
                      <button type="button" on:click={() => openDosenKrsDetail(row)}>Detail</button>
                      {#if row.status_krs !== 'Disetujui'}
                        <button type="button" on:click={() => updateKrsStatus(row, 'Disetujui')}>Setuju</button>
                      {:else}
                        <button type="button" on:click={() => updateKrsStatus(row, 'Diajukan')}>Kembalikan</button>
                      {/if}
                      {#if row.status_krs !== 'Ditolak'}
                        <button type="button" on:click={() => updateKrsStatus(row, 'Ditolak')}>Tolak</button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </article>
      {:else if selectedKey === 'jadwal_mahasiswa'}
        <article class="panel">
          <h3>Jadwal Kuliah</h3>
          <div class="table-shell">
            <table>
              <thead><tr><th>Hari</th><th>Waktu</th><th>Mata Kuliah</th><th>Kelas</th><th>Dosen</th></tr></thead>
              <tbody>
                {#each currentStudentDetailRows() as detail}
                  {@const jadwal = jadwalByDetail(detail)}
                  {#if jadwal}
                    <tr><td>{jadwal.hari}</td><td>{formatTimeRange(jadwal)}</td><td>{getMatkulName(jadwal.id_matkul)}</td><td>{getKelasName(jadwal.id_kelas)}</td><td>{getDosenName(jadwal.id_dosen)}</td></tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </article>
      {:else if selectedKey === 'krs_mahasiswa'}
        {@const student = currentStudent()}
        {@const krs = activeKrsForStudent(student, dataVersion)}
        {@const details = detailRowsForKrs(krs)}
        <article class="krs-card student-krs-card">
          <div class="krs-card-head">
            <h3>KRS</h3>
            <span class="period-chip">{getKrsPeriodeLabel(krs)}</span>
          </div>
          <div class="table-shell krs-table-shell">
            <table>
              <thead>
                <tr>
                  <th>Mata Kuliah</th><th>Kode</th><th>Kelas</th><th>Dosen</th><th>Waktu</th><th>Nilai</th><th>SKS</th>
                  {#if canCurrentUserEditKrs(krs)}<th>Actions</th>{/if}
                </tr>
              </thead>
              <tbody>
                {#if !krs || details.length === 0}
                  <tr>
                    <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
                    {#if canCurrentUserEditKrs(krs)}<td>-</td>{/if}
                  </tr>
                {:else}
                  {#each details as detail}
                    {@const jadwal = jadwalByDetail(detail)}
                    {@const nilai = nilaiByDetail(detail.id_dkrs)}
                    {#if jadwal}
                      <tr>
                        <td>{getMatkulName(jadwal.id_matkul)}</td>
                        <td>{jadwal.id_matkul}</td>
                        <td>{getKelasName(jadwal.id_kelas)}</td>
                        <td>{getDosenName(jadwal.id_dosen)}</td>
                        <td>{formatTimeRange(jadwal)}</td>
                        <td>{nilai?.huruf_mutu ?? '-'}</td>
                        <td>{byId('mata_kuliah', 'id_matkul', jadwal.id_matkul)?.sks ?? '-'}</td>
                        {#if canCurrentUserEditKrs(krs)}
                          <td class="actions">
                            <button class="danger" type="button" on:click={() => removeDetailFromKrs(detail, krs)}>Drop</button>
                          </td>
                        {/if}
                      </tr>
                    {/if}
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>

          {#if krs}
            <div class="krs-total-row"><span>Total / Batas SKS</span><strong>{krs.total_sks ?? 0}/24</strong></div>
            {#if canCurrentUserEditKrs(krs)}
              <button class="inline-pill" type="button" on:click={() => startKrsEdit(krs)}>Edit</button>
            {/if}
            {#if isKrsEditMode && canCurrentUserEditKrs(krs)}
              <div class="available-course-picker">
                <label>
                  <span>Mata Kuliah Tersedia</span>
                  <select value={selectedJadwalId ?? ''} on:change={setSelectedJadwal}>
                    <option value="">Pilih mata kuliah</option>
                    {#each availableJadwalRowsForKrs(krs) as jadwal}
                      <option value={jadwal.id_jadwal}>{formatJadwalOption(jadwal)}</option>
                    {/each}
                  </select>
                </label>
                <button class="primary" type="button" on:click={() => addSelectedJadwalToKrs(krs)} disabled={isSaving}>
                  Tambah
                </button>
              </div>
            {/if}
            <div class:approved-strip={krs.status_krs === 'Disetujui'} class:rejected-strip={krs.status_krs === 'Ditolak'} class="krs-status-strip">
              {krsStatusLabel(krs)}
            </div>
            <div class="panel-footer">
              <button type="button" on:click={() => requestCuti(krs)}>Ajukan Cuti</button>
            </div>
          {:else}
            <button class="create-krs-strip" type="button" on:click={() => createKrsForStudent(student?.NRP ?? currentUser?.NRP)} disabled={isSaving}>
              {isSaving ? '...' : '+'}
            </button>
          {/if}
        </article>
      {:else if selectedKey === 'riwayat'}
        <section class="academic-stack">
          {#each studentKrsHistoryRows() as krs}
            {@const rows = semesterDetailRows(krs)}
            <article class="semester-card">
              <div class="semester-card-head">
                <span class="period-chip">{semesterLabel(krs)}</span>
              </div>
              <div class="academic-table-shell">
                <table class="academic-table">
                  <thead>
                    <tr><th>Mata Kuliah</th><th>Kode</th><th>SKS</th><th>Nilai</th></tr>
                  </thead>
                  <tbody>
                    {#if rows.length === 0}
                      <tr><td colspan="4" class="empty-cell">Belum ada mata kuliah pada periode ini.</td></tr>
                    {:else}
                      {#each rows as detail}
                        {@const nilai = nilaiByDetail(detail.id_dkrs)}
                        <tr>
                          <td>{detailMatkulName(detail)}</td>
                          <td>{detailMatkulId(detail)}</td>
                          <td>{detailSks(detail)}</td>
                          <td>{nilai?.huruf_mutu ?? '-'}</td>
                        </tr>
                      {/each}
                    {/if}
                  </tbody>
                </table>
              </div>
              <div class="academic-summary">
                <span>Total SKS: {semesterTotalSks(krs)}</span>
                <span>IPS: {formatGpa(semesterIps(krs))}</span>
              </div>
            </article>
          {:else}
            <article class="semester-card">
              <p class="empty-note">Riwayat studi belum tersedia.</p>
            </article>
          {/each}
        </section>
      {:else if selectedKey === 'transkrip'}
        <article class="panel transcript-card screen-transcript">
          <div class="panel-head">
            <h3>Transkrip & IPK</h3>
            <button type="button" on:click={printTranscript}>Unduh Transkrip</button>
          </div>
          <div class="academic-table-shell">
            <table class="academic-table">
              <thead><tr><th>Mata Kuliah</th><th>Kode</th><th>SKS</th><th>Nilai</th></tr></thead>
              <tbody>
                {#each transcriptDetailRows() as detail}
                  {@const nilai = nilaiByDetail(detail.id_dkrs)}
                  <tr>
                    <td>{detailMatkulName(detail)}</td>
                    <td>{detailMatkulId(detail)}</td>
                    <td>{detailSks(detail)}</td>
                    <td>{nilai?.huruf_mutu ?? '-'}</td>
                  </tr>
                {:else}
                  <tr><td colspan="4" class="empty-cell">Transkrip belum tersedia.</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="academic-summary">
            <span>Total SKS: {transcriptTotalSks()}</span>
            <span>IPK: {formatGpa(transcriptIpk())}</span>
          </div>
        </article>

        {#if true}
          {@const student = currentStudent()}
          <article class="print-transcript">
            <header class="print-transcript-head">
              <p class="eyebrow">SIAKAD</p>
              <h2>Universitas Cendekia</h2>
              <h3>Transkrip Akademik</h3>
            </header>
            <section class="print-student-info">
              <p><span>Nama</span><strong>{student?.nama_mahasiswa ?? activeUserName()}</strong></p>
              <p><span>NRP</span><strong>{student?.NRP ?? currentUser.NRP ?? '-'}</strong></p>
              <p><span>Departemen</span><strong>{getDepartemenName(student?.id_departemen)}</strong></p>
              <p><span>Angkatan</span><strong>{student?.angkatan ?? '-'}</strong></p>
            </section>
            <table class="print-table">
              <thead>
                <tr><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>N. Huruf</th><th>S*N</th><th>Periode</th></tr>
              </thead>
              <tbody>
                {#each transcriptDetailRows() as detail}
                  {@const nilai = nilaiByDetail(detail.id_dkrs)}
                  {@const krs = byId('krs', 'id_krs', detail.id_krs)}
                  <tr>
                    <td>{detailMatkulId(detail)}</td>
                    <td>{detailMatkulName(detail)}</td>
                    <td>{detailSks(detail)}</td>
                    <td>{nilai?.huruf_mutu ?? '-'}</td>
                    <td>{formatScore(detailWeightedScore(detail))}</td>
                    <td>{semesterLabel(krs)}</td>
                  </tr>
                {:else}
                  <tr><td colspan="6">Transkrip belum tersedia.</td></tr>
                {/each}
              </tbody>
            </table>
            <footer class="print-summary">
              <p><span>Total SKS</span><strong>{transcriptTotalSks()}</strong></p>
              <p><span>IPK</span><strong>{formatGpa(transcriptIpk())}</strong></p>
            </footer>
          </article>
        {/if}
      {/if}
      </section>
    </div>

    {#if isLogoutDialogOpen}
      <div class="modal-backdrop" role="presentation" on:click={cancelLogout}>
        <div
          class="logout-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          tabindex="-1"
          on:click|stopPropagation
          on:keydown={(event) => event.key === 'Escape' && cancelLogout()}
        >
          <span class="mini-avatar dialog-avatar" aria-hidden="true"></span>
          <h2 id="logout-title">Yakin mau logout?</h2>
          <p>Sesi {activeUserName()} akan ditutup dan kamu akan kembali ke halaman login.</p>
          <div class="dialog-actions">
            <button type="button" on:click={cancelLogout}>Batal</button>
            <button class="danger" type="button" on:click={confirmLogout}>Logout</button>
          </div>
        </div>
      </div>
    {/if}
  </main>
{/if}
