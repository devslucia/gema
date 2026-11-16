import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RepairOrdersList from '@/components/repairs/RepairOrdersList'
import { RepairOrder } from '@/types/repair'
import { fetchAllRows } from '@/lib/supabase/pagination'

export const dynamic = 'force-dynamic'

export default async function RepairOrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let orders: RepairOrder[] = []
  try {
    orders = await fetchAllRows<RepairOrder>((from, to) =>
      supabase.from('repair_orders').select('*').order('order_number', { ascending: false }).range(from, to)
    )
  } catch (error) {
    console.error('Error loading repair orders:', error)
  }

  return <RepairOrdersList orders={orders} />
}
