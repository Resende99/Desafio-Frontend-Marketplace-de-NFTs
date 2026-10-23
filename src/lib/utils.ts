import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Decimal from 'decimal.js'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatEth(value: string) { return `${new Decimal(value).toFixed(2)} ETH` }
