'use client';

import { useEffect, useState,useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Box, Button, Card, CardContent, Chip, Container, FormControl, MenuItem, Pagination, Select, Skeleton, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import type { AppDispatch, RootState } from '../../redux/store';
import { getProducts } from '../../redux/slices/productSlice';
import { logout } from '../../redux/slices/authSlice';

type ProductFilter = 'all' | 'available' | 'soldOut';
type ProductViewState = {
  filter: ProductFilter;
  search: string;
  sortBy: 'name' | 'price' | 'stock';
  page: number;
  pageSize: 12 | 20 | 40 | 50;
};

const productViewStorageKey = 'products-view-state';

const imageUrl = (image: string) => image.startsWith('http') ? image : `http://localhost:3000${image}`;

export default function ProductsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const { products, loading, error, totalPages, counts } = useSelector((state: RootState) => state.products);
  const hasToken = Boolean(token || (typeof window !== 'undefined' && localStorage.getItem('token')));
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<ProductFilter>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<12 | 20 | 40 | 50>(12);
  const [restored, setRestored] = useState(false);
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

useEffect(() => {
  if (!mounted) return;

  const savedState = sessionStorage.getItem(productViewStorageKey);

  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState) as ProductViewState;

      if (parsedState.filter === 'all' || parsedState.filter === 'available') {
        setFilter(parsedState.filter);
      }

      if (typeof parsedState.search === 'string') {
        setSearch(parsedState.search);
      }

      if (
        parsedState.sortBy === 'name' ||
        parsedState.sortBy === 'price' ||
        parsedState.sortBy === 'stock'
      ) {
        setSortBy(parsedState.sortBy);
      }

      if (
        parsedState.pageSize === 12 ||
        parsedState.pageSize === 20 ||
        parsedState.pageSize === 40 ||
        parsedState.pageSize === 50
      ) {
        setPageSize(parsedState.pageSize);
      }

      if (
        typeof parsedState.page === 'number' &&
        parsedState.page > 0
      ) {
        setPage(parsedState.page);
      }
    } catch {
      sessionStorage.removeItem(productViewStorageKey);
    }
  }

  setRestored(true);
}, [mounted]);


  useEffect(() => {
    if (!mounted || !restored) return;
     console.log('SAVING pageSize:', pageSize);
    sessionStorage.setItem(productViewStorageKey, JSON.stringify({ filter, search, sortBy, page, pageSize } satisfies ProductViewState));
  }, [filter, mounted, page, pageSize, restored, search, sortBy]);

  useEffect(() => {
    if (!mounted || !restored) return;
    if (!hasToken) {
      router.replace('/login');
      return;
    }
    void dispatch(getProducts({
      page,
      limit: pageSize,
      name: search,
      stockAvailable: filter === 'all' ? undefined : filter === 'available',
      sortBy,
    })).then((result) => {
      if (getProducts.rejected.match(result) && result.payload === 'Your session has expired') {
        localStorage.removeItem('token');
        router.replace('/login');
      }
    });
  }, [dispatch, filter, hasToken, mounted, page, pageSize, restored, router, search, sortBy]);

  const currentPage = Math.min(page, Math.max(1, totalPages));

  const handleFilterChange = (_event: React.SyntheticEvent, value: ProductFilter) => {
    setFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value: 'name' | 'price' | 'stock') => {
    setSortBy(value);
    setPage(1);
  };

