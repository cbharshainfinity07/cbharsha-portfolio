import type { ComponentType } from 'react'
import type { IconProps } from '@phosphor-icons/react'
import { siCodeforces, siLeetcode } from 'simple-icons'

// Official brand marks (Simple Icons) for platforms Phosphor does not cover.
function brand(path: string, title: string): ComponentType<IconProps> {
  const Icon = ({ size = 20 }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <title>{title}</title>
      <path d={path} />
    </svg>
  )
  return Icon as ComponentType<IconProps>
}

export const LeetCodeIcon = brand(siLeetcode.path, 'LeetCode')
export const CodeforcesIcon = brand(siCodeforces.path, 'Codeforces')
