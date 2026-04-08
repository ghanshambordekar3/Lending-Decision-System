import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, TrendingDown, BarChart2, Clock, AlertOctagon, ShieldAlert, Activity } from 'lucide-react'

// Each reason code: severity (critical/warning/info), icon, label, description, what to do
const REASON_META = {
  LOW_REVENUE: {
    severity: 'critical',
    icon: TrendingDown,
    label: 'Low Revenue',
    description: 'Monthly revenue is insufficient to service the estimated EMI.',
    action: 'Reduce loan amount or increase tenure to lower the EMI burden.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
  },
  HIGH_LOAN_RATIO: {
    severity: 'critical',
    icon: BarChart2,
    label: 'High Loan Ratio',
    description: 'Loan amount exceeds 30× your monthly revenue.',
    action: 'Consider a smaller loan amount relative to your revenue.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.25)',
  },
  DATA_INCONSISTENCY: {
    severity: 'critical',
    icon: ShieldAlert,
    label: 'Data Inconsistency',
    description: 'Loan amount is more than 50× monthly revenue — likely a data error.',
    action: 'Verify your revenue and loan figures. Score is hard-capped at 30.',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.1)',
    border: 'rgba(220,38,38,0.3)',
  },
  TENURE_TOO_SHORT: {
    severity: 'warning',
    icon: Clock,
    label: 'Tenure Too Short',
    description: 'Repayment tenure is under 6 months, creating high monthly stress.',
    action: 'Extend tenure to at least 12 months for a better score.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  TENURE_TOO_LONG: {
    severity: 'warning',
    icon: AlertOctagon,
    label: 'Tenure Too Long',
    description: 'Tenure exceeds 84 months, elevating long-term default risk.',
    action: 'Reduce tenure to under 84 months if cash flow allows.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  SCORE_BELOW_THRESHOLD: {
    severity: 'info',
    icon: Activity,
    label: 'Score Below Threshold',
    description: 'Overall credit score is below the minimum approval threshold of 50.',
    action: 'Improve revenue-to-EMI ratio or reduce loan amount to boost score.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
  },
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 }
const SEVERITY_LABEL = { critical: 'Critical', warning: 'Warning', info: 'Info' }

function ScoreRing({ score, approved }) {
  const [displayed, setDisplayed] = useState(0)
  const radius = 54
  const circ = 2 * Math.PI * radius
  const color = approved ? '#10b981' : score >= 35 ? '#f59e0b' : '#ef4444'

  useEffect(() => {
    let start = null
    const duration = 1200
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setDisplayed(Math.round(progress * score))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [score])

  const offset = circ - (displayed / 100) * circ

  return (
    <div className="score-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <div className="score-center">
        <span className="score-number" style={{ color }}>{displayed}</span>
        <span className="score-label">/ 100</span>
      </div>
    </div>
  )
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function DecisionResult({ result, onReset }) {
  const approved = result.status === 'Approved'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Status banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '18px 24px', borderRadius: 12, marginBottom: 28,
          background: approved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1.5px solid ${approved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}
      >
        {approved
          ? <CheckCircle2 size={28} color="#10b981" />
          : <XCircle size={28} color="#ef4444" />
        }
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: approved ? '#10b981' : '#ef4444' }}>
            {result.status}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Application ID: {result.application_id?.slice(0, 8)}…
          </div>
        </div>
      </motion.div>

      {/* Score + EMI */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: 16, marginBottom: 20 }}
      >
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credit Score</p>
          <ScoreRing score={result.credit_score} approved={approved} />
        </div>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Monthly EMI</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>₹ {fmt(result.emi)}</p>
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Decision</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: approved ? '#10b981' : '#ef4444' }}>{result.status}</p>
          </div>
        </div>
      </motion.div>

      {/* Reason codes */}
      {result.reason_codes?.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ marginBottom: 20 }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} color="var(--warning)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Reason Codes
              </span>
            </div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px',
              borderRadius: 20, background: 'rgba(239,68,68,0.12)',
              color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)'
            }}>
              {result.reason_codes.length} flag{result.reason_codes.length > 1 ? 's' : ''} found
            </span>
          </div>

          {/* Cards — sorted critical first */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...result.reason_codes]
              .sort((a, b) => (SEVERITY_ORDER[REASON_META[a]?.severity] ?? 9) - (SEVERITY_ORDER[REASON_META[b]?.severity] ?? 9))
              .map((code, i) => {
                const meta = REASON_META[code] || {
                  severity: 'info', icon: AlertTriangle, label: code,
                  description: 'Unexpected flag returned by the engine.',
                  action: 'Contact support if this persists.',
                  color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)',
                }
                const Icon = meta.icon
                return (
                  <motion.div
                    key={code}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.38 + i * 0.1, ease: 'easeOut' }}
                    style={{
                      background: meta.bg,
                      border: `1.5px solid ${meta.border}`,
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: `${meta.color}22`,
                      border: `1px solid ${meta.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color={meta.color} strokeWidth={2.5} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: meta.color }}>
                          {meta.label}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px',
                          borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: `${meta.color}22`, color: meta.color,
                          border: `1px solid ${meta.border}`,
                        }}>
                          {SEVERITY_LABEL[meta.severity]}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 600,
                          color: 'var(--muted)', marginLeft: 'auto',
                          background: 'var(--surface2)', padding: '1px 7px', borderRadius: 4,
                          border: '1px solid var(--border)',
                        }}>
                          {code}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: 5 }}>
                        {meta.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                        <span style={{ fontSize: '0.7rem', color: meta.color, fontWeight: 700, flexShrink: 0 }}>Fix →</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.4 }}>{meta.action}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </motion.div>
      )}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="btn btn-ghost w-full"
        onClick={onReset}
        style={{ marginTop: 4, gap: 8 }}
      >
        <motion.span
          animate={{ rotate: [0, -360] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          style={{ display: 'inline-flex' }}
        >
          <RefreshCw size={15} />
        </motion.span>
        New Application
      </motion.button>
    </motion.div>
  )
}
