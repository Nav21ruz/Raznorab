import { Router } from 'express'
import crypto from 'node:crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../env.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { ApiError, asyncRoute } from '../errors.js'

export const uploadsRouter = Router()
uploadsRouter.use(requireAuth)

const ALLOWED_FOLDERS = new Set(['orders', 'builder-portfolio'])
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

let s3Client = null
function getS3() {
  if (!env.s3.endpoint || !env.s3.bucket) {
    throw new ApiError(500, 'Загрузка фото не настроена на сервере (нет S3_ENDPOINT/S3_BUCKET)')
  }
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: env.s3.endpoint,
      region: env.s3.region,
      credentials: { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey },
    })
  }
  return s3Client
}

// Файл заливается напрямую из браузера в Object Storage по временной подписанной
// ссылке — так его байты не идут через наш сервер (там жёсткий лимит на размер тела запроса).
uploadsRouter.post('/sign', asyncRoute(async (req, res) => {
  const { folder, contentType } = req.body ?? {}
  if (!ALLOWED_FOLDERS.has(folder)) throw new ApiError(400, 'Некорректная папка загрузки')
  if (!ALLOWED_TYPES.has(contentType)) throw new ApiError(400, 'Разрешены только изображения (jpeg/png/webp)')

  const ext = contentType.split('/')[1]
  const key = `${folder}/${req.userId}/${crypto.randomUUID()}.${ext}`

  const uploadUrl = await getSignedUrl(
    getS3(),
    new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  )
  const publicUrl = `${env.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`
  res.json({ uploadUrl, publicUrl })
}))
