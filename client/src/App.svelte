<script lang="ts">
  import { onMount } from 'svelte'

  type Field = {
    name: string
    label: string
    type?: string
    options?: string[]
    nullable?: boolean
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

  const semesterOptions = ['Ganjil', 'Genap']
  const statusAktifOptions = ['Aktif', 'Cuti', 'Nonaktif', 'Lulus', 'DO']
  const statusKrsOptions = ['Diajukan', 'Disetujui', 'Ditolak']
  const statusMatkulOptions = ['Aktif', 'Lulus', 'Mengulang']
  const roleOptions = ['admin', 'dosen', 'mahasiswa']
  const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

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
      key: 'mahasiswa',
      label: 'Mahasiswa',
      endpoint: '/api/mahasiswa',
      idField: 'NRP',
      fields: [
        { name: 'NRP', label: 'NRP', type: 'number' },
        { name: 'nama_mahasiswa', label: 'Nama Mahasiswa' },
        { name: 'angkatan', label: 'Angkatan', type: 'number' },
        { name: 'semester', label: 'Semester', options: semesterOptions },
        { name: 'status_aktif', label: 'Status Aktif', options: statusAktifOptions },
        { name: 'id_departemen', label: 'ID Departemen', type: 'number' },
      ],
      createFields: ['NRP', 'nama_mahasiswa', 'angkatan', 'semester', 'status_aktif', 'id_departemen'],
      updateFields: ['nama_mahasiswa', 'angkatan', 'semester', 'status_aktif', 'id_departemen'],
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
        { name: 'id_departemen', label: 'ID Departemen', type: 'number' },
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
        { name: 'id_matkul', label: 'ID Matkul', type: 'number' },
        { name: 'id_kelas', label: 'ID Kelas', type: 'number' },
        { name: 'id_dosen', label: 'ID Dosen', type: 'number' },
      ],
      createFields: ['hari', 'jam_mulai', 'jam_selesai', 'semester', 'id_matkul', 'id_kelas', 'id_dosen'],
      updateFields: ['hari', 'jam_mulai', 'jam_selesai', 'semester', 'id_matkul', 'id_kelas', 'id_dosen'],
    },
    {
      key: 'krs',
      label: 'KRS',
      endpoint: '/api/krs',
      idField: 'id_krs',
      fields: [
        { name: 'id_krs', label: 'ID', type: 'number' },
        { name: 'NRP', label: 'NRP', type: 'number' },
        { name: 'total_sks', label: 'Total SKS', type: 'number' },
        { name: 'status_krs', label: 'Status KRS', options: statusKrsOptions },
        { name: 'semester', label: 'Semester', options: semesterOptions },
        { name: 'tahun_ajaran', label: 'Tahun Ajaran' },
      ],
      createFields: ['NRP', 'status_krs', 'semester', 'tahun_ajaran'],
      updateFields: ['NRP', 'status_krs', 'semester', 'tahun_ajaran'],
    },
    {
      key: 'detail_krs',
      label: 'Detail KRS',
      endpoint: '/api/detailkrs',
      idField: 'id_dkrs',
      fields: [
        { name: 'id_dkrs', label: 'ID', type: 'number' },
        { name: 'status_matkul', label: 'Status Matkul', options: statusMatkulOptions },
        { name: 'id_krs', label: 'ID KRS', type: 'number' },
        { name: 'id_jadwal', label: 'ID Jadwal', type: 'number' },
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
        { name: 'id_dkrs', label: 'ID Detail KRS', type: 'number' },
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
        { name: 'NRP', label: 'NRP', type: 'number', nullable: true },
        { name: 'id_dosen', label: 'ID Dosen', type: 'number', nullable: true },
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

  const getResource = (key: string) => resources.find((item) => item.key === key) ?? resources[0]

  $: resource = getResource(selectedKey)
  $: activeFields = getActiveFields(resource, formMode)
  $: filteredRows = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? '').toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
  )

  onMount(() => {
    resetForm('create', null, resource)
    fetchRows(resource)
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

  function getActiveFields(resourceConfig: Resource, mode: FormMode): Field[] {
    const names = mode === 'edit' ? resourceConfig.updateFields : resourceConfig.createFields
    return names.map((name) => getField(resourceConfig, name))
  }

  function resetForm(mode: FormMode = 'create', row: DataRow | null = null, resourceConfig: Resource = resource) {
    const nextFields = getActiveFields(resourceConfig, mode)
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
  }

  function editRow(row: DataRow) {
    successMessage = ''
    resetForm('edit', row)
  }

  function setFieldValue(field: Field, event: Event) {
    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement

    formData = {
      ...formData,
      [field.name]: target.value,
    }
  }

  function normalizeValue(field: Field, value: string | number | null | undefined): string | number | null {
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
      resetForm('create')
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
      await fetchRows()
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete data'
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
    <button class="refresh-button" type="button" on:click={() => fetchRows()} disabled={isLoading}>
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
            {#if field.options}
              <select value={formData[field.name] ?? ''} on:change={(event) => setFieldValue(field, event)}>
                <option value="">Pilih</option>
                {#each field.options as option}
                  <option value={option}>{option}</option>
                {/each}
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
