import axios, { AxiosError } from 'axios'
import type { ApiError } from '../types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

export const ensureCsrf = async () => { await api.get('/csrf') }
export const errorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  const data = (error as AxiosError<ApiError>)?.response?.data
  return data?.message || fallback
}
export const money = (value: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(value)
export const prettyStatus = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
