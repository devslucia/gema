import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import RepairOrderForm from '@/components/repairs/RepairOrderForm'
import { RepairOrder } from '@/types/repair'

export const dynamic = 'force-dynamic'

export default async function EditRepairOrderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('repair_orders')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) {
    notFound()
  }

  return <RepairOrderForm key={data.id} order={data as RepairOrder} />
}
