'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Pagination,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  FormControl,
  MenuItem,
  Select,
} from '@mui/material';

import type { AppDispatch, RootState } from '../../redux/store';
import { getProducts } from '../../redux/slices/productSlice';
import { logout } from '../../redux/slices/authSlice';

type ProductFilter = 'all' | 'available' ;

type ProductViewState = {
  filter: ProductFilter;
  search: string;
  sortBy: 'name' | 'price' | 'stock';
  page: number;
};

const productViewStorageKey = 'products-view-state';

// Fixed number of products per page
const PRODUCTS_PER_PAGE = 12;
const API_URL=process.env.NEXT_PUBLIC_API_URL
const imageUrl = (image: string) =>
  image.startsWith('http')
    ? image
    : `${API_URL}${image}`;

export default function ProductsPage() {
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();

  const token = useSelector(
    (state: RootState) => state.auth.token,
  );

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  const {
    products,
    loading,
    error,
    totalPages,
    counts,
  } = useSelector((state: RootState) => state.products);

  const hasToken = Boolean(
    token ||
      (typeof window !== 'undefined' &&
        localStorage.getItem('token')),
  );

  const userStorageId =
    user?.id || user?._id || user?.email || 'anonymous';
  const scopedProductViewStorageKey =
    `${productViewStorageKey}:${userStorageId}`;

  const [mounted, setMounted] = useState(false);

  const [filter, setFilter] =
    useState<ProductFilter>('all');

  const [search, setSearch] = useState('');

  const [sortBy, setSortBy] = useState<
    'name' | 'price' | 'stock'
  >('name');

  const [page, setPage] = useState(1);

  const [restored, setRestored] = useState(false);

  /*
   * Mount component on client.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  /*
   * Restore filter/search/sort/page
   * from sessionStorage.
   */
useEffect(() => {
  if (!mounted) return;

  const frame = window.requestAnimationFrame(() => {
    const savedState = sessionStorage.getItem(
      scopedProductViewStorageKey,
    );

    if (savedState) {
      try {
        const parsedState =
          JSON.parse(savedState) as ProductViewState;

        if (
          parsedState.filter === 'all' ||
          parsedState.filter === 'available'
        ) {
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
          typeof parsedState.page === 'number' &&
          parsedState.page > 0
        ) {
          setPage(parsedState.page);
        }
      } catch {
        sessionStorage.removeItem(
          scopedProductViewStorageKey,
        );
      }
    }

    setRestored(true);
  });

  return () => {
    window.cancelAnimationFrame(frame);
  };
}, [mounted, scopedProductViewStorageKey]);

  /*
   * Save filter/search/sort/page
   * into sessionStorage.
   */
  useEffect(() => {
    if (!mounted || !restored) return;

    const state: ProductViewState = {
      filter,
      search,
      sortBy,
      page,
    };

    sessionStorage.setItem(
      scopedProductViewStorageKey,
      JSON.stringify(state),
    );
  }, [
    filter,
    search,
    sortBy,
    page,
    mounted,
    restored,
    scopedProductViewStorageKey,
  ]);

  /*
   * Fetch products whenever
   * page/filter/search/sort changes.
   */
  useEffect(() => {
    if (!mounted || !restored) return;

    if (!hasToken) {
      router.replace('/login');
      return;
    }

    void dispatch(
      getProducts({
        page,
        limit: PRODUCTS_PER_PAGE,
        name: search,
        stockAvailable:
          filter === 'all'
            ? undefined
            : filter === 'available',
        sortBy,
      }),
    ).then((result) => {
      if (
        getProducts.rejected.match(result) &&
        result.payload === 'Your session has expired'
      ) {
        localStorage.removeItem('token');
        router.replace('/login');
      }
    });
  }, [
    dispatch,
    filter,
    hasToken,
    mounted,
    page,
    restored,
    router,
    search,
    sortBy,
  ]);

  /*
   * Make sure current page is never
   * greater than the available pages.
   */
  const currentPage = Math.min(
    page,
    Math.max(1, totalPages),
  );

  /*
   * Filter change.
   */
  const handleFilterChange = (
    _event: React.SyntheticEvent,
    value: ProductFilter,
  ) => {
    setFilter(value);
    setPage(1);
  };

  /*
   * Search change.
   */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  /*
   * Sort change.
   */
  const handleSortChange = (
    value: 'name' | 'price' | 'stock',
  ) => {
    setSortBy(value);
    setPage(1);
  };

  /*
   * Pagination change.
   */
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  /*
   * Logout.
   */
  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login');
  };

  /*
   * Prevent hydration mismatch.
   */
  if (!mounted || !hasToken) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f4f6f9',
        py: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="xl">

        {/* Header */}
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: {
                xs: '1.45rem',
                md: '1.75rem',
              },
              fontWeight: 800,
              letterSpacing: '-.035em',
              color: '#182431',
            }}
          >
            Products
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                minWidth: 78,
                color: '#182431',
                borderColor: '#d9dfe7',
                bgcolor: '#fff',
              }}
            >
              Log out
            </Button>
          </Stack>
        </Box>

        <PaperSection>

          {/* Filter tabs */}
          <Tabs
            value={filter}
            onChange={handleFilterChange}
            sx={{
              minHeight: 48,
              '& .MuiTabs-indicator': {
                height: 2,
                bgcolor: '#18a957',
              },
            }}
          >
            <Tab
              value="all"
              label={
                <TabLabel
                  label="All"
                  count={counts.all}
                />
              }
            />

            <Tab
              value="available"
              label={
                <TabLabel
                  label="Available"
                  count={counts.available}
                />
              }
            />

          </Tabs>

          {/* Search + Sort */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              p: {
                xs: 1.5,
                md: 2,
              },
              border: '1px solid #e6e9ee',
              borderRadius: 1.5,
              bgcolor: '#fff',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) =>
                handleSearchChange(event.target.value)
              }
              placeholder="Search products..."
              aria-label="Search products"
              sx={{
                flex: '1 1 280px',
              }}
            />

            <FormControl
              size="small"
              sx={{
                minWidth: 150,
              }}
            >
              <Select
                value={sortBy}
                onChange={(event) =>
                  handleSortChange(
                    event.target.value as
                      | 'name'
                      | 'price'
                      | 'stock',
                  )
                }
                aria-label="Sort products"
              >
                <MenuItem value="name">
                  Sort by name
                </MenuItem>

                <MenuItem value="price">
                  Sort by price
                </MenuItem>

                <MenuItem value="stock">
                  Sort by availability
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* Loading */}
          {loading ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  xl: 'repeat(4, 1fr)',
                },
                gap: 2,
                mt: 2,
              }}
            >
              {[1, 2, 3, 4].map((item) => (
                <Card key={item}>
                  <Skeleton
                    variant="rectangular"
                    height={230}
                  />

                  <CardContent>
                    <Skeleton width="70%" />
                    <Skeleton width="45%" />
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : products.length === 0 ? (

            /* No products */
            <Box
              sx={{
                py: 10,
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                No products found
              </Typography>

              <Typography
                sx={{
                  color: '#7b8792',
                  mt: 0.5,
                }}
              >
                Try changing your search or filter.
              </Typography>
            </Box>

          ) : (

            /* Product cards */
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  xl: 'repeat(4, 1fr)',
                },
                gap: 2,
                mt: 2,
              }}
            >
              {products.map((product) => (
                <Card
                  key={product._id}
                  sx={{
                    border: '1px solid #e2e6eb',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow:
                      '0 2px 8px rgba(22, 36, 49, .04)',
                  }}
                >
                  {/* Image */}
                  <Box
                    sx={{
                      position: 'relative',
                      p: 1.5,
                      bgcolor: '#f0f2f4',
                    }}
                  >
                    {product.stock > 0 ? (
                      <Chip
                        label="Available"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          zIndex: 1,
                          bgcolor: '#e4f6eb',
                          color: '#269b58',
                          fontSize: '.7rem',
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <Chip
                        label="Sold out"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          zIndex: 1,
                          bgcolor: '#fcebe3',
                          color: '#c27643',
                          fontSize: '.7rem',
                          fontWeight: 700,
                        }}
                      />
                    )}

                    {product.images[0] ? (
                      <Box
                        component="img"
                        src={imageUrl(
                          product.images[0],
                        )}
                        alt={product.name}
                        sx={{
                          display: 'block',
                          width: '100%',
                          aspectRatio: '1 / 1',
                          objectFit: 'cover',
                          borderRadius: 1.5,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: 1.5,
                          bgcolor: '#e1e6e8',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#71808a',
                            fontSize: '.8rem',
                          }}
                        >
                          No image
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Product information */}
                  <CardContent
                    sx={{
                      p: 1.75,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 750,
                        fontSize: '.95rem',
                        lineHeight: 1.3,
                        minHeight: 40,
                      }}
                    >
                      {product.name}
                    </Typography>

                    <Typography
                      sx={{
                        color: '#87919a',
                        fontSize: '.78rem',
                        mt: 0.8,
                        minHeight: 34,
                        lineHeight: 1.4,
                      }}
                    >
                      {product.description}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 1.5,
                        pt: 1.25,
                        borderTop:
                          '1px solid #edf0f2',
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#65717a',
                          fontSize: '.78rem',
                        }}
                      >
                        {product.stock > 0
                          ? `${product.stock} in stock`
                          : 'Unavailable'}
                      </Typography>

                      <Typography
                        sx={{
                          color: '#4b5962',
                          fontSize: '.95rem',
                          fontWeight: 800,
                        }}
                      >
                        ${product.price.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Pagination ONLY */}
          {products.length > 0 && totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 3,
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}

        </PaperSection>
      </Container>
    </Box>
  );
}

/*
 * Main white section
 */
function PaperSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #e0e5eb',
        borderRadius: 2,
        p: {
          xs: 1,
          md: 1.5,
        },
        boxShadow:
          '0 8px 24px rgba(22, 36, 49, .04)',
      }}
    >
      {children}
    </Box>
  );
}

/*
 * Tab label with count
 */
function TabLabel({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        textTransform: 'none',
      }}
    >
      <span>{label}</span>

      <Box
        component="span"
        sx={{
          px: 0.7,
          py: 0.15,
          borderRadius: 1,
          bgcolor: '#eef1f4',
          color: '#87919a',
          fontSize: '.65rem',
          fontWeight: 700,
        }}
      >
        {count}
      </Box>
    </Box>
  );
}