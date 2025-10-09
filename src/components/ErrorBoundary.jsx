import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Weather for F1 crashed', error, info);
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;
    if (error) {
      return (
        <div className="min-h-screen bg-red-50 px-6 py-10 text-red-900">
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm">{error.message}</p>
            <pre className="mt-4 overflow-x-auto rounded bg-red-100 p-3 text-xs text-red-700">
              {error.stack}
            </pre>
            <p className="mt-4 text-sm">
              Try refreshing the page or clearing cached data. If the problem persists, please report the steps that caused it.
            </p>
          </div>
        </div>
      );
    }
    return children;
  }
}
