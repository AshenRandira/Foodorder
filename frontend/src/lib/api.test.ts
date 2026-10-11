import { afterEach, describe, expect, it } from 'vitest'
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { api, ensureCsrf } from './api'

describe('API CSRF handling', () => {
  const originalAdapter = api.defaults.adapter

  afterEach(() => {
    api.defaults.adapter = originalAdapter
  })

  it('adds the token returned by the CSRF endpoint to mutation requests', async () => {
    const requests: InternalAxiosRequestConfig[] = []
    const adapter: AxiosAdapter = async config => {
      requests.push(config)
      return {
        data: config.url === '/csrf' ? { headerName: 'X-XSRF-TOKEN', parameterName: '_csrf', token: 'server-token' } : {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }
    api.defaults.adapter = adapter

    await ensureCsrf()
    await api.post('/admin/auth/login', { username: 'demo', password: 'demo-password' })

    expect(requests).toHaveLength(2)
    expect(requests[1].headers.get('X-XSRF-TOKEN')).toBe('server-token')
  })
})
