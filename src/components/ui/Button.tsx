import type { ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: {
      default: 'bg-stone-900 text-white hover:bg-stone-700',
      outline: 'border border-stone-300 bg-transparent hover:bg-stone-100',
      ghost: 'hover:bg-stone-100',
      link: 'text-stone-900 underline-offset-4 hover:underline',
    },
    size: { default: 'h-10 px-4 py-2', sm: 'h-9 rounded-sm px-3', lg: 'h-11 rounded-sm px-8', icon: 'h-10 w-10' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }
export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
