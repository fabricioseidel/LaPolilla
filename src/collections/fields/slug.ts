import type { Field } from 'payload'

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const slugField = (from: string): Field => ({
  name: 'slug',
  label: 'URL (se genera sola)',
  type: 'text',
  unique: true,
  index: true,
  admin: { position: 'sidebar' },
  hooks: {
    beforeValidate: [({ value, data }) => (value ? slugify(value) : data?.[from] ? slugify(data[from]) : value)],
  },
})
