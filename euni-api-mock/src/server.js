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

/*
 * Khi deploy, mock được tích hợp qua API gateway như các service khác: https://api-gateway-demo.humg.edu.vn/euni-mock-api
 * (FE đặt NEXT_PUBLIC_API_GATEWAY_URL = URL đó). Gateway có thể cắt hoặc giữ tiền tố /euni-mock-api khi chuyển tiếp,
 * nên mọi route gắn trên một router và router được gắn ở cả '/' lẫn BASE_PATH. Mọi URL mock trả về đều TƯƠNG ĐỐI
 * (vd. media `cms-api/uploads/x.png`), không bắt đầu bằng '/' — để không làm mất tiền tố /euni-mock-api của base URL.
 */
const BASE_PATH = (process.env.BASE_PATH || '/euni-mock-api').replace(/\/+$/, '')
const gw = express.Router()
gw.use('/cms-api/uploads', express.static(join(dirname(fileURLToPath(import.meta.url)), '..', 'uploads')))
gw.use('/cms-api', tenantMiddleware, cms, serviceRouter('cms-api'))
gw.use('/auth-api/api/v1', authRouter)
for (const s of SERVICES) gw.use(`/${s}`, serviceRouter(s))
gw.get('/', (_req, res) => res.json({ name: 'HUMG eUni API mock gateway', services: ['cms-api', 'auth-api', ...SERVICES], docs: 'docs/openapi.json' }))
gw.get('/docs/openapi.json', (_req, res) => res.sendFile(join(dirname(fileURLToPath(import.meta.url)), '..', 'contract', 'openapi.json')))
if (BASE_PATH) app.use(BASE_PATH, gw)
app.use(gw)
app.use((_req, res) => res.status(404).json({ message: 'Endpoint không tồn tại.' }))
app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ message: err.message || 'Lỗi hệ thống.' }) })

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'
app.listen(port, host, () => console.log(`✔ eUni API mock gateway: http://${host}:${port}`))