const handlePageSizeChange = (
  value: 12 | 20 | 40 | 50,
) => {
  console.log('USER SELECTED pageSize:', value);

  setPageSize(value);
  setPage(1);
};

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login');
  };

  if (!mounted || !hasToken) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', py: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">
        <Box component="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography component="h1" sx={{ fontSize: { xs: '1.45rem', md: '1.75rem' }, fontWeight: 800, letterSpacing: '-.035em', color: '#182431' }}>Products</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={handleLogout} sx={{ minWidth: 78, color: '#182431', borderColor: '#d9dfe7', bgcolor: '#fff' }}>Log out</Button>
          </Stack>
        </Box>

        <PaperSection>
          <Tabs value={filter} onChange={handleFilterChange} sx={{ minHeight: 48, '& .MuiTabs-indicator': { height: 2, bgcolor: '#18a957' } }}>
            <Tab value="all" label={<TabLabel label="All" count={counts.all} />} />
            <Tab value="available" label={<TabLabel label="Available" count={counts.available} />} />
            <Tab value="soldOut" label={<TabLabel label="Sold out" count={counts.soldOut} />} />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: { xs: 1.5, md: 2 }, border: '1px solid #e6e9ee', borderRadius: 1.5, bgcolor: '#fff', flexWrap: 'wrap' }}>
            <TextField fullWidth size="small" value={search} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search products..." aria-label="Search products" sx={{ flex: '1 1 280px' }} />
            <FormControl size="small" sx={{ minWidth: 150 }}><Select value={sortBy} onChange={(event) => handleSortChange(event.target.value as typeof sortBy)} aria-label="Sort products"><MenuItem value="name">Sort by name</MenuItem><MenuItem value="price">Sort by price</MenuItem><MenuItem value="stock">Sort by availability</MenuItem></Select></FormControl>
          </Box>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>{[1, 2, 3, 4].map((item) => <Card key={item}><Skeleton variant="rectangular" height={230} /><CardContent><Skeleton width="70%" /><Skeleton width="45%" /></CardContent></Card>)}</Box>
          ) : products.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}><Typography sx={{ fontWeight: 700 }}>No products found</Typography><Typography sx={{ color: '#7b8792', mt: .5 }}>Try changing your search or filter.</Typography></Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>
              {products.map((product) => <Card key={product._id} sx={{ border: '1px solid #e2e6eb', borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(22, 36, 49, .04)' }}>
                <Box sx={{ position: 'relative', p: 1.5, bgcolor: '#f0f2f4' }}>
                  {product.stock > 0 ? <Chip label="Available" size="small" sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, bgcolor: '#e4f6eb', color: '#269b58', fontSize: '.7rem', fontWeight: 700 }} /> : <Chip label="Sold out" size="small" sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, bgcolor: '#fcebe3', color: '#c27643', fontSize: '.7rem', fontWeight: 700 }} />}
                  {product.images[0] ? <Box component="img" src={imageUrl(product.images[0])} alt={product.name} sx={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 1.5 }} /> : <Box sx={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 1.5, bgcolor: '#e1e6e8', display: 'grid', placeItems: 'center' }}><Typography sx={{ color: '#71808a', fontSize: '.8rem' }}>No image</Typography></Box>}
                </Box>
                <CardContent sx={{ p: 1.75 }}>
                  <Typography sx={{ fontWeight: 750, fontSize: '.95rem', lineHeight: 1.3, minHeight: 40 }}>{product.name}</Typography>
                  <Typography sx={{ color: '#87919a', fontSize: '.78rem', mt: .8, minHeight: 34, lineHeight: 1.4 }}>{product.description}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, pt: 1.25, borderTop: '1px solid #edf0f2' }}><Typography sx={{ color: '#65717a', fontSize: '.78rem' }}>{product.stock > 0 ? `${product.stock} in stock` : 'Unavailable'}</Typography><Typography sx={{ color: '#4b5962', fontSize: '.95rem', fontWeight: 800 }}>${product.price.toFixed(2)}</Typography></Box>
                </CardContent>
              </Card>)}
            </Box>
          )}
            { products.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 3 }}>
                <Typography sx={{ color: '#65717a', fontSize: '.8rem' }}>Products per page</Typography>
                <FormControl size="small" sx={{ minWidth: 90 }}><Select value={pageSize} onChange={(event) => handlePageSizeChange(Number(event.target.value) as 12 | 20 | 40 | 50)} aria-label="Products per page"><MenuItem value={12}>12</MenuItem><MenuItem value={20}>20</MenuItem><MenuItem value={40}>40</MenuItem><MenuItem value={50}>50</MenuItem></Select></FormControl>
                <Pagination count={totalPages} page={currentPage} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" />
              </Box>
            )}
        </PaperSection>
      </Container>
    </Box>
  );
}

function PaperSection({ children }: { children: React.ReactNode }) {
  return <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e5eb', borderRadius: 2, p: { xs: 1, md: 1.5 }, boxShadow: '0 8px 24px rgba(22, 36, 49, .04)' }}>{children}</Box>;
}

function TabLabel({ label, count }: { label: string; count: number }) {
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: .75, textTransform: 'none' }}><span>{label}</span><Box component="span" sx={{ px: .7, py: .15, borderRadius: 1, bgcolor: '#eef1f4', color: '#87919a', fontSize: '.65rem', fontWeight: 700 }}>{count}</Box></Box>;
}
