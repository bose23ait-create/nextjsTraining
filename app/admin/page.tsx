'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Pagination,
  Paper,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import type { AppDispatch, RootState } from '../../redux/store';

import {
  deleteProduct,
  getProducts,
  type Product,
} from '../../redux/slices/productSlice';

import { isAdminUser, logout } from '../../redux/slices/authSlice';

const API_URL=process.env.NEXT_PUBLIC_API_URL

type ProductFilter = 'all' | 'available' ;

type SortBy = 'name' | 'price' | 'stock';

const PAGE_SIZE = 12;
const adminViewStorageKey = 'admin-products-view-state';

type AdminViewState = {
  filter: ProductFilter;
  search: string;
  sortBy: SortBy;
  page: number;
};

const imageUrl = (image: string) =>
  image.startsWith('http')
    ? image
    : `${API_URL}${image}`;

export default function AdminPage() {
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
  } = useSelector(
    (state: RootState) => state.products,
  );

  const isAdmin = isAdminUser(user);

  const hasToken = Boolean(
    token ||
      (typeof window !== 'undefined' &&
        localStorage.getItem('token')),
  );

  const userStorageId =
    user?.id || user?._id || user?.email || 'anonymous';
  const scopedAdminViewStorageKey =
    `${adminViewStorageKey}:${userStorageId}`;

  const [search, setSearch] = useState('');

  const [sortBy, setSortBy] =
    useState<SortBy>('name');

  const [filter, setFilter] =
    useState<ProductFilter>('all');

  const [page, setPage] = useState(1);

  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const savedState = sessionStorage.getItem(
        scopedAdminViewStorageKey,
      );

      if (savedState) {
        try {
          const parsedState =
            JSON.parse(savedState) as AdminViewState;

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
            scopedAdminViewStorageKey,
          );
        }
      }

      setRestored(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [mounted, scopedAdminViewStorageKey]);

  useEffect(() => {
    if (!mounted || !restored) {
      return;
    }

    const state: AdminViewState = {
      filter,
      search,
      sortBy,
      page,
    };

    sessionStorage.setItem(
      scopedAdminViewStorageKey,
      JSON.stringify(state),
    );
  }, [
    filter,
    search,
    sortBy,
    page,
    mounted,
    restored,
    scopedAdminViewStorageKey,
  ]);

  /*
   * Authentication + server-side product request.
   */
  useEffect(() => {
    if (!mounted || !restored) {
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

    void dispatch(
      getProducts({
        page,
        limit: PAGE_SIZE,
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
    isAdmin,
    mounted,
    page,
    restored,
    router,
    search,
    sortBy,
  ]);

  /*
   * Edit product.
   */
  const handleEdit = (product: Product) => {
    if (!isAdmin) {
      return;
    }

    router.push(
      `/admin/products/${product._id}/edit`,
    );
  };

  /*
   * Delete product.
   */
const handleDelete = async (
  productId: string,
) => {
  if (!isAdmin) {
    return;
  }

  const result = await dispatch(
    deleteProduct(productId),
  );

  if (deleteProduct.fulfilled.match(result)) {
    const nextPage =
      products.length === 1 && page > 1
        ? page - 1
        : page;

    if (nextPage !== page) {
      setPage(nextPage);
    }

    // Fetch latest products and counts
    void dispatch(
      getProducts({
        page: nextPage,
        limit: PAGE_SIZE,
        name: search,
        stockAvailable:
          filter === 'all'
            ? undefined
            : filter === 'available',
        sortBy,
      }),
    );
  }
};

  /*
   * Logout.
   */
  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login');
  };

  /*
   * Filter.
   */
  const handleFilterChange = (
    _event: React.SyntheticEvent,
    value: ProductFilter,
  ) => {
    setFilter(value);
    setPage(1);
  };

  /*
   * Search.
   */
  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);
    setPage(1);
  };

  /*
   * Sort.
   */
  const handleSortChange = (
    value: SortBy,
  ) => {
    setSortBy(value);
    setPage(1);
  };

  /*
   * Pagination.
   */
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  if (
    !mounted ||
    !hasToken ||
    !isAdmin
  ) {
    return null;
  }

  const currentPage = Math.min(
    page,
    Math.max(1, totalPages),
  );

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
          <Box>
            <Typography
              sx={{
                color: 'var(--accent)',
                fontWeight: 800,
                letterSpacing: '.14em',
                fontSize: '.68rem',
              }}
            >
              ADMIN PANEL
            </Typography>

            <Typography
              component="h1"
              sx={{
                mt: 0.5,
                fontSize: {
                  xs: '1.45rem',
                  md: '1.75rem',
                },
                fontWeight: 800,
                letterSpacing: '-.035em',
                color: '#182431',
              }}
            >
              Product studio
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => router.push('/admin/orders')}>Orders</Button>
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
          </Box>
        </Box>

        {/* Main container */}
        <Box
          sx={{
            bgcolor: '#fff',
            border: '1px solid #e0e5eb',
            borderRadius: 2,
            p: { xs: 1, md: 1.5 },
            boxShadow:
              '0 8px 24px rgba(22, 36, 49, .04)',
          }}
        >

          {/* Top section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              px: { xs: 0.5, md: 1 },
              mb: 1,
            }}
          >
            <Typography
              sx={{
                color: '#66727d',
                fontSize: '.85rem',
              }}
            >
              Manage your catalog
            </Typography>

            <Button
              variant="contained"
              onClick={() =>
                router.push('/admin/products/new')
              }
            >
              Add product
            </Button>
          </Box>

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
              p: { xs: 1.5, md: 2 },
              border:
                '1px solid #e6e9ee',
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
                handleSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search products..."
              aria-label="Search products"
              sx={{
                flex: '1 1 280px',
              }}
            />

            <select
              value={sortBy}
              onChange={(event) =>
                handleSortChange(
                  event.target.value as SortBy,
                )
              }
              aria-label="Sort products"
              style={{
                height: '40px',
                minWidth: '150px',
                padding: '0 12px',
                border: '1px solid #c4c9ce',
                borderRadius: '4px',
                backgroundColor: '#fff',
              }}
            >
              <option value="name">
                Sort by name
              </option>

              <option value="price">
                Sort by price
              </option>

              <option value="stock">
                Sort by availability
              </option>
            </select>
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
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                mt: 2,
                border:
                  '1px solid #e2e6eb',
                borderRadius: 2,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      'Product',
                      'Description',
                      'Price',
                      'Stock',
                      'Status',
                      'Actions',
                    ].map((heading) => (
                      <TableCell key={heading}>
                        <Skeleton width="80%" />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <TableRow key={item}>
                        {[1, 2, 3, 4, 5, 6].map(
                          (cell) => (
                            <TableCell key={cell}>
                              <Skeleton />
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : products.length === 0 ? (

            /* Empty state */
            <Box
              sx={{
                py: 10,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#304954',
                  fontWeight: 700,
                }}
              >
                {search
                  ? 'No matching products'
                  : 'No products available'}
              </Typography>

              <Typography
                sx={{
                  color: '#71828b',
                  mt: 1,
                }}
              >
                {search
                  ? 'Try a different search term.'
                  : 'Products will appear here when they are added.'}
              </Typography>
            </Box>

          ) : (

            /* Server response data table */
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                mt: 2,
                border:
                  '1px solid #e2e6eb',
                borderRadius: 2,
                overflowX: 'auto',
              }}
            >
              <Table
                sx={{
                  minWidth: 900,
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: '#f8fafb',
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: '#44525c',
                      }}
                    >
                      Product
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: '#44525c',
                      }}
                    >
                      Description
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: '#44525c',
                      }}
                    >
                      Price
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: '#44525c',
                      }}
                    >
                      Stock
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: '#44525c',
                      }}
                    >
                      Status
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: '#44525c',
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {products.map(
                    (product) => (
                      <TableRow
                        key={product._id}
                        hover
                      >

                        {/* Product */}
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            {product.images?.[0] ? (
                              <Box
                                component="img"
                                src={imageUrl(
                                  product.images[0],
                                )}
                                alt={product.name}
                                sx={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 1,
                                  objectFit: 'cover',
                                  border:
                                    '1px solid #e2e6eb',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 1,
                                  bgcolor:
                                    '#e9edef',
                                  display: 'grid',
                                  placeItems:
                                    'center',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize:
                                      '.65rem',
                                    color:
                                      '#71808a',
                                  }}
                                >
                                  No image
                                </Typography>
                              </Box>
                            )}

                            <Typography
                              sx={{
                                fontWeight: 700,
                                color: '#25343d',
                              }}
                            >
                              {product.name}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <Typography
                            sx={{
                              maxWidth: 260,
                              color: '#71808a',
                              fontSize: '.82rem',
                              overflow: 'hidden',
                              textOverflow:
                                'ellipsis',
                              display:
                                '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient:
                                'vertical',
                            }}
                          >
                            {product.description}
                          </Typography>
                        </TableCell>

                        {/* Price */}
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              color: '#4b5962',
                            }}
                          >
                            ₹
                            {product.price.toFixed(
                              2,
                            )}
                          </Typography>
                        </TableCell>

                        {/* Stock */}
                        <TableCell>
                          <Typography
                            sx={{
                              color: '#65717a',
                              fontSize: '.85rem',
                            }}
                          >
                            {product.stock}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {product.stock > 0 ? (
                            <Chip
                              label="Available"
                              size="small"
                              sx={{
                                bgcolor:
                                  '#e4f6eb',
                                color:
                                  '#269b58',
                                fontWeight: 700,
                              }}
                            />
                          ) : (
                            <Chip
                              label="Sold out"
                              size="small"
                              sx={{
                                bgcolor:
                                  '#fcebe3',
                                color:
                                  '#c27643',
                                fontWeight: 700,
                              }}
                            />
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent:
                                'flex-end',
                              gap: 1,
                            }}
                          >
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handleEdit(
                                  product,
                                )
                              }
                            >
                              Edit
                            </Button>

                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() =>
                                handleDelete(
                                  product._id,
                                )
                              }
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>

                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {!loading &&
            products.length > 0 && (
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
                  onChange={
                    handlePageChange
                  }
                  color="primary"
                  shape="rounded"
                />
              </Box>
            )}
        </Box>
      </Container>
    </Box>
  );
}

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