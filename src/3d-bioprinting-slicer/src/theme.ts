import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8B5CF6' },
    secondary: { main: '#00d4ff' },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#E5E7EB',
      secondary: '#D1D5DB',
      disabled: '#9CA3AF',
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 10 },
      },
    },
  },
  typography: {
    fontFamily: [
      'SF Pro Text',
      'Inter',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: 28, lineHeight: '34px' },
    h2: { fontSize: 22, lineHeight: '28px' },
    h3: { fontSize: 18, lineHeight: '24px' },
    body1: { fontSize: 14, lineHeight: '20px' },
    caption: { fontSize: 12, lineHeight: '16px' },
  },
});


