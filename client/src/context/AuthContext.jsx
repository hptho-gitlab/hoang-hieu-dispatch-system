import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, {
  getAccessToken,
  registerAuthHandlers,
  setAccessToken,
} from '../api/axiosClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessTokenState] = useState(getAccessToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    registerAuthHandlers(() => {
      setUser(null)
      setAccessTokenState(null)
    })

    let active = true
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user)
      })
      .catch(() => {
        if (active) {
          setUser(null)
          setAccessToken(null)
          setAccessTokenState(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    setAccessToken(data.accessToken)
    setAccessTokenState(data.accessToken)
    setUser(data.user)
    return data
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setAccessTokenState(null)
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({ user, accessToken, login, logout, loading }),
    [user, accessToken, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
