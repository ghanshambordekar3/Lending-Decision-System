import { motion } from 'framer-motion'
import { ClipboardCheck, ArrowLeft, Send } from 'lucide-react'

function fmt(n) {
  return Number(n).toLocaleString('en-IN')
}

export default function ReviewStep({ profile, loan, onSubmit, onBack, loading }) {
  const rows = [
    { label: 'Owner Name', value: profile.owner_name },
    { label: 'PAN', value: profile.pan },
    { label: 'Business Type', value: profile.business_type?.charAt(0).toUpperCase() + profile.business_type?.slice(1) },
    { label: 'Monthly Revenue', value: `₹ ${fmt(profile.monthly_revenue)}` },
    { label: 'Loan Amount', value: `₹ ${fmt(loan.loan_amount)}` },
    { label: 'Tenure', value: `${loan.tenure_months} months` },
    { label: 'Purpose', value: loan.purpose },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-row" style={{ marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg,#10b981,#059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ClipboardCheck size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Review & Submit</h2>
          <p className="text-muted">Confirm your application details</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map(({ label, value }) => (
          <div key={label} className="flex-between" style={{
            padding: '11px 14px',
            borderRadius: 8,
            background: 'var(--surface2)',
            marginBottom: 4,
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-8" style={{ display: 'flex', gap: 12 }}>
        <motion.button
          className="btn btn-ghost"
          onClick={onBack}
          disabled={loading}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.96 }}
          style={{ flex: 1, gap: 6 }}
        >
          <motion.span
            animate={{ x: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            style={{ display: 'inline-flex' }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </motion.span>
          Back
        </motion.button>
        <motion.button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={loading}
          whileHover={!loading ? { scale: 1.03, boxShadow: '0 8px 32px rgba(59,130,246,0.55)' } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          style={{ flex: 2, gap: 8 }}
        >
          {loading ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                style={{ display: 'inline-flex', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
              />
              Processing…
            </>
          ) : (
            <>
              Submit Application
              <motion.span
                animate={{ y: [0, -3, 0], rotate: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                style={{ display: 'inline-flex' }}
              >
                <Send size={16} strokeWidth={2.5} />
              </motion.span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
