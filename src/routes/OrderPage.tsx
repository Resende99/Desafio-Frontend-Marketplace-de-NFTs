import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { SiteHeader } from '../components/SiteHeader'
import { useProtected } from '../hooks/useProtected'
import type { Order } from '../types/domain'
import { formatEth } from '../lib/utils'

export function OrderPage(){
  const auth=useProtected(),{orderId}=useParams({from:'/orders/$orderId'}),client=useQueryClient(),[settleError,setSettleError]=useState('')
  const order=useQuery({queryKey:['order',auth.user?.id,orderId],queryFn:async()=>(await api.get<Order>(`/orders/${orderId}`)).data,enabled:!!auth.user,refetchInterval:(query)=>query.state.data?.status==='pending'?8_000:false})
  if(!auth.ready||!auth.user)return <SiteHeader/>
  const settle=async()=>{setSettleError('');try{await api.post(`/orders/${orderId}/settle`);sessionStorage.removeItem('forma.order.key');await client.invalidateQueries({queryKey:['order',auth.user!.id,orderId]});await client.invalidateQueries({queryKey:['cart',auth.user!.id]})}catch{setSettleError('A confirmação excedeu o tempo esperado. O pedido continua pendente; tente novamente.') }}
  const reject=async()=>{await api.post(`/orders/${orderId}/reject`);await client.invalidateQueries({queryKey:['order',auth.user!.id,orderId]})}
  return <><SiteHeader/><main className="detail-page">{order.isLoading?<div className="state-panel">Recuperando pedido…</div>:!order.data?<div className="state-panel"><h2>Pedido não encontrado</h2><a href="/profile">Voltar ao perfil</a></div>:<section className="receipt-card"><span className={`order-status ${order.data.status}`}>{order.data.status==='confirmed'?<CheckCircle2 size={18}/>:<Clock3 size={18}/>} {order.data.status==='confirmed'?'Compra confirmada':order.data.status==='rejected'?'Pagamento recusado':'Pagamento pendente'}</span><h1>Recibo da compra</h1><p>Pedido {order.data.id}</p><div className="receipt-items">{order.data.items.map(item=><div className="summary-line" key={item.nftId}><span>{item.nft.name}</span><strong>{formatEth(item.price)}</strong></div>)}</div><div className="summary-line total"><span>Total</span><strong>{formatEth(order.data.total)}</strong></div><div className="detail-meta"><span>Carteira</span><strong>{order.data.wallet.slice(0,10)}…{order.data.wallet.slice(-6)}</strong><span>Rede</span><strong>{order.data.network}</strong><span>Data</span><strong>{new Date(order.data.createdAt).toLocaleString('pt-BR')}</strong></div>{order.data.status==='pending'&&<div className="demo-payment"><p>O pedido fica salvo e será recuperado ao atualizar a página.</p>{settleError&&<p role="alert" className="form-error">{settleError}</p>}<button className="connect-button" onClick={()=>void settle()}>Simular confirmação do pagamento</button><button className="text-button" onClick={()=>void reject()}>Simular pagamento recusado</button><button className="text-button" onClick={()=>void order.refetch()}><RefreshCw size={14}/> Reconciliar com o servidor</button></div>}{order.data.status==='confirmed'&&<p className="coupon-success">As obras compradas foram removidas do carrinho.</p>}{order.data.status==='rejected'&&<p className="form-error">O pedido foi recusado. Seus itens continuam no carrinho.</p>}</section>}</main></>
}
