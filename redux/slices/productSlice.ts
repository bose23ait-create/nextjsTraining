import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
}

export interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

export const getProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: string }
>('products/getProducts', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return rejectWithValue('Please log in to view products');
  }

  try {
    const response = await fetch('http://localhost:3000/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        response.status === 401 ? 'Your session has expired' : 'Unable to load products',
      );
    }

    return data as Product[];
  } catch {
    return rejectWithValue('Unable to connect to the server');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.total = action.payload.length;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load products';
      });
  },
});

export default productSlice.reducer;





