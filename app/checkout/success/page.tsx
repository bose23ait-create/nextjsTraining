'use client';

import { Box, Button, Container, Typography, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../../redux/slices/cartSlice';
import { useSearchParams } from 'next/navigation';

interface OrderData {
  _id: string;
  total: number;
  customerDetails: { name: string };
}

function SuccessContent() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    dispatch(clearCart());
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.order) {
          setOrderData(data.order);
        }
      })
      .finally(() => {
        queueMicrotask(() => setVerifying(false));
      });
    } else {
      queueMicrotask(() => setVerifying(false));
    }
  }, [dispatch, searchParams]);

  if (verifying) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f9' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f9', p: 3 }}>
      <Container maxWidth="sm">
        <Box sx={{ bgcolor: 'white', p: 5, borderRadius: 3, boxShadow: '0 8px 26px rgba(23, 37, 52, .04)', textAlign: 'center' }}>
          <svg style={{ width: 80, height: 80, color: '#4caf50', marginBottom: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#2b78c6', mb: 2 }}>
            Payment Successful!
          </Typography>
          <Typography variant="body1" sx={{ color: '#5f6d79', mb: 3 }}>
            Thank you for your order. We are processing it now and will send you an email confirmation shortly.
          </Typography>

          {orderData && (
            <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2, mb: 4, textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Order Summary</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Order ID</Typography>
                <Typography sx={{ fontWeight: 600 }}>#{orderData._id?.slice(-8)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Total Amount</Typography>
                <Typography sx={{ fontWeight: 600 }}>₹{orderData.total}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Delivery to</Typography>
                <Typography sx={{ fontWeight: 600, textAlign: 'right' }}>{orderData.customerDetails?.name}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              component={Link}
              href="/orders"
              variant="contained"
              size="large"
              sx={{ bgcolor: '#2b78c6', '&:hover': { bgcolor: '#2166ac' }, fontWeight: 700 }}
            >
              View My Orders
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              size="large"
              sx={{ color: '#2b78c6', borderColor: '#2b78c6', '&:hover': { bgcolor: '#eef5fc' }, fontWeight: 700 }}
            >
              Continue Shopping
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f9' }}><CircularProgress /></Box>}>
      <SuccessContent />
    </Suspense>
  );
}
