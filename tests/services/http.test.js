import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The client talks to the store (tokens) and the router (back to login)
const { store, router } = vi.hoisted(() => ({
    store: { getters: {}, commit: vi.fn(), dispatch: vi.fn() },
    router: { push: vi.fn() },
}))
vi.mock('@/store', () => ({ default: store }))
vi.mock('@/router', () => ({ default: router }))

let HTTP
let OrganizationService
beforeAll(async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test')
    ;({ HTTP } = await import('@/services/http'))
    OrganizationService = (await import('@/services/OrganizationService')).default
})

// The server is played at axios's adapter level, so no network is involved. An
// error carries the response and the request config, which is all the client uses.
const fail = (status, config) => {
    const error = new Error(`Request failed with status code ${status}`)
    error.config = config
    error.response = { status, data: { error: `status ${status}` }, headers: {}, config }
    return error
}
let seen
const serverReplies = (...statuses) => {
    seen = []
    HTTP.defaults.adapter = async (config) => {
        seen.push(config)
        const status = statuses[Math.min(seen.length, statuses.length) - 1]
        if (status >= 400) throw fail(status, config)
        return { data: { ok: true, call: seen.length }, status, statusText: 'OK', headers: {}, config, request: {} }
    }
}
const authorizationOf = (config) => config.headers.Authorization

describe('requests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.getters = { accessToken: 'access-1', refreshToken: 'refresh-1' }
    })

    it('go to the API address with credentials and JSON', async () => {
        serverReplies(200)

        await HTTP.post('/contacts', { name: 'Acme' })

        expect(seen[0].baseURL).toBe('https://api.example.test')
        expect(seen[0].withCredentials).toBe(true)
        expect(String(seen[0].headers['Content-Type'])).toContain('application/json')
    })

    it('carry the access token', async () => {
        serverReplies(200)

        await HTTP.get('/invoices')

        expect(authorizationOf(seen[0])).toBe('Bearer access-1')
    })

    it('carry no Authorization header when nobody is logged in', async () => {
        store.getters = { accessToken: null, refreshToken: null }
        serverReplies(200)

        await HTTP.get('/invoices')

        expect(authorizationOf(seen[0])).toBeUndefined()
    })

    it('use the refresh token, and only that, for the token refresh', async () => {
        serverReplies(200)

        await HTTP.post('/auth/refresh-token', {})

        expect(authorizationOf(seen[0])).toBe('Bearer refresh-1')
    })

    it('hand back the response of a successful call', async () => {
        serverReplies(200)

        const response = await HTTP.get('/invoices')

        expect(response.status).toBe(200)
        expect(response.data).toEqual({ ok: true, call: 1 })
    })
})

describe('an expired access token (401)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.getters = { accessToken: 'access-1', refreshToken: 'refresh-1' }
        // refreshing swaps in a new access token
        store.dispatch.mockImplementation(async (action) => {
            if (action === 'refresh') store.getters = { ...store.getters, accessToken: 'access-2' }
        })
    })

    it('is refreshed once and the request is repeated with the new token', async () => {
        serverReplies(401, 200)

        const response = await HTTP.get('/invoices')

        expect(store.dispatch).toHaveBeenCalledTimes(1)
        expect(store.dispatch).toHaveBeenCalledWith('refresh')
        expect(seen).toHaveLength(2)
        expect(authorizationOf(seen[0])).toBe('Bearer access-1')
        expect(authorizationOf(seen[1])).toBe('Bearer access-2')
        expect(response.data).toEqual({ ok: true, call: 2 })
    })

    it('gives up after one retry instead of looping', async () => {
        serverReplies(401, 401, 401)

        await expect(HTTP.get('/invoices')).rejects.toMatchObject({ response: { status: 401 } })

        expect(seen).toHaveLength(2)
        expect(store.dispatch).toHaveBeenCalledTimes(1)
    })

    it('keeps the request body when it is repeated', async () => {
        serverReplies(401, 200)

        await HTTP.post('/contacts', { name: 'Acme' })

        expect(JSON.parse(seen[1].data)).toEqual({ name: 'Acme' })
        expect(seen[1].method).toBe('post')
        expect(seen[1].url).toBe('/contacts')
    })
})

describe('a refresh token that is no longer accepted', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.getters = { accessToken: 'access-1', refreshToken: 'refresh-1' }
    })

    it('logs the user out and goes to the login page, without trying to refresh', async () => {
        serverReplies(401)

        await expect(HTTP.post('/auth/refresh-token', {})).rejects.toMatchObject({ response: { status: 401 } })

        expect(store.commit).toHaveBeenCalledWith('CLEAR_USER_DATA')
        expect(store.commit).toHaveBeenCalledWith('SET_LAYOUT', 'login-layout')
        expect(router.push).toHaveBeenCalledWith('/login')
        expect(store.dispatch).not.toHaveBeenCalled()
    })
})

describe('other failures', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.getters = { accessToken: 'access-1', refreshToken: 'refresh-1' }
    })

    it.each([403, 404, 409, 422, 429, 500])('pass through untouched (%i)', async (status) => {
        serverReplies(status)

        await expect(HTTP.get('/invoices')).rejects.toMatchObject({ response: { status } })

        expect(seen).toHaveLength(1)
        expect(store.dispatch).not.toHaveBeenCalled()
        expect(store.commit).not.toHaveBeenCalled()
        expect(router.push).not.toHaveBeenCalled()
    })

    it('pass through when there was no response at all (network down)', async () => {
        const offline = new Error('Network Error')
        HTTP.defaults.adapter = async () => {
            throw offline
        }

        await expect(HTTP.get('/invoices')).rejects.toBe(offline)

        expect(store.dispatch).not.toHaveBeenCalled()
    })
})

describe('file uploads', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        store.getters = { accessToken: 'access-1', refreshToken: 'refresh-1' }
    })

    it('send the logo as a file (multipart), not converted to JSON by the JSON default', async () => {
        serverReplies(200)
        const form = new FormData()
        form.append('file', new File(['logo bytes'], 'logo.png', { type: 'image/png' }))

        await OrganizationService.uploadLogo(1, form)

        expect(seen[0].url).toBe('/organizations/1/upload-logo')
        expect(seen[0].data).toBeInstanceOf(FormData)
        expect(seen[0].data.get('file').name).toBe('logo.png')
        expect(String(seen[0].headers['Content-Type'])).not.toContain('application/json')
    })
})
