import axios from 'axios'
import store from '@/store'
import router from '@/router'

let baseURL = 'https://invoicer-api.wayand.dk'

if (location.hostname === 'localhost' || 
    location.hostname === '192.168.0.173' || 
    location.hostname.includes('.local')) {
    baseURL = 'http://localhost:5000'
}

export const HTTP = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

HTTP.interceptors.request.use(config => {
    let token = store.getters.accessToken

    if(config.url.includes('auth/refresh-token')) {
        token = store.getters.refreshToken
        console.log('Token is refreshed!')
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, error => {
    return Promise.reject(error)
})

HTTP.interceptors.response.use((response) => {
    return response
}, async error => {
    const originalRequest = error.config
    if (error.response?.status === 401 && originalRequest.url.includes('auth/refresh-token')) {
        console.log('error.response.data', error.response.data)
        store.commit('CLEAR_USER_DATA')
        store.commit('SET_LAYOUT', 'login-layout')
        router.push('/login')
        return Promise.reject(error)
    } else if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        await store.dispatch("refresh")
        return HTTP(originalRequest);
    }
    return Promise.reject(error)
})