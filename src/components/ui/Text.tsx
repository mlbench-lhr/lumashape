import React, { forwardRef } from 'react'

import { cn } from '../../lib/twMerge'

interface Props {
  children: React.ReactNode
  className?: string
  as?: string
  onClick?: (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.MouseEvent<HTMLButtonElement>,
  ) => void
  id?: string
}

const Text = forwardRef<HTMLHeadingElement | HTMLParagraphElement, Props>(
  (props, ref) => {
    const { children, className, as, onClick, id = '' } = props

    if (as === 'h1') {
      return (
        <h1
          ref={ref}
          className={cn('font-bold sm:text-[40px] text-[34px]', className)}
          onClick={onClick}
          id={id}
        >
          {children}
        </h1>
      )
    }

    if (as === 'h2') {
      return (
        <h2
          ref={ref}
          className={cn('font-bold text-[30px] sm:text-[36px]', className)}
          id={id}
          onClick={onClick}
        >
          {children}
        </h2>
      )
    }

    if (as === 'h3') {
      return (
        <h3
          ref={ref}
          className={cn('font-bold text-[20px] sm:text-[28px]', className)}
          id={id}
          onClick={onClick}
        >
          {children}
        </h3>
      )
    }

    if (as === 'h4') {
      return (
        <h4
          ref={ref}
          className={cn('font-bold text-[18px] sm:text-[22px]', className)}
          id={id}
          onClick={onClick}
        >
          {children}
        </h4>
      )
    }
    if (as === 'h5') {
      return (
        <h4
          ref={ref}
          className={cn('text-[16px] sm:text-[20px]', className)}
          id={id}
          onClick={onClick}
        >
          {children}
        </h4>
      )
    }

    if (as === 'p1') {
      return (
        <p
          ref={ref}
          className={cn('font-medium text-[16px] sm:text-[18px]', className)}
          id={id}
          onClick={onClick}
        >
          {children}
        </p>
      )
    }

    return (
      <p
        ref={ref}
        className={cn('text-[14px] sm:text-[16px] font-medium', className)}
        onClick={onClick}
        id={id}
      >
        {children}
      </p>
    )
  },
)

Text.displayName = 'Text'

export default Text
