import { Outlet } from '@tanstack/react-router'
import { RealtimeBridge } from './RealtimeBridge'
export function RootLayout(){return <><RealtimeBridge/><Outlet/></>}
