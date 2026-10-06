import { env } from '../../config/env.js'

/** URL đầy đủ của file media (API trả đường dẫn tương đối theo gateway, vd. /cms-api/uploads/x.png). */
export const mediaUrl = (u) => (!u ? '' : /^(https?:|data:|blob:)/.test(u) ? u : `${env.apiGateway}${u.startsWith('/') ? '' : '/'}${u}`)
