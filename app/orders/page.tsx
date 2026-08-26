'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Chip, Container, Divider, Skeleton, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Order = {
  _id: string;
  createdAt: string;
  total: number;
  status: string;
  paymentStatus?: string;
  customerDetails?: { name: string; email: string; phone: string; address: string; city: string; state: string; postalCode: string };
  items: Array<{ productId: string; name: string; price: number; quantity: number; images?: string[] }>;
};

const imageUrl = (image: string) => image.startsWith('http') ? image : `${API_URL}${image}`;

export default function OrdersPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const fetchOrders = useCallback(() => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      router.replace('/login');
      return;
    }
    // setLoading is already true initially, we don't need to set it synchronously again here.
    void fetch(`${API_URL}/orders/my`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Unable to load order history');
        }
        const orderList = Array.isArray(data)
          ? data
          : data.orders ?? data.items ?? data.data ?? [];
        setOrders(orderList as Order[]);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to load order history'))
      .finally(() => setLoading(false));
  }, [router, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenCancelModal = (orderId: string) => {
    setCancelingOrderId(orderId);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setCancelingOrderId(null);
  };

  const submitCancelRequest = async () => {
    if (!cancelingOrderId || !cancelReason.trim()) return;
    setCancelSubmitting(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${cancelingOrderId}/request-cancellation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to request cancellation');
      }
      handleCloseCancelModal();
      fetchOrders(); // Refresh order list
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to request cancellation');
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--canvas)', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Order history</Typography>
          <Button onClick={() => router.push('/products')}>Products</Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {loading && <Stack spacing={2}><Skeleton variant="rounded" height={150} /><Skeleton variant="rounded" height={150} /></Stack>}
        {!loading && !error && orders.length === 0 ? (
          <Box sx={{ bgcolor: 'var(--surface)', p: 5, textAlign: 'center', border: '1px solid var(--line)', borderRadius: 3, boxShadow: 'var(--shadow-soft)' }}>
            <Typography sx={{ fontWeight: 700 }}>No orders yet</Typography>
            <Button variant="contained" onClick={() => router.push('/products')} sx={{ mt: 2 }}>Shop now</Button>
          </Box>
        ) : !loading && !error && orders.map((order) => (
          <Box key={order._id} sx={{ bgcolor: 'var(--surface)', p: { xs: 2, md: 3 }, mb: 2, border: '1px solid var(--line)', borderRadius: 3, boxShadow: 'var(--shadow-soft)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontWeight: 800 }}>Order #{order._id.slice(-8)}</Typography>
              <Typography color="text.secondary">{new Date(order.createdAt).toLocaleString()}</Typography>
            </Box>
            {order.customerDetails && (
              <Box sx={{ bgcolor: '#f7f9fb', p: 1.5, mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Delivery details</Typography>
                <Typography variant="body2">{order.customerDetails.name} | {order.customerDetails.phone}</Typography>
                <Typography variant="body2" color="text.secondary">{order.customerDetails.address}, {order.customerDetails.city}, {order.customerDetails.state} {order.customerDetails.postalCode}</Typography>
                <Typography variant="body2" color="text.secondary">{order.customerDetails.email}</Typography>
              </Box>
            )}
            {order.items.map((item) => (
              <Box key={`${order._id}-${item.productId}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                {item.images?.[0] && <Box component="img" src={imageUrl(item.images[0])} alt="" sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }} />}
                <Typography sx={{ flex: 1 }}>{item.name} x {item.quantity}</Typography>
                <Typography>₹{(item.price * item.quantity).toFixed(2)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={order.status === 'placed' ? 'completed' : order.status.replace('_', ' ')}
                  size="small"
                  color={
                    order.status === 'placed' || order.status === 'completed'
                      ? 'success'
                      : order.status === 'cancelled'
                      ? 'error'
                      : order.status === 'cancellation_requested'
                      ? 'warning'
                      : 'default'
                  }
                />
                {order.paymentStatus === 'refunded' && (
                  <Chip label="Refunded" size="small" color="info" />
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <Button size="small" variant="outlined" color="error" onClick={() => handleOpenCancelModal(order._id)}>
                    Cancel Order
                  </Button>
                )}
              </Box>
              <Typography sx={{ fontWeight: 800 }}>₹{order.total.toFixed(2)}</Typography>
            </Box>
          </Box>
        ))}
      </Container>

      <Dialog open={cancelModalOpen} onClose={handleCloseCancelModal}>
        <DialogTitle>Request Order Cancellation</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for cancelling this order. Once submitted, our team will review the request and process your refund.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Cancellation Reason"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelModal} disabled={cancelSubmitting}>Close</Button>
          <Button 
            onClick={submitCancelRequest} 
            color="error" 
            variant="contained" 
            disabled={!cancelReason.trim() || cancelSubmitting}
          >
            {cancelSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
