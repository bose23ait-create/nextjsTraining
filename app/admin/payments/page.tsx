'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import { isAdminUser } from '../../../redux/slices/authSlice';

type Order = {
  _id: string;
  createdAt: string;
  total: number;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  stripeSessionId?: string;
  customerDetails?: {
    name: string;
    email: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPaymentsPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      router.replace('/login');
      return;
    }
    if (!isAdminUser(user)) {
      router.replace('/products');
      return;
    }
    void fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load payments');
        setOrders(
          (Array.isArray(data) ? data : data.orders ?? data.items ?? data.data ?? []) as Order[]
        );
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to load payments'))
      .finally(() => setLoading(false));
  }, [router, token, user]);

  const filteredOrders = orders.filter((order) => {
    // Status Filter
    if (statusFilter !== 'all' && order.paymentStatus !== statusFilter) {
      // Handle the case where order.paymentStatus might be undefined, but they filter for 'pending'
      if (!order.paymentStatus && statusFilter !== 'pending') return false;
      if (order.paymentStatus && order.paymentStatus !== statusFilter) return false;
    }
    // Date Filter
    if (dateFilter) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (orderDate !== dateFilter) return false;
    }
    return true;
  });

  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);

  const statusCounts = {
    all: orders.length,
    paid: orders.filter((o) => o.paymentStatus === 'paid').length,
    refunded: orders.filter((o) => o.paymentStatus === 'refunded').length,
    pending: orders.filter((o) => o.paymentStatus === 'pending' || !o.paymentStatus).length,
    failed: orders.filter((o) => o.paymentStatus === 'failed').length,
  };

  if (!mounted) {
    return null;
  }

  const renderStatusTabs = () => {
    const tabs = [
      { id: 'all', label: 'All', count: statusCounts.all },
      { id: 'paid', label: 'Succeeded', count: statusCounts.paid },
      { id: 'refunded', label: 'Refunded', count: statusCounts.refunded },
      { id: 'pending', label: 'Pending', count: statusCounts.pending },
      { id: 'failed', label: 'Failed', count: statusCounts.failed },
    ];

    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 3, overflowX: 'auto', pb: 1 }}>
        {tabs.map((tab) => (
          <Card
            key={tab.id}
            sx={{
              minWidth: 140,
              border: statusFilter === tab.id ? '2px solid #635bff' : '1px solid #e0e5eb',
              boxShadow: 'none',
              borderRadius: 2,
              bgcolor: statusFilter === tab.id ? '#f8f9fe' : '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            <CardActionArea onClick={() => setStatusFilter(tab.id)}>
              <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                <Typography variant="body2" sx={{ color: statusFilter === tab.id ? '#635bff' : '#4f566b', fontWeight: 600, mb: 0.5 }}>
                  {tab.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1f36' }}>
                  {tab.count}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f9', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Payment History</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => router.push('/admin')}>Products</Button>
            <Button variant="outlined" onClick={() => router.push('/admin/orders')}>Orders</Button>
          </Box>
        </Box>

        {renderStatusTabs()}

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Date Filter"
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ bgcolor: '#fff', p: 1.5, border: '1px solid #e0e5eb', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">Total Filtered Amount</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1f36' }}>₹{totalAmount.toFixed(2)} INR</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e5eb', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Date', 'Order ID', 'Customer', 'Transaction ID', 'Amount', 'Status'].map((h) => (
                    <TableCell key={h}><Skeleton width="80%" /></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <Box sx={{ bgcolor: '#fff', p: 5, textAlign: 'center', border: '1px solid #e0e5eb', borderRadius: 2 }}>
            <Typography>No payment records found</Typography>
          </Box>
        )}

        {!loading && filteredOrders.length > 0 && (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e5eb', borderRadius: 2 }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#4f566b', borderBottom: '1px solid #e0e5eb' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4f566b', borderBottom: '1px solid #e0e5eb' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4f566b', borderBottom: '1px solid #e0e5eb' }}>session id</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4f566b', borderBottom: '1px solid #e0e5eb' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4f566b', borderBottom: '1px solid #e0e5eb' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4f566b', borderBottom: '1px solid #e0e5eb' }}>Order ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => {
                  let statusBg = '#e3e8ee';
                  let statusColor = '#4f566b';
                  let statusText = 'Pending';
                  
                  if (order.paymentStatus === 'paid') {
                    statusBg = '#e3fceb';
                    statusColor = '#0d7f3f';
                    statusText = 'Succeeded ✓';
                  } else if (order.paymentStatus === 'refunded') {
                    statusBg = '#e3e8ee';
                    statusColor = '#4f566b';
                    statusText = 'Refunded ↩';
                  } else if (order.paymentStatus === 'failed') {
                    statusBg = '#ffebeb';
                    statusColor = '#d92626';
                    statusText = 'Failed ✕';
                  }

                  return (
                    <TableRow key={order._id} hover sx={{ '& td': { borderBottom: '1px solid #e0e5eb', py: 1.5 } }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1a1f36' }}>
                        ₹{order.total.toFixed(2)} <span style={{ color: '#8792a2', fontWeight: 400, fontSize: '13px' }}>INR</span>
                      </TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: '13px',
                          fontWeight: 600,
                          bgcolor: statusBg,
                          color: statusColor,
                        }}>
                          {statusText}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: '#4f566b', fontSize: '13px' }}>
                        {order.stripeSessionId || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: '#4f566b', fontSize: '14px' }}>
                        {order.customerDetails?.email || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: '#4f566b', fontSize: '14px' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                        {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </TableCell>
                      <TableCell sx={{ color: '#8792a2', fontSize: '13px' }}>
                        #{order._id.slice(-8)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
}
