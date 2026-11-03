import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/** Supabase Storage expone una API compatible con S3. */
export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
})

export const PROTECTED_PREFIX = 'protegidos'

/** URL firmada de corta duración para un archivo protegido. */
export function signedUrl(filename: string, opts: { download?: boolean; expiresIn?: number } = {}) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `${PROTECTED_PREFIX}/${filename}`,
      ResponseContentDisposition: opts.download ? `attachment; filename="${filename}"` : undefined,
    }),
    { expiresIn: opts.expiresIn ?? 300 },
  )
}
