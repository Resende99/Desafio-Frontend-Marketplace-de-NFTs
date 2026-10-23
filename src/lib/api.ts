import axios from 'axios'
import { mocksReady } from '../mocks/enableMocks'
export const api = axios.create({ baseURL: '/api', timeout: 8000, headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use(async (config) => {
  await mocksReady
  const token = localStorage.getItem('forma.session')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
