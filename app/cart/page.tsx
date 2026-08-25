'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Container, Divider, TextField, Typography } from '@mui/material';
import type { AppDispatch, RootState } from '../../redux/store';
import { removeFromCart, setCartOwner, updateCartQuantity } from '../../redux/slices/cartSlice';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const items = useSelector((state: RootState) => state.cart.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (!token && !localStorage.getItem('token')) router.replace('/login');
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null') as { id?: string; _id?: string; email?: string } | null;
      dispatch(setCartOwner(storedUser?.id || storedUser?._id || storedUser?.email || 'anonymous'));
    } catch {
      dispatch(setCartOwner('anonymous'));
    }
  }, [dispatch, router, token]);

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (!mounted) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Your cart</Typography>
          <Button onClick={() => router.push('/products')}>Continue shopping</Button>
        </Box>
        {!items.length ? (
          <Box sx={{ bgcolor: '#fff', p: 5, textAlign: 'center', border: '1px solid #e0e5eb' }}>
            <Typography sx={{ fontWeight: 700 }}>Your cart is empty</Typography>
            <Button variant="contained" onClick={() => router.push('/products')} sx={{ mt: 2 }}>Browse products</Button>
          </Box>
        ) : (
          <Box sx={{ bgcolor: '#fff', p: { xs: 2, md: 3 }, border: '1px solid #e0e5eb' }}>
            {items.map((item) => (
              <Box key={item.product._id} sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{item.product.name}</Typography>
                    <Typography color="text.secondary">₹{item.product.price.toFixed(2)} each</Typography>
                  </Box>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(event) => dispatch(updateCartQuantity({ productId: item.product._id, quantity: Number(event.target.value) }))}
                    slotProps={{ htmlInput: { min: 0, max: item.product.stock } }}
                    sx={{ width: 110 }}
                  />
                  <Typography sx={{ fontWeight: 700 }}>₹{(item.product.price * item.quantity).toFixed(2)}</Typography>
                  <Button color="error" onClick={() => dispatch(removeFromCart(item.product._id))}>Remove</Button>
                </Box>
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>₹{total.toFixed(2)}</Typography>
            </Box>
            <Button fullWidth variant="contained" size="large" onClick={() => router.push('/checkout')} sx={{ mt: 2 }}>
              Proceed to checkout
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
