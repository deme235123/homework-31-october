import { useEffect, useState } from 'react'
import ResourceAdmin from './ResourceAdmin'
import LoginForm from './LoginForm'
import Dashboard from './Dashboard'
import { getToken, clearToken, authFetch } from './auth'

const API_URL = import.meta.env.VITE_API_URL

// ---- Each student edits this part: names of THEIR models and fields ----
const productFields = [
	{ name: 'title', type: 'text' },
	{ name: 'description', type: 'textarea' },
	{ name: 'price', type: 'number' },
	{ name: 'stock', type: 'number' },
	{ name: 'category', type: 'select', optionsFrom: 'categories', optionLabel: 'name' },
	{ name: 'images', type: 'images' },
	{ name: 'isActive', type: 'checkbox' },
]
// The filter bar above the products list (names match the ?query names of the API)
const productFilters = [
	{ name: 'category', label: 'Category', optionsFrom: 'categories', optionLabel: 'name' },
	{
		name: 'inStock',
		label: 'Stock',
		options: [
			{ value: 'true', label: 'In stock' },
			{ value: 'false', label: 'Out of stock' },
		],
	},
	{
		name: 'active',
		label: 'Status',
		options: [
			{ value: 'true', label: 'Active' },
			{ value: 'false', label: 'Hidden' },
		],
	},
	{ name: 'minPrice', label: 'Min price', type: 'number' },
	{ name: 'maxPrice', label: 'Max price', type: 'number' },
	{
		name: 'sort',
		label: 'Sort',
		allLabel: 'Newest first',
		options: [
			{ value: 'oldest', label: 'Oldest first' },
			{ value: 'price-asc', label: 'Price: low to high' },
			{ value: 'price-desc', label: 'Price: high to low' },
			{ value: 'title', label: 'Title A to Z' },
		],
	},
]
const productColumns = [
	{ key: 'title' },
	{ key: 'price' },
	{ key: 'stock' },
	{ key: 'category', render: (p) => p.category?.name },
	{ key: 'images', render: (p) => p.images?.[0] && <img src={p.images[0].url} alt="" width="48" /> },
]

const categoryFields = [
	{ name: 'name', type: 'text' },
	{ name: 'slug', type: 'text' },
	{ name: 'parent', type: 'select', optionsFrom: 'categories', optionLabel: 'name' },
]
const categoryColumns = [{ key: 'name' }, { key: 'slug' }, { key: 'parent', render: (c) => c.parent?.name }]

const userFields = [
	{ name: 'name', type: 'text' },
	{ name: 'email', type: 'email' },
	{ name: 'password', type: 'password' }, // only used when creating
	{ name: 'isBlocked', type: 'checkbox', default: false },
]
const userColumns = [{ key: 'name' }, { key: 'email' }, { key: 'role' }, { key: 'isBlocked', label: 'blocked' }]

// An extra button on every user row: make admin or make customer
async function toggleRole(user) {
	const role = user.role === 'admin' ? 'customer' : 'admin'
	const res = await authFetch(`${API_URL}/api/users/${user._id}/role`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ role }),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.message || 'Could not change the role')
}
const userActions = [{ name: 'role', label: (u) => (u.role === 'admin' ? 'Make customer' : 'Make admin'), onClick: toggleRole }]
// -------------------------------------------------------------------------

export default function AdminPage() {
	const [tab, setTab] = useState('dashboard')
	const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()))

	// authFetch sends a "logout" event when the server answers 401 (for example, the token expired)
	useEffect(() => {
		const onLogout = () => setLoggedIn(false)
		window.addEventListener('logout', onLogout)
		return () => window.removeEventListener('logout', onLogout)
	}, [])

	function logout() {
		clearToken()
		setLoggedIn(false)
	}

	if (!loggedIn) return <LoginForm onLogin={() => setLoggedIn(true)} />

	return (
		<div>
			<nav style={{ display: 'flex', gap: 8 }}>
				<button onClick={() => setTab('dashboard')}>Dashboard</button>
				<button onClick={() => setTab('products')}>Products</button>
				<button onClick={() => setTab('categories')}>Categories</button>
				<button onClick={() => setTab('users')}>Users</button>
				<button onClick={logout} style={{ marginLeft: 'auto' }}>Log out</button>
			</nav>
			{tab === 'dashboard' && <Dashboard />}
			{tab === 'products' && (
				<ResourceAdmin
					resource="products"
					title="Products"
					fields={productFields}
					columns={productColumns}
					searchable
					filters={productFilters}
				/>
			)}
			{tab === 'categories' && (
				<ResourceAdmin resource="categories" title="Categories" fields={categoryFields} columns={categoryColumns} />
			)}
			{tab === 'users' && (
				<ResourceAdmin
					resource="users"
					title="Users"
					fields={userFields}
					columns={userColumns}
					searchable
					rowActions={userActions}
				/>
			)}
		</div>
	)
}