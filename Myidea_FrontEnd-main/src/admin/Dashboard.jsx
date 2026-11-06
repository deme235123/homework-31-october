import { useEffect, useState } from 'react'
import { authFetch } from './auth'

const API_URL = import.meta.env.VITE_API_URL

// ---- Each student edits this part: the numbers THEIR /api/admin/stats sends ----
const cards = [
	{ key: 'users', label: 'Users' },
	{ key: 'admins', label: 'Admins' },
	{ key: 'blocked', label: 'Blocked users' },
	{ key: 'products', label: 'Products' },
	{ key: 'outOfStock', label: 'Out of stock' },
	{ key: 'categories', label: 'Categories' },
]
// ---------------------------------------------------------------------------------

export default function Dashboard() {
	const [stats, setStats] = useState(null)
	const [error, setError] = useState('')

	useEffect(() => {
		authFetch(`${API_URL}/api/admin/stats`)
			.then(async (res) => {
				const data = await res.json()
				if (!res.ok) throw new Error(data.message || 'Could not load the numbers')
				setStats(data)
			})
			.catch((err) => setError(err.message))
	}, [])

	if (error) return <p style={{ color: 'crimson' }}>{error}</p>
	if (!stats) return <p>Loading...</p>

	return (
		<section>
			<h2>Dashboard</h2>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
				{cards.map((c) => (
					<div key={c.key} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12 }}>
						<div style={{ fontSize: 32, fontWeight: 700 }}>{stats[c.key]}</div>
						<div>{c.label}</div>
					</div>
				))}
			</div>
			<h3>Newest users</h3>
			<ul>
				{stats.newestUsers.map((u) => (
					<li key={u._id}>
						{u.name} · {u.email}
					</li>
				))}
			</ul>
		</section>
	)
}