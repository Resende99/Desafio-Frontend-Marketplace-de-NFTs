import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { User } from '../types/domain'
import { AuthContext } from './authContext'

async function passwordHash(password:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password)))).map((byte)=>byte.toString(16).padStart(2,'0')).join('')}
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),queryClient=useQueryClient()
  const refresh=useCallback(async()=>{const token=localStorage.getItem('kurio.session'),expiresAt=Number(localStorage.getItem('kurio.session.expiresAt')??0);if(!token||(expiresAt>0&&expiresAt<Date.now())){localStorage.removeItem('kurio.session');localStorage.removeItem('kurio.session.expiresAt');setUser(null);setReady(true);return}try{setUser((await api.get<User>('/auth/me')).data)}catch{localStorage.removeItem('kurio.session');localStorage.removeItem('kurio.session.expiresAt');setUser(null);await queryClient.clear()}finally{setReady(true)}},[queryClient])
  const mergeGuestCart=useCallback(async()=>{await api.post('/cart/merge');await queryClient.invalidateQueries({queryKey:['cart']})},[queryClient])
  useEffect(()=>{void refresh()},[refresh])
  const signIn=useCallback(async(email:string,password:string)=>{const response=await api.post<{token:string}>('/auth/login',{email,passwordHash:await passwordHash(password)});localStorage.setItem('kurio.session',response.data.token);localStorage.setItem('kurio.session.expiresAt',String(Date.now()+30*60_000));await refresh();await mergeGuestCart()},[mergeGuestCart,refresh])
  const signUp=useCallback(async(name:string,email:string,password:string)=>{const response=await api.post<{token:string}>('/auth/register',{name,email,passwordHash:await passwordHash(password),passwordLength:password.length});localStorage.setItem('kurio.session',response.data.token);localStorage.setItem('kurio.session.expiresAt',String(Date.now()+30*60_000));await refresh();await mergeGuestCart()},[mergeGuestCart,refresh])
  const signOut=useCallback(async()=>{try{await api.post('/auth/logout')}finally{localStorage.removeItem('kurio.session');localStorage.removeItem('kurio.session.expiresAt');setUser(null);await queryClient.clear()}},[queryClient])
  useEffect(()=>{if(!user)return;const expiresAt=Number(localStorage.getItem('kurio.session.expiresAt')??0),timer=window.setTimeout(()=>{void signOut()},Math.max(0,expiresAt-Date.now()));return()=>window.clearTimeout(timer)},[user,signOut])
  const value=useMemo(()=>({user,ready,signIn,signUp,signOut,refresh}),[user,ready,signIn,signUp,signOut,refresh])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
