'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Container, Box, Typography, FormControlLabel, Checkbox, Link } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { login } from '../../redux/slices/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await dispatch(login({ email, password }));

    if (login.fulfilled.match(result)) {
      router.push('/');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        gap: 2 
      }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Login
        </Typography>
        
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
          
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
            label="Remember me"
          />

          {error && (
            <Typography color="error" role="alert">
              {error}
            </Typography>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            type="submit"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <Link href="/signup" underline="hover" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Sign up
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}