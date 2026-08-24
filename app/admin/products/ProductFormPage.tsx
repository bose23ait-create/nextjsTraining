'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Box, Button, Chip, Container, Divider, Paper, TextField, Typography } from '@mui/material';
import type { AppDispatch, RootState } from '../../../redux/store';
import {
  createProduct,
  getProducts,
  updateProduct,
  type ProductFormData,
} from '../../../redux/slices/productSlice';
import { isAdminUser, logout } from '../../../redux/slices/authSlice';

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  images: [],
};

type ProductFormPageProps = {
  productId?: string;
};

export default function ProductFormPage({ productId }: ProductFormPageProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const products = useSelector((state: RootState) => state.products.products);
  const loading = useSelector((state: RootState) => state.products.loading);
  const error = useSelector((state: RootState) => state.products.error);
  const isAdmin = isAdminUser(user);
  const hasToken = Boolean(
    token || (typeof window !== 'undefined' && localStorage.getItem('token')),
  );
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!hasToken) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/products');
      return;
    }

    if (!productId) {
      return;
    }

    const product = products.find((item) => item._id === productId);
    if (product) {
      const frame = window.requestAnimationFrame(() => {
        setForm({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          images: product.images,
        });
        setExistingImages(product.images);
        setImageFiles([]);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    void dispatch(getProducts()).then((result) => {
      if (getProducts.rejected.match(result)) {
        setPageError(result.payload ?? 'Unable to load product');
      }
    });
  }, [dispatch, hasToken, isAdmin, mounted, productId, products, router]);

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) {
      return;
    }

    setImageFiles((previous) => {
      if (previous.length + existingImages.length >= 5) {
        setPageError('A product can have a maximum of 5 images.');
        return previous;
      }

      setPageError(null);
      return [...previous, file];
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImageFiles((previous) => previous.filter((_, index) => index !== indexToRemove));
  };

  const removeExistingImage = (imageToRemove: string) => {
    setExistingImages((previous) => previous.filter((image) => image !== imageToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError(null);

    const productData = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      images: imageFiles.length > 0 ? imageFiles : form.images ?? [],
      existingImages,
    };
    const result = productId
      ? await dispatch(updateProduct({ id: productId, productData }))
      : await dispatch(createProduct(productData));

    if (createProduct.fulfilled.match(result) || updateProduct.fulfilled.match(result)) {
      router.push('/admin');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login');
  };

  if (!mounted || !hasToken || !isAdmin) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--canvas)', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        <Box component="header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 4, md: 6 } }}>
          <Button variant="text" onClick={() => router.push('/admin')} sx={{ color: 'var(--ink)', px: 0 }}>
            Back to products
          </Button>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Log out
          </Button>
        </Box>

        <Box sx={{ maxWidth: 880, mx: 'auto' }}>
          <Typography sx={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '.14em', fontSize: '.7rem' }}>
            ADMIN PANEL / PRODUCTS
          </Typography>
          <Typography component="h1" sx={{ mt: 1, fontSize: { xs: '2rem', sm: '2.7rem' }, lineHeight: 1.1, fontWeight: 800, letterSpacing: '-.045em', color: 'var(--ink)' }}>
            {productId ? 'Edit product' : 'Create product'}
          </Typography>
          <Typography sx={{ color: 'var(--muted)', mt: 1, mb: 3 }}>
            {productId ? 'Update the details and save your changes.' : 'Add a new product to your collection.'}
          </Typography>

          {(pageError || error) && <Alert severity="error" sx={{ mb: 2 }}>{pageError || error}</Alert>}

          <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ border: '1px solid var(--line)', borderRadius: 1.5, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>Product details</Typography>
              <Typography sx={{ color: 'var(--muted)', fontSize: '.85rem', mt: .5, mb: 3 }}>Enter the information customers will see in the catalog.</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr 1fr' }, gap: 2 }}>
                <TextField label="Product name" value={form.name} onChange={(event) => handleChange('name', event.target.value)} required />
                <TextField label="Price" type="number" value={form.price || ''} onChange={(event) => handleChange('price', event.target.value === '' ? 0 : Number(event.target.value))} slotProps={{ htmlInput: { min: 0, step: '0.01' } }} required />
                <TextField label="Stock quantity" type="number" value={form.stock || ''} onChange={(event) => handleChange('stock', event.target.value === '' ? 0 : Number(event.target.value))} slotProps={{ htmlInput: { min: 0 } }} required />
              </Box>
              <TextField fullWidth label="Description" multiline minRows={4} value={form.description} onChange={(event) => handleChange('description', event.target.value)} sx={{ mt: 2 }} required />

              <Divider sx={{ my: 3 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>Product image</Typography>
              <Typography sx={{ color: 'var(--muted)', fontSize: '.85rem', mt: .5, mb: 1.5 }}>Upload a JPG, PNG, or WEBP image.</Typography>
              {existingImages.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                  {existingImages.map((image) => (
                    <Box key={image} sx={{ position: 'relative', width: 88, height: 88, borderRadius: 1, overflow: 'hidden', border: '1px solid var(--line)' }}>
                      <Box component="img" src={`http://localhost:3000${image}`} alt="Current product" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Button aria-label="Remove current image" onClick={() => removeExistingImage(image)} sx={{ position: 'absolute', top: 2, right: 2, minWidth: 24, width: 24, height: 24, p: 0, borderRadius: '50%', bgcolor: '#fff', color: '#b8564c', '&:hover': { bgcolor: '#fff' } }}>x</Button>
                    </Box>
                  ))}
                </Box>
              )}
              <Button variant="outlined" component="label" sx={{ width: '100%', minHeight: 58, justifyContent: 'flex-start', borderStyle: 'dashed', color: 'var(--brand)', borderColor: '#9bc5c0', bgcolor: '#f8fcfb' }}>
                Add image {imageFiles.length + existingImages.length > 0 ? `(${imageFiles.length + existingImages.length}/5 selected)` : productId ? '(optional)' : '(required)'}
                <input hidden accept="image/jpeg,image/png,image/webp" type="file" onChange={handleImageChange} />
              </Button>
              {imageFiles.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                  {imageFiles.map((file, index) => (
                    <Chip key={`${file.name}-${index}`} label={file.name} onDelete={() => removeImage(index)} />
                  ))}
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, p: { xs: 2, sm: 3 }, bgcolor: '#fbfcfb', borderTop: '1px solid var(--line)' }}>
              <Button variant="text" type="button" onClick={() => router.push('/admin')}>Cancel</Button>
              <Button variant="contained" type="submit" disabled={loading}>{loading ? 'Saving...' : productId ? 'Save changes' : 'Create product'}</Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
