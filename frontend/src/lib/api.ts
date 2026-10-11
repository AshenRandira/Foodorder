import axios, { AxiosError } from 'axios'
import type { ApiError } from '../types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

type CsrfResponse = { headerName: string; parameterName: string; token: string }
let csrfHeaderName = 'X-XSRF-TOKEN'
let csrfToken: string | null = null

api.interceptors.request.use(config => {
  if (csrfToken && !['get', 'head', 'options'].includes(config.method?.toLowerCase() || 'get')) {
    config.headers.set(csrfHeaderName, csrfToken)
  }
  return config
})

export const ensureCsrf = async () => {
  const response = await api.get<CsrfResponse>('/csrf')
  csrfHeaderName = response.data.headerName
  csrfToken = response.data.token
}
export const errorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  const data = (error as AxiosError<ApiError>)?.response?.data
  return data?.message || fallback
}
export const money = (value: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value)
export const prettyStatus = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
