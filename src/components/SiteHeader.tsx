import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingBag, Menu, Search, X } from 'lucide-react'
import { useAuth } from '../state/useAuth'

export function SiteHeader() {
  const { user } = useAuth()
  const menuRef = useRef<HTMLDialogElement>(null)

  const closeMenu = () => menuRef.current?.close()

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" search={{ q: undefined, category: undefined, sort: 'recent', page: 1 }} className="brand">KURIO</Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="/#explorar">Início</a><a href="/#explorar">Mercado</a><Link to="/profile">Criadores</Link><a href="/#sobre">Aprenda</a>
        </nav>
        <div className="header-actions">
          <a href="/#explorar" className="icon-button" aria-label="Buscar"><Search size={18} /></a>
          <Link to="/cart" className="icon-button cart-header" aria-label="Sacola"><ShoppingBag size={18} /></Link>
          {user ? <Link className="connect-button" to="/profile">Minha conta</Link> : <Link className="connect-button" to="/login" search={{ returnTo: undefined }}>Entrar</Link>}
          <button className="mobile-menu" aria-label="Abrir menu" aria-haspopup="dialog" onClick={() => menuRef.current?.showModal()}><Menu size={22} /></button>
        </div>
      </div>
      <dialog className="mobile-nav-dialog" ref={menuRef} aria-labelledby="mobile-nav-title" onClick={event => { if (event.target === event.currentTarget) closeMenu() }}>
        <div className="mobile-nav-heading"><h2 id="mobile-nav-title">Menu</h2><button type="button" aria-label="Fechar menu" onClick={closeMenu}><X size={20} /></button></div>
        <nav aria-label="Navegação mobile">
          <a href="/#explorar" onClick={closeMenu}>Início</a><a href="/#explorar" onClick={closeMenu}>Mercado</a>
          <Link to="/profile" onClick={closeMenu}>Criadores</Link><a href="/#sobre" onClick={closeMenu}>Aprenda</a>
          <Link to="/cart" onClick={closeMenu}>Sacola</Link>
        </nav>
      </dialog>
    </header>
  )
}
