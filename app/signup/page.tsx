'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TextField,
    Button,
    Container,
    Box,
    Typography,
    Link,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { register } from '../../redux/slices/authSlice';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setPasswordError('');
        const result = await dispatch(
            register({ name, email, password, age: Number(age) }),
        );

        if (register.fulfilled.match(result)) {
            router.push('/login');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    gap: 2,
                }}
            >
                <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Sign up
                </Typography>

                <Box
                    component="form"
                    onSubmit={handleSignup}
                    sx={{ width: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}
                >
                    <TextField
                        fullWidth
                        label="Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Age"
                        type="number"
                        value={age}
                        onChange={(event) => setAge(event.target.value)}
                        slotProps={{ htmlInput: { min: 1, max: 120 } }}
                        required
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        helperText="Use at least 6 characters."
                        required
                    />

                    <TextField
                        fullWidth
                        label="Confirm password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        error={Boolean(passwordError)}
                        helperText={passwordError}
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
                        size="large"
                        type="submit"
                        disabled={loading}
                        sx={{ mt: 1 }}
                    >
                        {loading ? 'Creating account...' : 'Sign up'}
                    </Button>
                </Box>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Already have an account?{' '}
                    <Link href="/login" underline="hover" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Login
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}