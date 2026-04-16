import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useUser } from '../context/UserContext'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { BackButton } from '../components/BackButton'
import { GameLayout, ScreenTitle } from '../components/GameLayout'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const next = { email: '', password: '' }
    if (!email) next.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Invalid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Min 6 characters'
    setErrors(next)
    return !next.email && !next.password
  }

  const handleLogin = async () => {
    if (!validate()) return
    setIsLoading(true)
    await new Promise<void>((r) => setTimeout(r, 900))
    login(email)
    toast.success('Welcome back!')
    setIsLoading(false)
    navigate('/menu')
  }

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">
          <ScreenTitle>Login</ScreenTitle>

          {[
            { label: 'Email', key: 'email', type: 'email', value: email, set: setEmail, error: errors.email },
            { label: 'Password', key: 'password', type: 'password', value: password, set: setPassword, error: errors.password },
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
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          ))}

          <Button onClick={handleLogin} disabled={!email || !password} isLoading={isLoading} className="w-full max-w-xs mt-2">
            Login
          </Button>
        </div>

        <BackButton to="/" />
      </GameLayout>
    </PageTransition>
  )
}
