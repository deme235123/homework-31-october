import { useEffect, useState } from 'react'
import { uploadImage } from './uploadImage'
import { authFetch } from './auth'

const API_URL = import.meta.env.VITE_API_URL

// Fills a form with the values of an item (or empty values for a new one)
function emptyForm(fields) {
	const form = {}
	for (const f of fields) {
		if (f.default !== undefined) form[f.name] = f.default
		else if (f.type === 'checkbox') form[f.name] = true
		else if (f.type === 'images') form[f.name] = []
		else form[f.name] = ''
	}
	return form
}

// A populated reference comes back as an object. The form needs only its id.
function toFormValue(field, value) {
	if (value === undefined || value === null) return emptyForm([field])[field.name]
	if (field.type === 'select' && typeof value === 'object') return value._id
	return value
}

export default function ResourceAdmin({ resource, title, fields, columns, searchable = false, filters = [], rowActions = [] }) {
	const [items, setItems] = useState([])
	const [options, setOptions] = useState({}) // choices for select fields and filters, by resource name
	const [form, setForm] = useState(emptyForm(fields))
	const [editingId, setEditingId] = useState(null)
	const [error, setError] = useState('')
	const [uploading, setUploading] = useState(false)

	const [reloadKey, setReloadKey] = useState(0)

	// Search and pages
	const [searchInput, setSearchInput] = useState('') // what is typed
	const [search, setSearch] = useState('') // what was searched
	const [filterInput, setFilterInput] = useState({}) // what is chosen in the filter bar
	const [applied, setApplied] = useState({}) // the filters in use
	const [page, setPage] = useState(1)
	const [pages, setPages] = useState(1)
	const [total, setTotal] = useState(0)

	// Load one page of the list again whenever the page, the search or reloadKey changes
	useEffect(() => {
		const params = new URLSearchParams({ page, limit: 10 })
		if (search) params.set('search', search)
		for (const [name, value] of Object.entries(applied)) {
			if (value !== '' && value !== undefined) params.set(name, value)
		}
		authFetch(`${API_URL}/api/${resource}?${params}`)
			.then(async (res) => {
				const data = await res.json()
				// 401 or 403 come back as { message }, not as a list
				if (!res.ok) throw new Error(data.message || 'Could not load the list')
				// A route without pages yet answers with a plain array: show it all on one page
				const list = Array.isArray(data) ? data : data.items
				setItems(list)
				setPages(data.pages || 1)
				setTotal(data.total ?? list.length)
				// The last item of the last page was deleted: go one page back
				if (list.length === 0 && page > 1) setPage((p) => p - 1)
			})
			.catch((err) => setError(err.message))
	}, [resource, reloadKey, page, search, applied])

	// Load the choices for every select field and select filter (each resource only once)
	useEffect(() => {
		const sources = new Set([...fields, ...filters].map((f) => f.optionsFrom).filter(Boolean))
		for (const source of sources) {
			authFetch(`${API_URL}/api/${source}`)
				.then(async (res) => {
					const list = await res.json()
					if (res.ok) setOptions((prev) => ({ ...prev, [source]: list }))
				})
		}
	}, [fields, filters])

	function load() {
		setReloadKey((k) => k + 1)
	}

	function setField(name, value) {
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	function startEdit(item) {
		const next = {}
		for (const f of fields) next[f.name] = toFormValue(f, item[f.name])
		setForm(next)
		setEditingId(item._id)
		setError('')
	}

	function reset() {
		setForm(emptyForm(fields))
		setEditingId(null)
	}

	async function handleFiles(field, files) {
		setUploading(true)
		setError('')
		try {
			const uploaded = []
			for (const file of files) uploaded.push(await uploadImage(file))
			setField(field.name, [...form[field.name], ...uploaded])
		} catch (err) {
			setError(err.message)
		} finally {
			setUploading(false)
		}
	}

	function handleSearch(e) {
		e.preventDefault()
		setPage(1)
		setSearch(searchInput.trim())
		setApplied(filterInput)
	}

	function clearSearch() {
		setSearchInput('')
		setSearch('')
		setFilterInput({})
		setApplied({})
		setPage(1)
	}

	// The choices of one filter: fixed options, or the items of another resource
	function filterChoices(f) {
		if (f.options) return f.options
		return (options[f.optionsFrom] || []).map((o) => ({ value: o._id, label: o[f.optionLabel || 'name'] }))
	}

	const somethingApplied = search || Object.values(applied).some((v) => v !== '' && v !== undefined)

	async function runAction(action, item) {
		setError('')
		try {
			await action.onClick(item)
			load()
		} catch (err) {
			setError(err.message)
		}
	}

	async function handleSubmit(e) {
		e.preventDefault()
		setError('')
		// numbers must be sent as numbers, empty text fields are left out
		const body = {}
		for (const f of fields) {
			const v = form[f.name]
			if (f.type === 'number') body[f.name] = v === '' ? undefined : Number(v)
			else if (v === '' && f.type !== 'checkbox') body[f.name] = undefined
			else body[f.name] = v
		}
		const res = await authFetch(`${API_URL}/api/${resource}${editingId ? `/${editingId}` : ''}`, {
			method: editingId ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		const data = await res.json()
		if (!res.ok) return setError(data.message || 'Something went wrong')
		reset()
		load()
	}

	async function handleDelete(item) {
		if (!window.confirm('Delete this item?')) return
		const res = await authFetch(`${API_URL}/api/${resource}/${item._id}`, { method: 'DELETE' })
		const data = await res.json()
		if (!res.ok) return setError(data.message || 'Could not delete')
		load()
	}

	return (
		<section>
			<h2>{title}</h2>
			{error && <p style={{ color: 'crimson' }}>{error}</p>}

			<form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
				<h3>{editingId ? 'Edit' : 'New'}</h3>
				{fields.map((f) => (
					<label key={f.name} style={{ display: 'grid', gap: 2 }}>
						{f.label || f.name}
						{f.type === 'textarea' && (
							<textarea value={form[f.name]} onChange={(e) => setField(f.name, e.target.value)} />
						)}
						{f.type === 'checkbox' && (
							<input type="checkbox" checked={!!form[f.name]} onChange={(e) => setField(f.name, e.target.checked)} />
						)}
						{f.type === 'select' && (
							<select value={form[f.name]} onChange={(e) => setField(f.name, e.target.value)}>
								<option value="">Choose...</option>
								{(options[f.optionsFrom] || []).map((o) => (
									<option key={o._id} value={o._id}>{o[f.optionLabel || 'name']}</option>
								))}
							</select>
						)}
						{f.type === 'images' && (
							<div>
								<input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => handleFiles(f, [...e.target.files])} />
								{uploading && <span> Uploading...</span>}
								<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
									{form[f.name].map((img) => (
										<div key={img.publicId}>
											<img src={img.url} alt="" width="80" />
											<button type="button" onClick={() => setField(f.name, form[f.name].filter((i) => i.publicId !== img.publicId))}>
												remove
											</button>
										</div>
									))}
								</div>
							</div>
						)}
						{['text', 'number', 'email', 'password'].includes(f.type) && (
							<input type={f.type} value={form[f.name]} onChange={(e) => setField(f.name, e.target.value)} />
						)}
					</label>
				))}
				<div>
					<button type="submit" disabled={uploading}>{editingId ? 'Save changes' : 'Create'}</button>
					{editingId && <button type="button" onClick={reset}>Cancel</button>}
				</div>
			</form>

			{(searchable || filters.length > 0) && (
				<form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'end', marginTop: 24 }}>
					{searchable && (
						<input type="search" placeholder="Search..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
					)}
					{filters.map((f) => (
						<label key={f.name} style={{ display: 'grid', gap: 2 }}>
							{f.label || f.name}
							{f.type === 'number' ? (
								<input
									type="number"
									value={filterInput[f.name] ?? ''}
									onChange={(e) => setFilterInput((prev) => ({ ...prev, [f.name]: e.target.value }))}
									style={{ width: 90 }}
								/>
							) : (
								<select
									value={filterInput[f.name] ?? ''}
									onChange={(e) => setFilterInput((prev) => ({ ...prev, [f.name]: e.target.value }))}
								>
									<option value="">{f.allLabel || 'All'}</option>
									{filterChoices(f).map((o) => (
										<option key={o.value} value={o.value}>{o.label}</option>
									))}
								</select>
							)}
						</label>
					))}
					<button type="submit">Search</button>
					{somethingApplied && <button type="button" onClick={clearSearch}>Clear</button>}
				</form>
			)}

			<table style={{ marginTop: 16 }}>
				<thead>
					<tr>
						{columns.map((c) => <th key={c.key}>{c.label || c.key}</th>)}
						<th></th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<tr key={item._id}>
							{columns.map((c) => (
								<td key={c.key}>{c.render ? c.render(item) : String(item[c.key] ?? '')}</td>
							))}
							<td>
								<button onClick={() => startEdit(item)}>Edit</button>
								<button onClick={() => handleDelete(item)}>Delete</button>
								{rowActions.map((action) => (
									<button key={action.name} onClick={() => runAction(action, item)}>
										{action.label(item)}
									</button>
								))}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
				<button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</button>
				<span>Page {page} of {pages} · {total} items</span>
				<button onClick={() => setPage((p) => p + 1)} disabled={page >= pages}>Next</button>
			</div>
		</section>
	)
}