'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f9', p: 3 }}>
      <Container maxWidth="sm">
        <Box sx={{ bgcolor: 'white', p: 5, borderRadius: 3, boxShadow: '0 8px 26px rgba(23, 37, 52, .04)', textAlign: 'center' }}>
          <svg style={{ width: 80, height: 80, color: '#f44336', marginBottom: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#2b78c6', mb: 2 }}>
            Payment Cancelled
          </Typography>
          <Typography variant="body1" sx={{ color: '#5f6d79', mb: 4 }}>
            Your payment was cancelled or failed. Your order has been saved as pending. Please try checking out again.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              component={Link}
              href="/cart"
              variant="contained"
              size="large"
              sx={{ bgcolor: '#2b78c6', '&:hover': { bgcolor: '#2166ac' }, fontWeight: 700 }}
            >
              Return to Cart
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
