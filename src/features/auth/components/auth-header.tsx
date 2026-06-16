import { cn } from '@/lib/utils'

import { LogoMark } from '@/features/auth/components/logo-mark'

export function AuthHeader() {
      return (
            <div className={cn('flex flex-col gap-4')}>
                  <LogoMark variant="light" />
            </div>
      )
}
