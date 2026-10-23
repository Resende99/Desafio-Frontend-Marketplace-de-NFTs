import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, Search, X, House, UserRound } from 'lucide-react'
import { useAuth } from '../state/useAuth'
import { useRouterState } from '@tanstack/react-router'
import { useCart } from '../hooks/useCart'
import shopIcon from '../../design/icones/mobile/Shop.svg'

export function SiteHeader() {
  const { user } = useAuth()
  const { cart, isError: cartError } = useCart()
  const menuRef = useRef<HTMLDialogElement>(null)
  const pathname = useRouterState({ select: state => state.location.pathname })
  const cartCount = cart?.items.reduce((total, item) => total + item.quantity, 0)

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
          <Link
            to="/cart"
            className="icon-button cart-header"
            aria-label={cartError ? 'Sacola: falha ao carregar o contador' : `Sacola: ${cartCount ?? 'carregando'} itens`}
            aria-busy={!cart && !cartError}
          >
            <img src={shopIcon} alt="" width="20" height="20" />
            {(cart || cartError) && <span className="cart-count">{cartError ? '!' : cartCount}</span>}
          </Link>
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
      {pathname === '/' && <nav className="mobile-bottom-nav" aria-label="Atalhos mobile">
        <Link to="/" search={{ q: undefined, category: undefined, sort: 'recent', page: 1 }} aria-label="Início"><House size={19} /></Link>
        <a href="/#explorar" aria-label="Buscar obras"><Search size={19} /></a>
        <Link to="/cart" aria-label="Carrinho">
          <img src={shopIcon} alt="" width="20" height="20" />
        </Link>
        <Link to="/profile" aria-label="Meu perfil"><UserRound size={19} /></Link>
      </nav>}
    </header>
  )
}
