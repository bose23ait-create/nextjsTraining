import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: 'admin' | 'user' | string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

type AuthRecord = Record<string, unknown>;

const getRoleValue = (user: AuthRecord | null | undefined): string => {
  const role = user?.role ?? user?.roles ?? user?.isAdmin ?? user?.is_admin;

  if (Array.isArray(role)) {
    return String(role[0] ?? 'user');
  }

  return String(role ?? 'user');
};

const normalizeUser = (payload: AuthRecord | null | undefined): User | null => {
  if (!payload) return null;

  const user = (payload.user ?? payload) as AuthRecord;
  const roleValue = getRoleValue(user).toLowerCase();

  return {
    id: String(user.id ?? user._id ?? ''),
    _id: String(user._id ?? user.id ?? ''),
    name: String(user.name ?? ''),
    email: String(user.email ?? ''),
    role: roleValue === 'admin' ? 'admin' : 'user',
  };
};

export const isAdminUser = (user: User | null) => {
  const role = user?.role?.toLowerCase();
  return role === 'admin';
};

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

const loadStoredAuth = (): Partial<AuthState> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');

  return {
    token: savedToken,
    user: savedUser ? normalizeUser(JSON.parse(savedUser)) : null,
  };
};

const authInitialState: AuthState = {
  ...initialState,
  ...loadStoredAuth(),
};

export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed');
      }

      if (typeof window !== 'undefined' && data.access_token) {
        localStorage.setItem('token', data.access_token);
      }

      return data;
    } catch {
      return rejectWithValue('Something went wrong');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    credentials: { name: string; email: string; password: string; age: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch('http://localhost:3000/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          Array.isArray(data.message) ? data.message.join(', ') : data.message,
        );
      }

      return data;
    } catch {
      return rejectWithValue('Unable to connect to the server');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: authInitialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token || action.payload.token || null;
        state.user = normalizeUser(action.payload);

        if (typeof window !== 'undefined' && state.user) {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = normalizeUser(action.payload);
        state.error = null;
      })

      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;