import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const post = (await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1 })).docs[0]
  if (!post) notFound()
  return (
    <article>
      <h1>{post.title}</h1>
      {post.content && <RichText data={post.content} />}
    </article>
  )
}
