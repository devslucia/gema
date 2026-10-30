import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RepairOrderForm from '@/components/repairs/RepairOrderForm'

export const dynamic = 'force-dynamic'

export default async function NewRepairOrderPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <RepairOrderForm />
}
