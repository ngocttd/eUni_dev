import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cms } from './cms.js'
import { authRouter } from './auth.js'
import { serviceRouter, SERVICES } from './datasets.js'
import { getStore } from './store.js'
import { tenantMiddleware } from './tenant.js'

const app = express()
const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
app.use(cors({ origin: origins.length ? origins : true, credentials: true, exposedHeaders: ['X-Total-Count', 'ETag'] }))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))
app.use((req, _res, next) => { if (process.env.API_LOG !== 'false') console.log(req.method, req.originalUrl); next() })

getStore()
app.use('/cms-api/uploads', express.static(join(dirname(fileURLToPath(import.meta.url)), '..', 'uploads')))
app.use('/cms-api', tenantMiddleware, cms)
app.use('/auth-api/api', authRouter)
for (const s of SERVICES) app.use(`/${s}`, serviceRouter(s))
app.get('/', (_req, res) => res.json({ name: 'HUMG eUni API mock gateway', services: ['cms-api', 'auth-api', ...SERVICES], docs: '/docs/openapi.json' }))
app.get('/docs/openapi.json', (_req, res) => res.sendFile(join(dirname(fileURLToPath(import.meta.url)), '..', 'contract', 'openapi.json')))
app.use((_req, res) => res.status(404).json({ message: 'Endpoint không tồn tại.' }))
app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ message: err.message || 'Lỗi hệ thống.' }) })

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'
app.listen(port, host, () => console.log(`✔ eUni API mock gateway: http://${host}:${port}`))
