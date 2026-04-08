import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Landmark } from 'lucide-react'
import ProfileStep from './ProfileStep'
import LoanStep from './LoanStep'
import ReviewStep from './ReviewStep'
import ProcessingView from './ProcessingView'
import DecisionResult from './DecisionResult'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STEPS = ['Profile', 'Loan', 'Review']

function StepIndicator({ current }) {
  return (
    <div className="steps">
      {STEPS.map((label, i) => (
        <div key={label} className="step-item" style={{ flex: i < STEPS.length - 1 ? '1' : 'none' }}>
          <div className={`step-circle ${i < current ? 'done' : i === current ? 'active' : 'idle'}`}>
            {i < current ? <CheckCheck size={14} /> : i + 1}
          </div>
          <span className={`step-label ${i === current ? 'active' : ''}`}>{label}</span>
          {i < STEPS.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState(0)          // 0=profile 1=loan 2=review 3=processing 4=result
  const [procStep, setProcStep] = useState(0)  // processing animation step
  const [profile, setProfile] = useState({})
  const [loan, setLoan] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const updateProfile = (k, v) => setProfile(p => ({ ...p, [k]: v }))
  const updateLoan = (k, v) => setLoan(l => ({ ...l, [k]: v }))

  // Animate processing steps
  useEffect(() => {
    if (step !== 3) return
    setProcStep(0)
    const timers = [1, 2, 3].map((s, i) =>
      setTimeout(() => setProcStep(s), (i + 1) * 700)
    )
    return () => timers.forEach(clearTimeout)
  }, [step])

  const submit = async () => {
    setStep(3)
    setError(null)
    try {
      const body = {
        profile: {
          owner_name: profile.owner_name,
          pan: profile.pan,
          business_type: profile.business_type,
          monthly_revenue: parseFloat(profile.monthly_revenue),
        },
        loan: {
          loan_amount: parseFloat(loan.loan_amount),
          tenure_months: parseInt(loan.tenure_months),
          purpose: loan.purpose,
        },
      }
      const res = await fetch(`${API}/api/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.detail?.[0]?.msg || data?.message || 'Request failed')
      }
      // Ensure processing animation plays for at least 2.8s
      await new Promise(r => setTimeout(r, 2800))
      setResult(data)
      setStep(4)
    } catch (e) {
      setError(e.message)
      setStep(2)
    }
  }

  const reset = () => {
    setStep(0)
    setProfile({})
    setLoan({})
    setResult(null)
    setError(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.06) 0%, transparent 60%), var(--bg)',
    }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 40, padding: '8px 18px', marginBottom: 16,
        }}>
          <Landmark size={18} color="#3b82f6" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            MSME Lending Platform
          </span>
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Instant Credit Decision
        </h1>
        <p className="text-muted" style={{ marginTop: 6 }}>
          Apply for a business loan and get a decision in seconds
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{ width: '100%', maxWidth: 520 }}
      >
        {step < 3 && <StepIndicator current={step} />}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              fontSize: '0.85rem', color: '#fca5a5',
            }}
          >
            ⚠ {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <ProfileStep key="profile" data={profile} onChange={updateProfile} onNext={() => setStep(1)} />
          )}
          {step === 1 && (
            <LoanStep key="loan" data={loan} onChange={updateLoan} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          )}
          {step === 2 && (
            <ReviewStep key="review" profile={profile} loan={loan} onSubmit={submit} onBack={() => setStep(1)} loading={false} />
          )}
          {step === 3 && (
            <ProcessingView key="processing" step={procStep} />
          )}
          {step === 4 && result && (
            <DecisionResult key="result" result={result} onReset={reset} />
          )}
        </AnimatePresence>
      </motion.div>

      <p style={{ marginTop: 20, fontSize: '0.72rem', color: 'var(--muted)' }}>
        Powered by MSME Credit Engine · All decisions are simulated
      </p>
    </div>
  )
}
