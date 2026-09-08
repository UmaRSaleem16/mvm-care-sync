import axios, { AxiosError, AxiosInstance } from 'axios'

// Empty string means relative URLs — nginx proxy handles routing in Docker
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent token refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config) & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('no refresh token')
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh/`, {
          refresh,
        })
        localStorage.setItem('access_token', data.access)
        original.headers!.Authorization = `Bearer ${data.access}`
        return apiClient(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
