import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { supabase } from '@/services/supabase' // ✅ fixed path

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/* ---------------- REQUEST INTERCEPTOR ---------------- */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      if (token) {
        if (!config.headers) {
          config.headers = {}
        }

        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (err) {
      console.error('Error getting session:', err)
    }

    return config
  },
  (error) => Promise.reject(error)
)

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut()
    }
    return Promise.reject(error)
  }
)

/* ---------------- API METHODS ---------------- */
const ApiService = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.get(url, config).then((res) => res.data)
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.post(url, data, config).then((res) => res.data)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.put(url, data, config).then((res) => res.data)
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.patch(url, data, config).then((res) => res.data)
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return apiClient.delete(url, config).then((res) => res.data)
  },

  upload<T = any>(url: string, payload: FormData): Promise<T> {
    return apiClient
      .post(url, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((res) => res.data)
  }
}

export default ApiService
