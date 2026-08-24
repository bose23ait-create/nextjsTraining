
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import type { RootState } from '../redux/store';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../redux/store';
import { getProducts } from '../redux/slices/productSlice';

export default function Home() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error } = useSelector(
    (state: RootState) => state.products,
  );
  const hasToken = Boolean(
    token || (typeof window !== 'undefined' && localStorage.getItem('token')),
  );
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!hasToken) {
      router.replace('/login');
    }
  }, [hasToken, router]);

  useEffect(() => {
    if (!hasToken) {
      return;
    }

    void dispatch(getProducts()).then((result) => {
      if (getProducts.rejected.match(result) && result.payload === 'Your session has expired') {
        localStorage.removeItem('token');
        router.replace('/login');
      }
    });
  }, [dispatch, hasToken, router]);

  if (!hasToken) {
    return null;
  }

  const visibleProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: { xs: 4, md: 7 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'stretch', md: 'flex-end' },
            justifyContent: 'space-between',
            gap: 3,
            mb: 5,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: '#176b87', fontWeight: 700, letterSpacing: 1.5 }}>
              Catalog
            </Typography>
            <Typography component="h1" variant="h2" sx={{ fontWeight: 800, color: '#142b3a', fontSize: { xs: '2.4rem', md: '3.5rem' } }}>
              Products
            </Typography>
            <Typography sx={{ color: '#60717c', mt: 1 }}>
              Browse the latest products in your inventory.
            </Typography>
          </Box>

          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            sx={{ width: { xs: '100%', md: 300 }, bgcolor: '#fff' }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" aria-hidden="true" sx={{ color: '#176b87', fontSize: 20 }}>
                      &#128269;
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[1, 2, 3].map((item) => (
              <Card key={item} sx={{ borderRadius: 2 }}>
                <Skeleton variant="rectangular" height={210} />
                <CardContent><Skeleton width="65%" /><Skeleton /><Skeleton width="35%" /></CardContent>
              </Card>
            ))}
          </Box>
        ) : visibleProducts.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center', border: '1px dashed #b5c5cc', bgcolor: '#fff' }}>
            <Typography variant="h6" sx={{ color: '#304954', fontWeight: 700 }}>
              {search ? 'No matching products' : 'No products available'}
            </Typography>
            <Typography sx={{ color: '#71828b', mt: 1 }}>
              {search ? 'Try a different search term.' : 'Products will appear here when they are added.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {visibleProducts.map((product) => (
              <Card key={product._id} sx={{ display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden', boxShadow: '0 8px 24px rgba(20, 43, 58, 0.08)' }}>
                {product.images[0] ? (
                  <Box component="img" src={`http://localhost:3000${product.images[0]}`} alt={product.name} sx={{ width: '100%', height: 210, objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ height: 210, bgcolor: '#dce9e8', display: 'grid', placeItems: 'center' }}>
                    <Typography sx={{ color: '#176b87', fontWeight: 700 }}>No image</Typography>
                  </Box>
                )}
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                    <Typography variant="h6" sx={{ color: '#142b3a', fontWeight: 700 }}>{product.name}</Typography>
                    <Typography sx={{ color: '#176b87', fontWeight: 800, whiteSpace: 'nowrap' }}>${product.price.toFixed(2)}</Typography>
                  </Box>
                  <Typography sx={{ color: '#667983', mt: 1.5, lineHeight: 1.6 }}>{product.description}</Typography>
                  <Typography sx={{ color: product.stock > 0 ? '#27815b' : '#bd4b45', fontWeight: 700, mt: 2 }}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
