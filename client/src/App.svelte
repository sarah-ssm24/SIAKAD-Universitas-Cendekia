<script lang="ts">
  import { onMount } from 'svelte'

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

  type DataRow = Record<string, string | number | null>
  type FormData = Record<string, string | number | null>
  type FormMode = 'create' | 'edit'
  type ReferenceOption = {
    value: string | number
    label: string
  }

  const semesterOptions = ['Ganjil', 'Genap']
  const statusAktifOptions = ['Aktif', 'Cuti', 'Nonaktif', 'Lulus', 'DO']
  const statusKrsOptions = ['Diajukan', 'Disetujui', 'Ditolak']
  const statusMatkulOptions = ['Aktif', 'Lulus', 'Mengulang']
  const roleOptions = ['admin', 'dosen', 'mahasiswa']
  const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

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
    endpoint: '/api/detailkrs',
    valueField: 'id_dkrs',
    labelFields: ['id_dkrs', 'id_krs', 'id_jadwal'],
  }

  const resources: Resource[] = [
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
        { name: 'id_departemen', label: 'ID Departemen', type: 'number', reference: departemenReference },
      ],
      createFields: ['nama_mahasiswa', 'angkatan', 'id_departemen'],
      updateFields: ['nama_mahasiswa', 'angkatan', 'id_departemen'],
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
        { name: 'id_departemen', label: 'ID Departemen', type: 'number', reference: departemenReference },
      ],
      createFields: ['nama_dosen', 'jabatan_akademik', 'id_departemen'],
      updateFields: ['nama_dosen', 'jabatan_akademik', 'id_departemen'],
    },
    {
      key: 'mata_kuliah',
      label: 'Mata Kuliah',
      endpoint: '/api/matakuliah',
      idField: 'id_matkul',
      fields: [
        { name: 'id_matkul', label: 'ID', type: 'number' },
        { name: 'nama_matkul', label: 'Nama Mata Kuliah' },
        { name: 'sks', label: 'SKS', type: 'number' },
      ],
      createFields: ['nama_matkul', 'sks'],
      updateFields: ['nama_matkul', 'sks'],
    },
    {
      key: 'kelas',
      label: 'Kelas',
      endpoint: '/api/kelas',
      idField: 'id_kelas',
      fields: [
        { name: 'id_kelas', label: 'ID', type: 'number' },
        { name: 'ruangan', label: 'Ruangan' },
        { name: 'nama_kelas', label: 'Nama Kelas' },
        { name: 'kapasitas_kelas', label: 'Kapasitas', type: 'number' },
      ],
      createFields: ['ruangan', 'nama_kelas', 'kapasitas_kelas'],
      updateFields: ['ruangan', 'nama_kelas', 'kapasitas_kelas'],
    },
    {
      key: 'jadwal',
      label: 'Jadwal',
      endpoint: '/api/jadwal',
      idField: 'id_jadwal',
      fields: [
        { name: 'id_jadwal', label: 'ID', type: 'number' },
        { name: 'hari', label: 'Hari', options: hariOptions },
        { name: 'jam_mulai', label: 'Jam Mulai', type: 'time' },
        { name: 'jam_selesai', label: 'Jam Selesai', type: 'time' },
        { name: 'semester', label: 'Semester', options: semesterOptions },
        { name: 'id_periode', label: 'ID Periode', type: 'number', reference: periodeReference },
        { name: 'id_matkul', label: 'ID Matkul', type: 'number', reference: mataKuliahReference },
        { name: 'id_kelas', label: 'ID Kelas', type: 'number', reference: kelasReference },
        { name: 'id_dosen', label: 'ID Dosen', type: 'number', reference: dosenReference },
      ],
      createFields: ['hari', 'jam_mulai', 'jam_selesai', 'id_matkul', 'id_kelas', 'id_dosen'],
      updateFields: ['hari', 'jam_mulai', 'jam_selesai', 'id_matkul', 'id_kelas', 'id_dosen'],
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
        { name: 'status_krs', label: 'Status KRS', options: statusKrsOptions },
        { name: 'semester', label: 'Semester', options: semesterOptions },
        { name: 'tahun_ajaran', label: 'Tahun Ajaran' },
        { name: 'id_periode', label: 'ID Periode', type: 'number', reference: periodeReference },
        { name: 'tanggal_pengajuan', label: 'Tanggal Pengajuan' },
        { name: 'tanggal_diproses', label: 'Tanggal Diproses' },
      ],
      createFields: ['NRP'],
      updateFields: ['NRP', 'status_krs'],
    },
    {
      key: 'detail_krs',
      label: 'Detail KRS',
      endpoint: '/api/detailkrs',
      idField: 'id_dkrs',
      fields: [
        { name: 'id_dkrs', label: 'ID', type: 'number' },
        { name: 'status_matkul', label: 'Status Matkul', options: statusMatkulOptions },
        { name: 'id_krs', label: 'ID KRS', type: 'number', reference: krsReference },
        { name: 'id_jadwal', label: 'ID Jadwal', type: 'number', reference: jadwalReference },
      ],
      createFields: ['status_matkul', 'id_krs', 'id_jadwal'],
      updateFields: ['status_matkul'],
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
        { name: 'huruf_mutu', label: 'Huruf' },
        { name: 'id_dkrs', label: 'ID Detail KRS', type: 'number', reference: detailKrsReference },
      ],
      createFields: ['nilai_tugas', 'nilai_ETS', 'nilai_EAS', 'id_dkrs'],
      updateFields: ['nilai_tugas', 'nilai_ETS', 'nilai_EAS'],
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
        { name: 'id_dosen', label: 'ID Dosen', type: 'number', nullable: true, reference: dosenReference },
      ],
      createFields: ['email', 'password', 'role', 'NRP', 'id_dosen'],
      updateFields: ['email', 'role', 'NRP', 'id_dosen'],
      extraFields: [{ name: 'password', label: 'Password', type: 'password' }],
    },
  ]

  let selectedKey = 'mahasiswa'
  let rows: DataRow[] = []
  let formData: FormData = {}
  let formMode: FormMode = 'create'
  let editingRow: DataRow | null = null
  let searchTerm = ''
  let isLoading = false
  let isSaving = false
  let errorMessage = ''
  let successMessage = ''
  let referenceOptions: Record<string, ReferenceOption[]> = {}

  const getResource = (key: string) => resources.find((item) => item.key === key) ?? resources[0]

  $: resource = getResource(selectedKey)
  $: activeFields = getActiveFields(resource, formMode, formData.role)
  $: filteredRows = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? '').toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
  )

  onMount(() => {
    resetForm('create', null, resource)
    fetchRows(resource)
    loadReferenceOptions(resource)
  })

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
    roleValue: string | number | null = formData.role
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

    if (labelParts.length > 0) {
      return labelParts.join(' - ')
    }

    return String(row[reference.valueField] ?? '')
  }

  async function loadReferenceOptions(resourceConfig: Resource = resource) {
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

  function resetForm(mode: FormMode = 'create', row: DataRow | null = null, resourceConfig: Resource = resource) {
    const nextFields = getActiveFields(resourceConfig, mode, row?.role ?? '')
    const nextData: FormData = {}

    for (const field of nextFields) {
      nextData[field.name] = row?.[field.name] ?? ''
    }

    formMode = mode
    editingRow = row
    formData = nextData
  }

  async function fetchRows(resourceConfig: Resource = resource) {
    isLoading = true
    errorMessage = ''

    try {
      const response = await fetch(resourceConfig.endpoint)
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to load data')
      }

      rows = Array.isArray(data) ? data : []
    } catch (error) {
      rows = []
      errorMessage = error instanceof Error ? error.message : 'Failed to load data'
    } finally {
      isLoading = false
    }
  }

  async function readResponse(response: Response) {
    const text = await response.text()
    return text ? JSON.parse(text) : null
  }

  function selectResource(key: string) {
    const nextResource = getResource(key)

    selectedKey = key
    searchTerm = ''
    successMessage = ''
    resetForm('create', null, nextResource)
    fetchRows(nextResource)
    loadReferenceOptions(nextResource)
  }

  function refreshCurrentResource() {
    fetchRows()
    loadReferenceOptions()
  }

  function editRow(row: DataRow) {
    successMessage = ''
    resetForm('edit', row)
  }

  function setFieldValue(field: Field, event: Event) {
    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement
    const value = field.type === 'checkbox' && target instanceof HTMLInputElement
      ? (target.checked ? 1 : 0)
      : target.value
    const nextData: FormData = {
      ...formData,
      [field.name]: value,
    }

    if (resource.key === 'users' && field.name === 'role') {
      if (value !== 'mahasiswa') {
        nextData.NRP = ''
      }

      if (value !== 'dosen') {
        nextData.id_dosen = ''
      }
    }

    formData = nextData
  }

  function normalizeValue(field: Field, value: string | number | null | undefined): string | number | null {
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
        throw new Error(data.error ?? 'Failed to save data')
      }

      successMessage = formMode === 'edit' ? 'Data updated.' : 'Data created.'

      if (typeof data?.updatedMahasiswa === 'number') {
        successMessage = `Periode aktif saved. ${data.updatedMahasiswa} mahasiswa updated.`
      }

      resetForm('create')
      await loadReferenceOptions()
      await fetchRows()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to save data'
    } finally {
      isSaving = false
    }
  }

  async function deleteRow(row: DataRow) {
    const id = row[resource.idField]

    if (!window.confirm(`Delete ${resource.label} #${id}?`)) {
      return
    }

    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch(`${resource.endpoint}/${id}`, {
        method: 'DELETE',
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to delete data')
      }

      successMessage = 'Data deleted.'
      resetForm('create')
      await loadReferenceOptions()
      await fetchRows()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete data'
    }
  }

  async function requestCuti(row: DataRow) {
    const id = row[resource.idField]

    if (!window.confirm('Apakah kamu yakin ingin mengajukan cuti?')) {
      return
    }

    errorMessage = ''
    successMessage = ''

    try {
      const response = await fetch(`${resource.endpoint}/${id}/cuti`, {
        method: 'PUT',
      })
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to submit cuti')
      }

      successMessage = `Mahasiswa ${data.NRP} sekarang berstatus Cuti.`
      resetForm('create')
      await loadReferenceOptions()
      await fetchRows()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to submit cuti'
    }
  }
