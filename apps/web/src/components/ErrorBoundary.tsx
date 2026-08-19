import { Component, ReactNode } from 'react';
import { Button, Container, Typography } from './ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Typography variant="h2" color="error">
              Oops! Terjadi kesalahan
            </Typography>
            <Typography variant="body1" color="secondary" style={{ marginTop: '1rem' }}>
              {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga'}
            </Typography>
            <Button
              variant="primary"
              onClick={this.handleRetry}
              style={{ marginTop: '2rem' }}
            >
              Coba Lagi
            </Button>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}
