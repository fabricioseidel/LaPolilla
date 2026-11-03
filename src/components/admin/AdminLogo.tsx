import { MothMark } from '../Logo'

export default function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <MothMark size={56} color="#E8B04B" />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 600 }}>La Polilla</span>
        <span style={{ fontSize: 11, letterSpacing: '0.42em', textTransform: 'uppercase', opacity: 0.7, marginTop: 4 }}>
          Editorial
        </span>
      </div>
    </div>
  )
}
