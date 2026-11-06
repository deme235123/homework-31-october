import { authFetch } from './auth'

const API_URL = import.meta.env.VITE_API_URL

// 1. Ask our server for a signature (admins only, so the token goes with it)
// 2. Send the file straight to Cloudinary (plain fetch: our token is never sent to Cloudinary)
export async function uploadImage(file) {
	const signRes = await authFetch(`${API_URL}/api/uploads/sign`, { method: 'POST' })
	if (!signRes.ok) throw new Error('Could not get an upload signature')
	const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json()

	const body = new FormData()
	body.append('file', file)
	body.append('api_key', apiKey)
	body.append('timestamp', timestamp)
	body.append('folder', folder)
	body.append('signature', signature)

	const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
		method: 'POST',
		body,
	})
	const data = await upRes.json()
	if (!upRes.ok) throw new Error(data.error?.message || 'Upload failed')

	// This shape matches images: [{ url, publicId }] in the Product model
	return { url: data.secure_url, publicId: data.public_id }
}