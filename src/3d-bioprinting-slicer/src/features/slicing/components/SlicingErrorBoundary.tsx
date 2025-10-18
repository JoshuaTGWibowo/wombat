import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
  AlertTitle,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export default class SlicingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('SlicingErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleToggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Paper sx={{ p: 3, m: 2, border: '1px solid', borderColor: 'error.main' }}>
          <Stack spacing={2}>
            <Alert severity="error" icon={<ErrorIcon />}>
              <AlertTitle>Slicing Component Error</AlertTitle>
              An error occurred while rendering the slicing component. This may be due to
              invalid parameters or a processing error.
            </Alert>

            <Box>
              <Typography variant="h6" gutterBottom>
                What happened?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The slicing component encountered an unexpected error. This could be due to:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Invalid physics parameters
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Corrupted slice data
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Memory or processing limitations
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Network or API errors
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                Try Again
              </Button>

              <Button
                variant="outlined"
                startIcon={<BugReportIcon />}
                onClick={this.handleToggleDetails}
                endIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {this.state.showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </Stack>

            <Collapse in={this.state.showDetails}>
              <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {this.state.error?.toString()}
                </Typography>

                {this.state.errorInfo && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Component Stack
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </>
                )}
              </Paper>
            </Collapse>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Troubleshooting Steps
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Check that all physics parameters are within valid ranges
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Verify that the model file is valid and not corrupted
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Try reducing the complexity of the slicing parameters
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Clear the cache and try again
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  If the problem persists, reset physics parameters and try again
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
      );
    }

    return this.props.children;
  }
}

// Hook for error boundary context
export const useSlicingError = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    setError(error);
    console.error('Slicing error:', error, errorInfo);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};
