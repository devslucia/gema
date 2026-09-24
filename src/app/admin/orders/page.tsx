"use client"

import { useState, useEffect } from 'react'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Array<{
    id: string
    status: string
    total: number
    customer_name: string
    customer_email: string
    created_at: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching orders:', err)
        setLoading(false)
      })
  }, [search])

  const filteredOrders = orders
    .filter((order) => {
      if (!search) return true
      return (
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.id.includes(search) ||
        order.status.toLowerCase().includes(search.toLowerCase())
      )
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-text-primary-dark mb-2">Pedidos</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Buscar pedido ID, cliente o status..."
            className="flex-1 p-2 border rounded dark:bg-gray-700"
          />
          <button
            onClick={() => setSearch('')}
            className="px-2 py-1 border rounded text-sm"
            title="Limpiar búsqueda"
          >
            Limpiar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="my-8 text-center">
          <span>Cargando pedidos...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-border-dark text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark">
                <th className="text-left text-caption text-text-secondary-dark py-3 px-4">ID</th>
                <th className="text-left text-caption text-text-secondary-dark py-3 px-4">Cliente</th>
                <th className="text-left text-caption text-text-secondary-dark py-3 px-4">Total</th>
                <th className="text-left text-caption text-text-secondary-dark py-3 px-4">Status</th>
                <th className="text-left text-caption text-text-secondary-dark py-3 px-4">Fecha</th>
                <th className="text-left text-caption text-text-secondary-dark py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-text-secondary-dark py-8">
                    No hay pedidos
                  </td>
                </tr>
              )}
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border-light dark:border-border-dark">
                  <td className="py-3 px-4 font-medium text-text-primary-dark">
                    {order.id.substring(0, 8)}...</td>
                  <td className="py-3 px-4">
                    {order.customer_name}</td>
                  <td className="py-3 px-4">
                    {order.total.toLocaleString('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    })}</td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-800 badge'
                          : 'bg-yellow-100 text-yellow-800 badge'
                    }>
                      {order.status}</span></td>
                  <td className="py-3 px-4">
                    {new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                  <td className="py-3 px-4">
                    <a
                      href={`/admin/orders/${order.id}`}
                      className="text-primary-600 hover underline text-caption">
                      Ver detalle</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}