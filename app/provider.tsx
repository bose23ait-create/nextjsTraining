'use client';

import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import store from '../redux/store';

const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-geist-sans), sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          minHeight: 36,
          padding: '7px 14px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },
  },
});

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </Provider>
  );
}