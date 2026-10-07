import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

let memoryAccessToken = null
let clearAuthState = () => {}
let refreshPromise = null

export function setAccessToken(token) {
  memoryAccessToken = token
  if (token) {
    localStorage.setItem('accessToken', token)
  } else {
    localStorage.removeItem('accessToken')
  }
}

export function getAccessToken() {
  return memoryAccessToken || localStorage.getItem('accessToken')
}

export function registerAuthHandlers(onAuthFailure) {
  clearAuthState = onAuthFailure
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isRefreshRequest = originalRequest?.url?.endsWith('/auth/refresh-token')

    if (error.response?.status !== 401 || originalRequest?._retry || isRefreshRequest) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true },
          )
          .then(({ data }) => {
            setAccessToken(data.accessToken)
            return data.accessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const token = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${token}`
      return api(originalRequest)
    } catch (refreshError) {
      setAccessToken(null)
      clearAuthState()
      window.location.assign('/login')
      return Promise.reject(refreshError)
    }
  },
)

export default api
