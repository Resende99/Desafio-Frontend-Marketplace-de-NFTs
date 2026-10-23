import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { useAuth } from '../state/useAuth'

interface ResourceEvent { id:string; resource:{id:string;version:number} }

export function RealtimeBridge(){
  const {user}=useAuth(),client=useQueryClient(),pathname=useRouterState({select:(state)=>state.location.pathname})
  useEffect(()=>{
    const token=localStorage.getItem('forma.session')
    if(!token||!user||!import.meta.env.DEV)return
    console.info('[Socket client] loading client after MSW startup',{userId:user.id})
    let active=true,socket:Socket|undefined
    let cleanupListeners=()=>{}
    void import('socket.io-client').then(({io})=>{
      if(!active)return
      socket=io(window.location.origin,{path:'/socket.io',addTrailingSlash:false,transports:['websocket'],reconnection:true,reconnectionDelay:500})
      const versions=new Map<string,number>(),seen=new Set<string>()
      const onReady=()=>{
        console.info('[Socket client] session.ready')
        void client.invalidateQueries({queryKey:['nfts']})
        void client.invalidateQueries({queryKey:['cart',user.id]})
        const orderId=pathname.match(/^\/orders\/([^/]+)$/)?.[1]
        if(orderId)socket?.emit('subscribeOrder',orderId)
      }
      const onNft=(event:ResourceEvent)=>{
        console.info('[Socket client] nft.updated received',event)
        if(!event?.id||seen.has(event.id)){console.info('[Socket client] duplicate event ignored',event?.id);return}
        seen.add(event.id)
        const previous=versions.get(event.resource.id)??0
        if(event.resource.version<=previous){console.info('[Socket client] stale version ignored',{id:event.resource.id,version:event.resource.version,previous});return}
        versions.set(event.resource.id,event.resource.version)
        const keys=[['nfts'],['nft',event.resource.id],['cart',user.id]]
        console.info('[Socket client] version accepted; invalidating REST queries',keys)
        void Promise.all(keys.map((queryKey)=>client.invalidateQueries({queryKey}))).then(()=>console.info('[Socket client] REST reconciliation completed',event.resource.id))
      }
      const onOrder=(event:ResourceEvent)=>{
        console.info('[Socket client] order.updated received',event)
        if(!event?.id||seen.has(event.id)){console.info('[Socket client] duplicate event ignored',event?.id);return}
        seen.add(event.id)
        const previous=versions.get(event.resource.id)??0
        if(event.resource.version<=previous){console.info('[Socket client] stale version ignored',{id:event.resource.id,version:event.resource.version,previous});return}
        versions.set(event.resource.id,event.resource.version)
        void client.invalidateQueries({queryKey:['order',user.id,event.resource.id]})
        void client.invalidateQueries({queryKey:['cart',user.id]})
      }
      const onConnect=()=>{console.info('[Socket client] connected; sending authenticated handshake');socket?.emit('authenticate',token)}
      const onConnectError=(error:Error)=>console.error('[Socket client] connection error',error.message)
      socket.on('connect',onConnect)
      socket.on('connect_error',onConnectError)
      socket.on('session.ready',onReady)
      socket.on('nft.updated',onNft)
      socket.on('order.updated',onOrder)
      cleanupListeners=()=>{socket?.off('connect',onConnect);socket?.off('connect_error',onConnectError);socket?.off('session.ready',onReady);socket?.off('nft.updated',onNft);socket?.off('order.updated',onOrder)}
    }).catch((error:unknown)=>console.error('[Socket client] failed to load client',error))
    return()=>{active=false;cleanupListeners();socket?.disconnect()}
  },[client,pathname,user])
  return null
}
