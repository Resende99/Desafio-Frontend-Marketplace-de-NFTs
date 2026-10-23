import { useEffect } from 'react'
import { useAuth } from '../state/useAuth'
export function useProtected(){const auth=useAuth();useEffect(()=>{if(auth.ready&&!auth.user){const returnTo=window.location.pathname+window.location.search;window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)}},[auth.ready,auth.user]);return auth}
