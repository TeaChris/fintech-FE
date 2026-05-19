import type { Account } from '@/api/schemas'
import { AccountSchema } from '@/api/schemas'
import { createServerClient } from '@/api/server'
import { AccountDetail } from '@/component/account.details'

import type { ZodType } from 'zod'

export default async function Home({
      params,
}: {
      params: Promise<{ id: string }>
}) {
      const { id } = await params
      const client = await createServerClient()

      const { data: account } = await client.get<Account>('/accounts/{id}', {
            params: { id },
            schema: AccountSchema as unknown as ZodType,
      })

      return <AccountDetail data={account} />
}
