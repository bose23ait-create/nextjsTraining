import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  images?: Array<string | File>;
  existingImages?: string[];
}

const appendProductFormData = (formData: FormData, productData: ProductFormData) => {
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('price', String(Number(productData.price)));
  formData.append('stock', String(Number(productData.stock)));

  const images = (productData.images ?? []).filter((image) => image instanceof File);

  images.forEach((image) => {
    formData.append('images', image as File);
  });

  if (productData.existingImages !== undefined) {
    const existingImages = productData.existingImages;
    formData.append('existingImages', existingImages.length > 0 ? existingImages[0] : '');
    existingImages.slice(1).forEach((image) => {
      formData.append('existingImages', image);
    });
  }
};

export interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    all: number;
    available: number;
    soldOut: number;
  };
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: ProductState['counts'];
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  counts: { all: 0, available: 0, soldOut: 0 },
};

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getStoredToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getProducts = createAsyncThunk<
  ProductListResponse,
  { page?: number; limit?: number; name?: string; stockAvailable?: boolean; sortBy?: 'name' | 'price' | 'stock' } | void,
  { rejectValue: string }
>('products/getProducts', async (params = {}, { rejectWithValue }) => {
  const token = getStoredToken();

  if (!token) {
    return rejectWithValue('Please log in to view products');
  }

  try {
    const queryParams = params ?? {};
    const query = new URLSearchParams({
      page: String(queryParams.page ?? 1),
      limit: String(queryParams.limit ?? 8),
      sortBy: queryParams.sortBy ?? 'name',
    });
    if (queryParams.name) query.set('name', queryParams.name);
    if (queryParams.stockAvailable !== undefined) query.set('stockAvailable', String(queryParams.stockAvailable));

    const response = await fetch(`http://localhost:3000/products?${query.toString()}`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        response.status === 401 ? 'Your session has expired' : 'Unable to load products',
      );
    }

    return data as ProductListResponse;
  } catch {
    return rejectWithValue('Unable to connect to the server');
  }
});

export const createProduct = createAsyncThunk<
  Product,
  ProductFormData,
  { rejectValue: string }
>('products/createProduct', async (productData, { rejectWithValue }) => {
  const token = getStoredToken();

  if (!token) {
    return rejectWithValue('Please log in to create a product');
  }

  try {
    const formData = new FormData();
    appendProductFormData(formData, productData);

    const response = await fetch('http://localhost:3000/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Unable to create product',
      );
    }

    return data as Product;
  } catch {
    return rejectWithValue('Unable to connect to the server');
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  { id: string; productData: ProductFormData },
  { rejectValue: string }
>('products/updateProduct', async ({ id, productData }, { rejectWithValue }) => {
  const token = getStoredToken();

  if (!token) {
    return rejectWithValue('Please log in to update a product');
  }

  try {
    const formData = new FormData();
    appendProductFormData(formData, productData);

    const response = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Unable to update product',
      );
    }

    return data as Product;
  } catch {
    return rejectWithValue('Unable to connect to the server');
  }
});

export const deleteProduct = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('products/deleteProduct', async (id, { rejectWithValue }) => {
  const token = getStoredToken();

  if (!token) {
    return rejectWithValue('Please log in to delete a product');
  }

  try {
    const response = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        data.message || 'Unable to delete product',
      );
    }

    return id;
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
        state.products = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
        state.counts = action.payload.counts;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load products';
      })
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = [action.payload, ...state.products];
        state.total = state.products.length;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to create product';
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.map((product) =>
          product._id === action.payload._id ? action.payload : product,
        );
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to update product';
      })
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((product) => product._id !== action.payload);
        state.total = state.products.length;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to delete product';
      });
  },
});

export default productSlice.reducer;

