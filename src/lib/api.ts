import axios from 'axios'
import { mocksReady } from '../mocks/enableMocks'
import { responseSchema } from './apiSchemas'

export const api = axios.create({ baseURL: '/api', timeout: 8000, headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use(async (config) => {
  await mocksReady
  const token = localStorage.getItem('kurio.session')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use((response) => {
  if (response.status === 204) return response

  const contentType = String(response.headers['content-type'] ?? '').toLowerCase()
  if (!contentType.includes('application/json') && !contentType.includes('+json')) {
    throw new Error(`Resposta inválida da API: esperado JSON, recebido ${contentType || 'sem Content-Type'}.`)
  }

  const method = (response.config.method ?? 'GET').toUpperCase()
  const path = (response.config.url ?? '').split('?')[0].replace(/^\/api(?=\/)/, '').replace(/\/$/, '') || '/'
  const schema = responseSchema(method, path)
  if (!schema) throw new Error(`Resposta da API sem schema cadastrado: ${method} ${path}.`)

  const result = schema.safeParse(response.data)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new Error(`Resposta inválida da API (${method} ${path}): ${issue?.path.join('.') || 'contrato'} ${issue?.message ?? 'não corresponde ao schema'}.`)
  }
  response.data = result.data
  return response
})
