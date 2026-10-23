import { createContext } from 'react'
import type { User } from '../types/domain'
export interface AuthValue { user:User|null;ready:boolean;signIn(email:string,password:string):Promise<void>;signUp(name:string,email:string,password:string):Promise<void>;signOut():Promise<void>;refresh():Promise<void> }
export const AuthContext=createContext<AuthValue|null>(null)
