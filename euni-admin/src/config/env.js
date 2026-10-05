/**
 * Cấu hình môi trường (xem .env.example).
 * Mọi lời gọi API đi qua API gateway: `${apiGateway}/<service>/...`
 *   mock (dev):  http://127.0.0.1:3000          → repo euni-api-mock
 *   demo thật:   https://api-gateway-demo.humg.edu.vn
 */
const trim = (s) => String(s || '').replace(/\/+$/, '')

export const env = Object.freeze({
  apiGateway: trim(process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://127.0.0.1:3000'),
  apiTimeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT || 15000),
  enableApiLog: process.env.NEXT_PUBLIC_API_LOG === 'true',
})
