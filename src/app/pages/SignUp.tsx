import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useUser } from '../context/UserContext'
import { PageTransition } from '../components/PageTransition'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { BackButton } from '../components/BackButton'
import { GameLayout, ScreenTitle } from '../components/GameLayout'
import { useLang } from '../context/LanguageContext'

export default function SignUp() {
  const navigate = useNavigate()
  const { login } = useUser()
  const { t } = useLang()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' })
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const next = { email: '', password: '', confirm: '' }
    if (!email) next.email = t('auth.error.email_required')
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = t('auth.error.email_invalid2')
    if (!password) next.password = t('auth.error.password_required')
    else if (password.length < 6) next.password = t('auth.error.password_min2')
    if (!confirm) next.confirm = t('auth.error.confirm_required')
    else if (password !== confirm) next.confirm = t('auth.error.passwords_mismatch')
    setErrors(next)
    return !next.email && !next.password && !next.confirm
  }

  const handleSignUp = async () => {
    if (!validate()) return
    setIsLoading(true)
    // TODO: replace with real auth API call
    await new Promise<void>((resolve) => setTimeout(resolve, 1000))
    toast.success(t('auth.signup.success'))
    login(email)
    setIsLoading(false)
    navigate('/email-confirmation')
  }

  return (
    <PageTransition>
      <GameLayout>
        <div className="flex flex-col items-center justify-center flex-1 gap-8 py-20 px-6">
          <ScreenTitle>{t('auth.signup.title')}</ScreenTitle>

          {[
            { label: t('auth.login.email'), key: 'email', type: 'email', value: email, set: setEmail, error: errors.email },
            { label: t('auth.login.password'), key: 'password', type: 'password', value: password, set: setPassword, error: errors.password },
            { label: t('auth.signup.confirm'), key: 'confirm', type: 'password', value: confirm, set: setConfirm, error: errors.confirm },
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
            {t('auth.signup.submit')}
          </Button>
        </div>

        <BackButton to="/" />
      </GameLayout>
    </PageTransition>
  )
}
