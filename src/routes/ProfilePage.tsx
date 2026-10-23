import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { QueryErrorState } from '../components/QueryErrorState'
import { SiteHeader } from '../components/SiteHeader'
import { useProtected } from '../hooks/useProtected'
import { useAuth } from '../state/useAuth'
import type { Wallet } from '../types/domain'

async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function ProfilePage() {
  const auth = useProtected()
  const { signOut } = useAuth()
  const client = useQueryClient()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState<'Ethereum' | 'Polygon'>('Ethereum')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const wallets = useQuery({
    queryKey: ['wallets', auth.user?.id],
    queryFn: async () => (await api.get<Wallet[]>('/wallets')).data,
    enabled: !!auth.user,
  })

  if (!auth.ready || !auth.user) return <SiteHeader />

  const feedback = (text: string) => { setMessage(text); setError('') }
  const failure = (cause: unknown) => {
    setError((cause as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Não foi possível salvar.')
    setMessage('')
  }
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await api.patch('/profile', { name: name || auth.user!.name, avatar: avatar || auth.user!.avatar })
      await auth.refresh()
      feedback('Perfil atualizado.')
    } catch (cause) { failure(cause) }
  }
  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await api.post('/profile/password', { currentHash: await hash(currentPassword), newHash: await hash(newPassword), newLength: newPassword.length })
      setCurrentPassword('')
      setNewPassword('')
      feedback('Senha atualizada.')
    } catch (cause) { failure(cause) }
  }
  const addWallet = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await api.put('/wallets', { address, network, primary: !wallets.data?.length })
      setAddress('')
      await client.invalidateQueries({ queryKey: ['wallets', auth.user!.id] })
      feedback('Carteira adicionada.')
    } catch (cause) { failure(cause) }
  }
  const setPrimaryWallet = async (wallet: Wallet) => {
    try {
      await api.patch(`/wallets/${wallet.id}/primary`, {})
      await client.invalidateQueries({ queryKey: ['wallets', auth.user!.id] })
    } catch (cause) { failure(cause) }
  }

  return <><SiteHeader /><main className="section-shell profile-page">
    <span className="eyebrow muted">CONTA KURIO</span>
    <h1 className="page-title">Seu perfil</h1>
    <div className="profile-layout">
      <section className="profile-panel">
        <h2>Dados pessoais</h2>
        <form onSubmit={event => void saveProfile(event)}>
          <label>Nome<input value={name || auth.user.name} onChange={event => setName(event.target.value)} /></label>
          <label>E-mail<input value={auth.user.email} readOnly /></label>
          <label>URL do avatar<input type="url" placeholder="https://…" value={avatar || new URL(auth.user.avatar, window.location.origin).href} onChange={event => setAvatar(event.target.value)} /></label>
          <button className="connect-button">Salvar perfil</button>
        </form>
      </section>
      <section className="profile-panel">
        <h2>Carteiras</h2>
        {wallets.isError ? <QueryErrorState onRetry={() => void wallets.refetch()} /> : Array.isArray(wallets.data) && wallets.data.map(wallet => <div className="wallet-row" key={wallet.id}>
          <span><strong>{wallet.address.slice(0, 10)}…{wallet.address.slice(-5)}</strong><small>{wallet.network}{wallet.primary ? ' · Principal' : ' · Secundária'}</small></span>
          {!wallet.primary && <button className="text-button" onClick={() => void setPrimaryWallet(wallet)}>Definir principal</button>}
        </div>)}
        <form onSubmit={event => void addWallet(event)}>
          <label>Endereço<input value={address} onChange={event => setAddress(event.target.value)} placeholder="0x + 40 caracteres" /></label>
          <label>Rede<select value={network} onChange={event => setNetwork(event.target.value as 'Ethereum' | 'Polygon')}><option>Ethereum</option><option>Polygon</option></select></label>
          <button className="connect-button">Adicionar carteira</button>
        </form>
      </section>
      <section className="profile-panel">
        <h2>Alterar senha</h2>
        <form onSubmit={event => void savePassword(event)}>
          <label>Senha atual<input type="password" required minLength={8} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
          <label>Nova senha<input type="password" required minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
          <button className="connect-button">Atualizar senha</button>
        </form>
      </section>
      <section className="profile-panel account-panel">
        <h2>Sessão</h2>
        <p>Sua sessão expira após 30 minutos de inatividade.</p>
        <button className="text-button" onClick={() => void signOut()}>Sair da conta</button>
      </section>
    </div>
    {message && <p className="coupon-success" role="status">{message}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </main></>
}
