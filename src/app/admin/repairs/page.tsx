import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RepairOrdersList from '@/components/repairs/RepairOrdersList'
import { RepairOrder } from '@/types/repair'

export const dynamic = 'force-dynamic'

export default async function RepairOrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('repair_orders')
    .select('*')
    .order('order_number', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error loading repair orders:', error)
  }

  return <RepairOrdersList orders={(data as RepairOrder[]) || []} />
}
