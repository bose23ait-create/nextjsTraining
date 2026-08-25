'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Box, Button, Container, TextField, Typography } from '@mui/material';
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
  return <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', py: { xs: 2, md: 4 } }}><Container maxWidth="md"><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><Typography variant="h4" sx={{ fontWeight: 800 }}>Checkout</Typography><Button onClick={() => router.push('/cart')}>Back to cart</Button></Box><Box component="form" onSubmit={submit} sx={{ bgcolor: '#fff', p: { xs: 2, md: 3 }, border: '1px solid #e0e5eb' }}><Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Customer and delivery details</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{fields.map(([field, label, type]) => <TextField key={field} label={label} type={type} value={details[field]} onChange={(event) => update(field, event.target.value)} required fullWidth />)}</Box><Button type="submit" fullWidth variant="contained" size="large" disabled={placing || !items.length} sx={{ mt: 3 }}>{placing ? 'Completing checkout...' : 'Complete checkout'}</Button></Box></Container></Box>;
}