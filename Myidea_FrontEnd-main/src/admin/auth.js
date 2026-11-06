const API_URL = import.meta.env.VITE_API_URL
const KEY = 'adminToken'

// The token is kept in the browser, so a page reload does not log you out
export function getToken() {
	return localStorage.getItem(KEY)
}
export function saveToken(token) {
	localStorage.setItem(KEY, token)
}
export function clearToken() {
	localStorage.removeItem(KEY)
}

// POST /api/auth/login. Gives back the user, or throws with the server's message
export async function login(email, password) {
	const res = await fetch(`${API_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.message || 'Login failed')
	if (data.user.role !== 'admin') throw new Error('This account is not an admin')
	saveToken(data.accessToken)
	return data.user
}

// Like fetch, but adds "Authorization: Bearer <token>" to OUR server's requests.
// A 401 means the token is missing, wrong or expired: forget it and tell the page.
export async function authFetch(url, options = {}) {
	const token = getToken()
	const headers = { ...options.headers }
	if (token) headers.Authorization = `Bearer ${token}`
	const res = await fetch(url, { ...options, headers })
	if (res.status === 401) {
		clearToken()
		window.dispatchEvent(new Event('logout'))
	}
	return res
}