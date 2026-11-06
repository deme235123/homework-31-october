import { useState } from 'react'
import { login } from './auth'

export default function LoginForm({ onLogin }) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [busy, setBusy] = useState(false)

	async function handleSubmit(e) {
		e.preventDefault()
		setError('')
		setBusy(true)
		try {
			const user = await login(email, password)
			onLogin(user)
		} catch (err) {
			setError(err.message)
		} finally {
			setBusy(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
			<h2>Admin login</h2>
			{error && <p style={{ color: 'crimson' }}>{error}</p>}
			<label style={{ display: 'grid', gap: 2 }}>
				email
				<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
			</label>
			<label style={{ display: 'grid', gap: 2 }}>
				password
				<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
			</label>
			<button type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
		</form>
	)
}