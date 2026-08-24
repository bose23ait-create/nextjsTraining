
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { isAdminUser } from '../redux/slices/authSlice';

export default function Home() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const hasToken = Boolean(
    token || (typeof window !== 'undefined' && localStorage.getItem('token')),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!hasToken) {
      router.replace('/login');
      return;
    }

    router.replace(isAdminUser(user) ? '/admin' : '/products');
  }, [hasToken, mounted, router, user]);

  return null;
}
