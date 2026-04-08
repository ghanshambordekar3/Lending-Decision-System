import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Banknote, IndianRupee, ArrowLeft, ChevronRight, ChevronDown, Check } from 'lucide-react'

const PURPOSES = [
  { value: 'Working Capital',    icon: '💰' },
  { value: 'Equipment Purchase', icon: '⚙️' },
  { value: 'Business Expansion', icon: '📈' },
  { value: 'Inventory',          icon: '📦' },
  { value: 'Debt Consolidation', icon: '🔄' },
  { value: 'Other',              icon: '📋' },
]

function validate(data) {
  const errs = {}
  const amt = parseFloat(data.loan_amount)
  if (!data.loan_amount || isNaN(amt) || amt <= 0) errs.loan_amount = 'Must be > 0'
  const tenure = parseInt(data.tenure_months)
  if (!data.tenure_months || isNaN(tenure) || tenure < 1 || tenure > 360)
    errs.tenure_months = 'Between 1–360 months'
  if (!data.purpose) errs.purpose = 'Select a purpose'
  return errs
}

function useClickOutside(ref, handler) {
  useState(() => {
    const listener = e => { if (!ref.current || ref.current.contains(e.target)) return; handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  })
}

function PurposeDropdown({ value, onChange, hasError }) {
  const [open, setOpen] = useState(false)
  const ref = { current: null }

  const selected = PURPOSES.find(p => p.value === value)

  return (
    <div className="custom-select-wrap" ref={el => { ref.current = el }}>
      <motion.div
        className={`custom-select-trigger${open ? ' open' : ''}${hasError ? ' error' : ''}`}
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.99 }}
      >
        {selected ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1rem' }}>{selected.icon}</span>
            <span>{selected.value}</span>
          </span>
        ) : (
          <span className="placeholder">Select purpose</span>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ display: 'inline-flex', color: 'var(--muted)', flexShrink: 0 }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="custom-select-panel"
            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
          >
            {PURPOSES.map((p, i) => (
              <motion.div
                key={p.value}
                className={`custom-select-option${value === p.value ? ' selected' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { onChange(p.value); setOpen(false) }}
              >
                <span className="opt-icon">{p.icon}</span>
                <span>{p.value}</span>
                {value === p.value && (
                  <span className="opt-check"><Check size={14} strokeWidth={3} /></span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LoanStep({ data, onChange, onNext, onBack }) {
  const errs = validate(data)
  const hasErrors = Object.keys(errs).length > 0

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
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Banknote size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Loan Details</h2>
          <p className="text-muted">Specify your loan requirements</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="grid-2">
          <div className="field">
            <label>Loan Amount (₹)</label>
            <div style={{ position: 'relative' }}>
              <IndianRupee size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                placeholder="2000000"
                value={data.loan_amount || ''}
                onChange={e => onChange('loan_amount', e.target.value)}
                style={{ paddingLeft: 30 }}
                className={errs.loan_amount && data.loan_amount !== undefined ? 'error' : ''}
              />
            </div>
            {errs.loan_amount && data.loan_amount !== undefined && (
              <span className="err-msg">{errs.loan_amount}</span>
            )}
          </div>

          <div className="field">
            <label>Tenure (Months)</label>
            <input
              type="number"
              placeholder="24"
              min={1}
              max={360}
              value={data.tenure_months || ''}
              onChange={e => onChange('tenure_months', e.target.value)}
              className={errs.tenure_months && data.tenure_months !== undefined ? 'error' : ''}
            />
            {errs.tenure_months && data.tenure_months !== undefined && (
              <span className="err-msg">{errs.tenure_months}</span>
            )}
          </div>
        </div>

        <div className="field">
          <label>Loan Purpose</label>
          <PurposeDropdown
            value={data.purpose || ''}
            onChange={v => onChange('purpose', v)}
            hasError={!!(errs.purpose && data.purpose !== undefined)}
          />
          {errs.purpose && data.purpose !== undefined && (
            <span className="err-msg">{errs.purpose}</span>
          )}
        </div>
      </div>

      <div className="mt-8" style={{ display: 'flex', gap: 12 }}>
        <motion.button
          className="btn btn-ghost"
          onClick={onBack}
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
          onClick={onNext}
          disabled={hasErrors}
          whileHover={!hasErrors ? { scale: 1.02 } : {}}
          whileTap={!hasErrors ? { scale: 0.97 } : {}}
          style={{ flex: 2, gap: 8 }}
        >
          Review Application
          <motion.span
            animate={!hasErrors ? { x: [0, 5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <ChevronRight size={20} strokeWidth={3} />
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  )
}
