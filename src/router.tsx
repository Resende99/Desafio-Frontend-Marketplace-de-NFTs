import { createRootRoute, createRoute, createRouter, lazyRouteComponent } from '@tanstack/react-router'
import { RootLayout } from './components/RootLayout'
import { RoutePending } from './components/RoutePending'
const rootRoute = createRootRoute({ component: RootLayout })
const homePageComponent = lazyRouteComponent(() => import('./routes/HomePage'), 'HomePage')
const nftPageComponent = lazyRouteComponent(() => import('./routes/NftPage'), 'NftPage')
// Warm only the route requested by the initial document while the app runtime starts.
if (typeof window !== 'undefined') {
  if (window.location.pathname === '/') void homePageComponent.preload?.()
  else if (window.location.pathname.startsWith('/nft/')) void nftPageComponent.preload?.()
}
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
    sort: typeof search.sort === 'string' ? search.sort : 'recent',
    page: typeof search.page === 'number' ? search.page : Number(search.page) || 1,
  }),
  component: homePageComponent,
})
const nftRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nft/$nftId', component: nftPageComponent })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', validateSearch:(s:Record<string,unknown>)=>({returnTo:typeof s.returnTo==='string'?s.returnTo:undefined}), component: lazyRouteComponent(() => import('./routes/AuthPage'), 'AuthPage') })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', validateSearch:(s:Record<string,unknown>)=>({returnTo:typeof s.returnTo==='string'?s.returnTo:undefined}), component: lazyRouteComponent(() => import('./routes/AuthPage'), 'AuthPage') })
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: lazyRouteComponent(() => import('./routes/CartPage'), 'CartPage') })
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: lazyRouteComponent(() => import('./routes/CheckoutPage'), 'CheckoutPage') })
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders/$orderId', component: lazyRouteComponent(() => import('./routes/OrderPage'), 'OrderPage') })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: lazyRouteComponent(() => import('./routes/ProfilePage'), 'ProfilePage') })
const notFoundRoute = createRoute({ getParentRoute: () => rootRoute, path: '/404', component:()=><main className="detail-page"><h1>Página não encontrada</h1><a href="/">Voltar ao início</a></main> })
export const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute,nftRoute,loginRoute,registerRoute,cartRoute,checkoutRoute,orderRoute,profileRoute,notFoundRoute]), defaultPendingComponent: RoutePending, defaultPendingMs: 0, defaultPendingMinMs: 0, defaultNotFoundComponent:()=> <main className="detail-page"><h1>Página não encontrada</h1><a href="/">Voltar ao início</a></main> })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
