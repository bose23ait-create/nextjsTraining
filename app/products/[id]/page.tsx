'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';

import type { AppDispatch, RootState } from '../../../redux/store';
import type { Product } from '../../../redux/slices/productSlice';
import { addToCart, setCartOwner } from '../../../redux/slices/cartSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const imageUrl = (image: string) =>
  image.startsWith('http') ? image : `${API_URL}${image}`;

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [quantity, setQuantity] = useState(1);

  const productId = useMemo(() => String(params?.id ?? ''), [params?.id]);

  useEffect(() => {
    const owner = user?.id || user?._id || user?.email || 'anonymous';
    dispatch(setCartOwner(owner));
  }, [dispatch, user]);

  useEffect(() => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      router.replace('/login');
      return;
    }

    if (!productId) {
      router.replace('/products');
      return;
    }

    queueMicrotask(() => {
      setLoading(true);
      setError('');

      void fetch(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              Array.isArray(data.message)
                ? data.message.join(', ')
                : data.message || 'Unable to load product details',
            );
          }

          const resolvedProduct = (data.product ?? data) as Product;
          setProduct(resolvedProduct);
          setActiveImage(resolvedProduct.images?.[0] ?? '');
          setQuantity(1);
        })
        .catch((caught: unknown) => {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Unable to load product details',
          );
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [productId, router, token]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f4f4', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', py: { xs: 3, md: 5 } }}>
      <Box sx={{ position: 'absolute', top: { xs: 16, md: 24 }, left: 0, right: 0 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button onClick={() => router.push('/products')} variant="outlined" sx={{ borderColor: '#d9dde3', color: '#4f5b66', bgcolor: '#fff' }}>
              Back to products
            </Button>
            <Button onClick={() => router.push('/cart')} variant="outlined" sx={{ borderColor: '#d9dde3', color: '#4f5b66', bgcolor: '#fff' }}>
              Go to cart
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">

        {loading && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={340} />
            <Skeleton variant="rounded" height={160} />
          </Stack>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && product && (
          <Card sx={{ border: '1px solid #e3e7ec', borderRadius: 1, overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, gap: 0 }}>
              <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: '#f0f0f0', borderRight: { md: '1px solid #e6eaee' } }}>
                {activeImage ? (
                  <Box
                    component="img"
                    src={imageUrl(activeImage)}
                    alt={product.name}
                    sx={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'contain', objectPosition: 'center', borderRadius: 1, bgcolor: '#ffffff' }}
                  />
                ) : (
                  <Box sx={{ width: '100%', aspectRatio: '16 / 10', borderRadius: 1, bgcolor: '#d9e0e6', display: 'grid', placeItems: 'center' }}>
                    <Typography color="text.secondary">No image</Typography>
                  </Box>
                )}
                {product.images.length > 1 && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, overflowX: 'auto' }}>
                    {product.images.map((img) => (
                      <Box
                        key={img}
                        component="button"
                        type="button"
                        onClick={() => setActiveImage(img)}
                        sx={{
                          p: 0,
                          border: img === activeImage ? '2px solid #f89a1c' : '1px solid #d3d9df',
                          borderRadius: .5,
                          overflow: 'hidden',
                          background: '#fff',
                          width: 84,
                          height: 60,
                          cursor: 'pointer',
                        }}
                      >
                        <Box component="img" src={imageUrl(img)} alt={product.name} sx={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', bgcolor: '#ffffff' }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <CardContent sx={{ p: { xs: 2, md: 3 }, bgcolor: '#fff' }}>
                <Typography sx={{ color: '#9aa5b1', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', mb: .5 }}>
                  BRAND: YOUR BRAND
                </Typography>

                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2, color: '#ea6f1a', mb: 0.6, textTransform: 'uppercase' }}>
                  {product.name}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Chip
                    label={product.stock > 0 ? 'Available' : 'Sold out'}
                    size="small"
                    sx={{
                      bgcolor: product.stock > 0 ? '#e5f9ef' : '#fcebe3',
                      color: product.stock > 0 ? '#239458' : '#c27643',
                      fontWeight: 700,
                    }}
                  />
                  <Chip label={`${product.stock} in stock`} size="small" variant="outlined" sx={{ borderColor: '#d7dde3', color: '#768390' }} />
                </Stack>

                <Typography sx={{ fontSize: '1.7rem', fontWeight: 900, color: '#182431', mb: 1.25 }}>
                  ₹{product.price.toFixed(2)}
                </Typography>

                <Divider sx={{ borderColor: '#edf1f4', mb: 1.5 }} />

                <Typography sx={{ color: '#6f7d89', fontSize: '.86rem', mb: 2.2, lineHeight: 1.55 }}>
                  {product.description}
                </Typography>


                <Stack direction="row" spacing={1.5} sx={{ mb: 2.2, alignItems: 'center' }}>
                  <Typography sx={{ width: 86, color: '#8c97a3', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em' }}>
                    QUANTITY
                  </Typography>
                  <Stack direction="row" spacing={0.75}>
                    <Button
                      variant="outlined"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      sx={{ minWidth: 40, borderColor: '#d8dee5', color: '#6b7783' }}
                    >
                      -
                    </Button>
                    <Box sx={{ minWidth: 42, px: 1.25, py: .75, border: '1px solid #d8dee5', borderRadius: 1, textAlign: 'center', fontWeight: 800, color: '#4c5864' }}>
                      {quantity}
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                      sx={{ minWidth: 40, borderColor: '#d8dee5', color: '#6b7783' }}
                    >
                      +
                    </Button>
                  </Stack>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={product.stock === 0}
                    onClick={() => {
                      for (let index = 0; index < quantity; index += 1) {
                        dispatch(addToCart(product));
                      }
                      setCartMessage(`${product.name} added to cart successfully`);
                    }}
                    sx={{
                      minWidth: 170,
                      bgcolor: '#182431',
                      color: '#fff',
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#2d3c49' },
                    }}
                  >
                    Add to cart
                  </Button>
                </Stack>
              </CardContent>
            </Box>
          </Card>
        )}

        <Snackbar
          open={Boolean(cartMessage)}
          autoHideDuration={3000}
          onClose={() => setCartMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setCartMessage('')} severity="success" variant="filled">
            {cartMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
