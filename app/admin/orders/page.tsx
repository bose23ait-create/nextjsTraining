'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Chip, Container, Divider, Skeleton, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { isAdminUser } from '../../../redux/slices/authSlice';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancellation_requested' | 'cancelled';
type Order = { _id: string; createdAt: string; total: number; status: OrderStatus; paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'; items: Array<{ productId: string; name: string; price: number; quantity: number }>; customerDetails?: { name: string; email: string; phone: string; address: string; city: string; state: string; postalCode: string }; cancellationReason?: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'completed', 'cancellation_requested', 'cancelled'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  useEffect(() => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) { router.replace('/login'); return; }
    if (!isAdminUser(user)) { router.replace('/products'); return; }
    void fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load orders');
        setOrders((Array.isArray(data) ? data : data.orders ?? data.items ?? data.data ?? []) as Order[]);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to load orders'))
      .finally(() => setLoading(false));
  }, [router, token, user]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;
    setSavingId(orderId); setError('');
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update order status');
      setOrders((current) => current.map((order) => order._id === orderId ? { ...order, status: data.status } : order));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update order status'); }
    finally { setSavingId(''); }
  };

  const handleCancellation = async (orderId: string, action: 'approve' | 'reject') => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;
    setSavingId(orderId); setError('');
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/${action}-cancellation`, { method: 'PATCH', headers: { Authorization: `Bearer ${authToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to ${action} cancellation`);
      setOrders((current) => current.map((order) => order._id === orderId ? { ...order, status: data.status, paymentStatus: data.paymentStatus, cancellationReason: data.cancellationReason } : order));
    } catch (caught) { setError(caught instanceof Error ? caught.message : `Unable to ${action} cancellation`); }
    finally { setSavingId(''); }
  };

  return <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', py: { xs: 2, md: 4 } }}><Container maxWidth="lg"><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><Typography variant="h4" sx={{ fontWeight: 800 }}>Manage orders</Typography><Button onClick={() => router.push('/admin')}>Products</Button></Box>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{loading && <Box><Skeleton variant="rounded" height={180} /><Skeleton variant="rounded" height={180} sx={{ mt: 2 }} /></Box>}{!loading && !error && orders.length === 0 && <Box sx={{ bgcolor: '#fff', p: 5, textAlign: 'center', border: '1px solid #e0e5eb' }}><Typography>No orders found</Typography></Box>}{!loading && orders.map((order) => <Box key={order._id} sx={{ bgcolor: '#fff', p: { xs: 2, md: 3 }, mb: 2, border: '1px solid #e0e5eb', borderColor: order.status === 'cancellation_requested' ? 'warning.main' : '#e0e5eb', borderWidth: order.status === 'cancellation_requested' ? 2 : 1 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}><Typography sx={{ fontWeight: 800 }}>Order #{order._id.slice(-8)}</Typography><Typography color="text.secondary">{new Date(order.createdAt).toLocaleString()}</Typography></Box>{order.status === 'cancellation_requested' && <Alert severity="warning" sx={{ mb: 2 }}><strong>Cancellation Requested:</strong> {order.cancellationReason}</Alert>}{order.customerDetails && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{order.customerDetails.name} | {order.customerDetails.email} | {order.customerDetails.phone}<br />{order.customerDetails.address}, {order.customerDetails.city}, {order.customerDetails.state} {order.customerDetails.postalCode}</Typography>}{order.items.map((item) => <Box key={`${order._id}-${item.productId}`} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}><Typography>{item.name} x {item.quantity}</Typography><Typography>₹{(item.price * item.quantity).toFixed(2)}</Typography></Box>)}<Divider sx={{ my: 1 }} /><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}><Box sx={{ display: 'flex', gap: 1 }}><Chip label={order.status.replace('_', ' ')} color={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'error' : order.status === 'cancellation_requested' ? 'warning' : 'default'} size="small" />{order.paymentStatus && <Chip label={order.paymentStatus === 'refunded' ? 'Refunded' : order.paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'} color={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'refunded' ? 'info' : 'warning'} size="small" />}</Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{order.status === 'cancellation_requested' && (<><Button size="small" variant="contained" color="error" disabled={savingId === order._id} onClick={() => void handleCancellation(order._id, 'approve')}>Approve Cancel</Button><Button size="small" variant="outlined" disabled={savingId === order._id} onClick={() => void handleCancellation(order._id, 'reject')}>Reject</Button></>)}<Typography sx={{ fontWeight: 800, ml: 2 }}>₹{order.total.toFixed(2)}</Typography><select value={order.status} disabled={savingId === order._id || order.status === 'cancellation_requested'} onChange={(event) => void updateStatus(order._id, event.target.value as OrderStatus)} aria-label={`Update status for order ${order._id}`} style={{ height: 36, padding: '0 8px' }}>{statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></Box></Box></Box>)}</Container></Box>;
}
