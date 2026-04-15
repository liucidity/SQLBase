import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6b7280',
    },
    error: {
      main: '#ef4444',
      dark: '#dc2626',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Oxygen',
      'system-ui',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#4f46e5',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

export default theme;
