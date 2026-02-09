'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorMessage } from './ui/ErrorMessage';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Алдаа гарлаа
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Уучлаарай, ямар нэгэн алдаа гарлаа. Дахин оролдоно уу.
              </p>
            </div>
            
            {this.state.error && (
              <ErrorMessage
                message={this.state.error.message || 'Тодорхойгүй алдаа'}
                className="mb-4"
              />
            )}
            
            <div className="flex gap-4">
              <Button
                onClick={this.handleReset}
                variant="primary"
                fullWidth
              >
                Дахин оролдох
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                fullWidth
              >
                Нүүр хуудас руу буцах
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

