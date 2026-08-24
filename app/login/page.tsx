'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Container, Box, Typography, FormControlLabel, Checkbox, Link } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { isAdminUser, login } from '../../redux/slices/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await dispatch(login({ email, password }));

    if (login.fulfilled.match(result)) {
      const redirectPath = isAdminUser(result.payload?.user ?? result.payload) ? '/admin' : '/products';
      router.push(redirectPath);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', py: 4, background: 'linear-gradient(135deg, #e6f0ed 0%, #f7f8f6 55%, #f5e9df 100%)' }}>
      <Container maxWidth="sm">
        <Box sx={{ bgcolor: '#fff', border: '1px solid var(--line)', p: { xs: 3, sm: 5 }, maxWidth: 480, mx: 'auto' }}>
          <Typography component="h1" sx={{ mt: 1, fontSize: '2rem', fontWeight: 800, letterSpacing: '-.04em' }}>
            Welcome back
          </Typography>
          <Typography sx={{ color: 'var(--muted)', mt: 1, mb: 3 }}>Sign in to continue shopping.</Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          

          {error && (
            <Typography color="error" role="alert">
              {error}
            </Typography>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            type="submit"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 3, color: 'var(--muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" underline="hover" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Sign up
          </Link>
        </Typography>
        </Box>
      </Container>
    </Box>
  );
}