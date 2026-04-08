import { motion } from 'framer-motion'

const STEPS = [
  'Validating business profile…',
  'Analysing revenue signals…',
  'Computing credit score…',
  'Generating decision…',
]

export default function ProcessingView({ step }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ textAlign: 'center', padding: '32px 0' }}
    >
      <div className="pulse-loader" style={{ margin: '0 auto 32px' }}>
        <div className="pulse-dot" />
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
        Processing Application
      </h3>
      <p className="text-muted" style={{ marginBottom: 28 }}>
        Our engine is evaluating your application
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280, margin: '0 auto' }}>
        {STEPS.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= step ? 1 : 0.25, x: 0 }}
            transition={{ delay: i * 0.4 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 8,
              background: i <= step ? 'rgba(59,130,246,0.08)' : 'transparent',
              border: `1px solid ${i <= step ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < step ? '#10b981' : i === step ? '#3b82f6' : 'var(--border)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.82rem', color: i <= step ? 'var(--text)' : 'var(--muted)' }}>{s}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
