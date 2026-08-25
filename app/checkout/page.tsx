'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Box, Button, Chip, Container, Divider, TextField, Typography } from '@mui/material';
import type { AppDispatch, RootState } from '../../redux/store';
import { clearCart, setCartOwner } from '../../redux/slices/cartSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
type CustomerDetails = { name: string; email: string; phone: string; address: string; city: string; state: string; postalCode: string };
const emptyDetails: CustomerDetails = { name: '', email: '', phone: '', address: '', city: '', state: '', postalCode: '' };

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const items = useSelector((state: RootState) => state.cart.items);
  const userKey = user?.id || user?._id || user?.email || 'anonymous';
  const storageKey = `checkout-details:${userKey}`;
  const [details, setDetails] = useState<CustomerDetails>(emptyDetails);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!token && !localStorage.getItem('token')) { router.replace('/login'); return; }
    const saved = localStorage.getItem(storageKey);
    queueMicrotask(() => {
      if (saved) {
        try { setDetails({ ...emptyDetails, ...JSON.parse(saved) }); } catch { localStorage.removeItem(storageKey); }
      } else if (user) setDetails((current) => ({ ...current, name: user.name, email: user.email }));
      dispatch(setCartOwner(userKey));
    });
  }, [dispatch, router, storageKey, token, user, userKey]);

  const update = (field: keyof CustomerDetails, value: string) => setDetails((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!items.length) { router.push('/cart'); return; }

    const outOfStock = items.filter(item => item.quantity > item.product.stock);
    if (outOfStock.length > 0) {
      setError(`Insufficient stock for: ${outOfStock.map(i => i.product.name).join(', ')}`);
      return;
    }

    if (details.phone.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    if (details.postalCode.length !== 6) {
      setError('Postal code must be exactly 6 digits');
      return;
    }

    setPlacing(true); setError('');
    const authToken = token || localStorage.getItem('token');
    try {
      localStorage.setItem(storageKey, JSON.stringify(details));
      const response = await fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ items: items.map((item) => ({ productId: item.product._id, quantity: item.quantity })), customerDetails: details }) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Unable to complete checkout');
      dispatch(clearCart());
      router.push('/orders');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to complete checkout'); }
    finally { setPlacing(false); }
  };

  const fields: Array<[keyof CustomerDetails, string, string]> = [['name', 'Full name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['address', 'Address', 'text'], ['city', 'City', 'text'], ['state', 'State', 'text'], ['postalCode', 'Postal code', 'text']];
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const primary = '#2b78c6';
  const primaryHover = '#2166ac';
  const muted = '#5f6d79';
  const line = '#d6dde5';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-.02em', color: primary }}>Checkout</Typography>
          <Button
            onClick={() => router.push('/cart')}
            variant="outlined"
            sx={{ borderColor: primary, color: primary, '&:hover': { borderColor: primaryHover, color: primaryHover, bgcolor: '#eef5fc' } }}
          >
            Back to cart
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.55fr .9fr' }, gap: 2.5 }}>
          <Box
            component="form"
            onSubmit={submit}
            sx={{
              bgcolor: '#fff',
              p: { xs: 2, md: 3 },
              border: '1px solid #e0e5eb',
              borderRadius: 2,
              boxShadow: '0 8px 26px rgba(23, 37, 52, .04)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
              Customer and delivery details
            </Typography>
            <Typography sx={{ color: muted, fontSize: '.9rem', mb: 2 }}>
              Fill in your information to complete the order.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {fields.map(([field, label, type]) => {
                const fullRow = field === 'address';
                
                const isPhoneError = field === 'phone' && details.phone.length > 0 && !/^\d{10}$/.test(details.phone);
                const isPostalError = field === 'postalCode' && details.postalCode.length > 0 && !/^\d{6}$/.test(details.postalCode);
                const hasError = isPhoneError || isPostalError;
                const helperText = isPhoneError ? 'Mobile number must be exactly 10 digits' : (isPostalError ? 'Postal code must be exactly 6 digits' : '');

                return (
                  <TextField
                    key={field}
                    label={label}
                    type={type}
                    value={details[field]}
                    onChange={(event) => {
                      let val = event.target.value;
                      if (field === 'phone') {
                        val = val.replace(/\D/g, '').slice(0, 10);
                      } else if (field === 'postalCode') {
                        val = val.replace(/\D/g, '').slice(0, 6);
                      }
                      update(field, val);
                    }}
                    required
                    fullWidth
                    error={hasError}
                    helperText={helperText}
                    sx={{
                      gridColumn: { sm: fullRow ? '1 / -1' : 'auto' },
                      '& .MuiInputLabel-root': { color: muted },
                      '& .MuiInputLabel-root.Mui-focused': { color: primary },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: line },
                        '&:hover fieldset': { borderColor: primary },
                        '&.Mui-focused fieldset': { borderColor: primary },
                      },
                    }}
                  />
                );
              })}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={placing || !items.length}
              sx={{ mt: 2.5, bgcolor: primary, '&:hover': { bgcolor: primaryHover }, fontWeight: 800 }}
            >
              {placing ? 'Completing checkout...' : 'Complete checkout'}
            </Button>
          </Box>

          <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e5eb', borderRadius: 2, p: 2.25, height: 'fit-content', boxShadow: '0 8px 26px rgba(23, 37, 52, .04)' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5, color: primary }}>
              Order summary
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: muted }}>Items</Typography>
              <Chip label={totalItems} size="small" sx={{ bgcolor: '#eaf0f6', color: primary, fontWeight: 700 }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: muted }}>Subtotal</Typography>
              <Typography sx={{ fontWeight: 700, color: primary }}>${subtotal.toFixed(2)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ color: muted }}>Shipping</Typography>
              <Typography sx={{ fontWeight: 700, color: primary }}>Free</Typography>
            </Box>

            <Divider sx={{ my: 1.25 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 900, color: primary }}>Total</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: primary }}>${subtotal.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}