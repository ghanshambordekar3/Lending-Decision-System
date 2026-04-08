import { motion } from 'framer-motion'
import { Building2, IndianRupee, ArrowRight } from 'lucide-react'

const BUSINESS_TYPES = [
  { value: 'retail',        label: 'Retail',         icon: '🛍️' },
  { value: 'manufacturing', label: 'Manufacturing',   icon: '🏭' },
  { value: 'services',      label: 'Services',        icon: '💼' },
  { value: 'other',         label: 'Other',           icon: '🔧' },
]

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

function validate(data) {
  const errs = {}
  if (!data.owner_name?.trim()) errs.owner_name = 'Required'
  if (!PAN_RE.test((data.pan || '').toUpperCase())) errs.pan = 'Format: ABCDE1234F'
  if (!data.business_type) errs.business_type = 'Select a type'
  const rev = parseFloat(data.monthly_revenue)
  if (!data.monthly_revenue || isNaN(rev) || rev <= 0) errs.monthly_revenue = 'Must be > 0'
  return errs
}

export default function ProfileStep({ data, onChange, onNext }) {
  const errs = validate(data)
  const hasErrors = Object.keys(errs).length > 0

  const handleNext = () => {
    if (!hasErrors) onNext()
  }

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
          background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Building2 size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Business Profile</h2>
          <p className="text-muted">Tell us about your business</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="grid-2">
          <div className="field">
            <label>Owner Name</label>
            <input
              placeholder="Rajesh Kumar"
              value={data.owner_name || ''}
              onChange={e => onChange('owner_name', e.target.value)}
              className={errs.owner_name && data.owner_name !== undefined ? 'error' : ''}
            />
            {errs.owner_name && data.owner_name !== undefined && (
              <span className="err-msg">{errs.owner_name}</span>
            )}
          </div>

          <div className="field">
            <label>PAN Number</label>
            <input
              placeholder="ABCDE1234F"
              value={data.pan || ''}
              onChange={e => onChange('pan', e.target.value.toUpperCase())}
              maxLength={10}
              className={errs.pan && data.pan !== undefined ? 'error' : ''}
            />
            {errs.pan && data.pan !== undefined && (
              <span className="err-msg">{errs.pan}</span>
            )}
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Business Type</label>
            <div className="biz-type-grid">
              {BUSINESS_TYPES.map(t => (
                <motion.div
                  key={t.value}
                  className={`biz-type-card${data.business_type === t.value ? ' selected' : ''}${errs.business_type && data.business_type !== undefined && data.business_type !== t.value ? ' error-card' : ''}`}
                  onClick={() => onChange('business_type', t.value)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="biz-icon">{t.icon}</span>
                  <span className="biz-label">{t.label}</span>
                </motion.div>
              ))}
            </div>
            {errs.business_type && data.business_type !== undefined && (
              <span className="err-msg">{errs.business_type}</span>
            )}
          </div>

          <div className="field">
            <label>Monthly Revenue (₹)</label>
            <div style={{ position: 'relative' }}>
              <IndianRupee size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                placeholder="500000"
                value={data.monthly_revenue || ''}
                onChange={e => onChange('monthly_revenue', e.target.value)}
                style={{ paddingLeft: 30 }}
                className={errs.monthly_revenue && data.monthly_revenue !== undefined ? 'error' : ''}
              />
            </div>
            {errs.monthly_revenue && data.monthly_revenue !== undefined && (
              <span className="err-msg">{errs.monthly_revenue}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <motion.button
          className="btn btn-primary w-full"
          onClick={handleNext}
          disabled={hasErrors}
          whileHover={!hasErrors ? { scale: 1.02 } : {}}
          whileTap={!hasErrors ? { scale: 0.97 } : {}}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <span>Continue to Loan Details</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <ArrowRight size={18} strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  )
}
