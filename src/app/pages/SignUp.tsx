import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useUser } from '../context/UserContext'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { BackButton } from '../components/BackButton'
import { GameLayout, ScreenTitle } from '../components/GameLayout'

export default function SignUp() {
  const navigate = useNavigate()
  const { login } = useUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const next = { email: '', password: '', confirm: '' }
    if (!email) next.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Invalid email address'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Must be at least 6 characters'
    if (!confirm) next.confirm = 'Please confirm your password'
    else if (password !== confirm) next.confirm = 'Passwords do not match'
    setErrors(next)
    return !next.email && !next.password && !next.confirm
  }

  const handleSignUp = async () => {
    if (!validate()) return
    setIsLoading(true)
    // TODO: replace with real auth API call
    await new Promise<void>((resolve) => setTimeout(resolve, 1000))
    toast.success('Account created! Check your email.')
    login(email)
    setIsLoading(false)
    navigate('/email-confirmation')
  }

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">
          <ScreenTitle>Sign Up</ScreenTitle>

          {[
            { label: 'Email', key: 'email', type: 'email', value: email, set: setEmail, error: errors.email },
            { label: 'Password', key: 'password', type: 'password', value: password, set: setPassword, error: errors.password },
            { label: 'Confirm', key: 'confirm', type: 'password', value: confirm, set: setConfirm, error: errors.confirm },
          ].map(({ label, key, type, value, set, error }) => (
            <div key={key} className="flex flex-col gap-1.5 w-full max-w-xs">
              <label className="text-xs uppercase tracking-[0.35em] font-serif" style={{ color: '#9b1c1c' }}>
                {label}
              </label>
              <Input
                type={type}
                value={value}
                onChange={(e) => { set(e.target.value); setErrors((p) => ({ ...p, [key]: '' })) }}
                error={error}
                className="w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
            </div>
          ))}

          <Button
            onClick={handleSignUp}
            disabled={!email || !password || !confirm}
            isLoading={isLoading}
            className="w-full max-w-xs mt-2"
          >
            Sign Up
          </Button>
        </div>

        <BackButton to="/" />
      </GameLayout>
    </PageTransition>
  )
}