</script>

<svelte:head>
  <title>SIAKAD Universitas Cendekia</title>
</svelte:head>

<main class="app-shell">
  <header class="topbar">
    <div>
      <p class="eyebrow">SIAKAD</p>
      <h1>Universitas Cendekia</h1>
    </div>
    <button class="refresh-button" type="button" on:click={refreshCurrentResource} disabled={isLoading}>
      Refresh
    </button>
  </header>

  <div class="workspace">
    <aside class="sidebar" aria-label="Database tables">
      {#each resources as item}
        <button
          class:selected={selectedKey === item.key}
          type="button"
          on:click={() => selectResource(item.key)}
        >
          {item.label}
        </button>
      {/each}
    </aside>

    <section class="content">
      <div class="section-head">
        <div>
          <p class="eyebrow">Table</p>
          <h2>{resource.label}</h2>
        </div>
        <label class="search">
          <span>Search</span>
          <input bind:value={searchTerm} type="search" placeholder="Search rows" />
        </label>
      </div>

      {#if errorMessage}
        <p class="notice error">{errorMessage}</p>
      {/if}

      {#if successMessage}
        <p class="notice success">{successMessage}</p>
      {/if}

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
                    <td>{row[field.name] ?? '-'}</td>
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

    <section class="editor">
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
                  {#each referenceOptions[getFieldReferenceKey(field)] ?? [] as option}
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
  </div>
</main>
