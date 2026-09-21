import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}
export class ErrorBoundary extends Component<ErrorBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError = (error: Error) => ({ error });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert">
        <p>Something went wrong.</p>
        <p style={{ color: "var(--muted)" }}>{error.message}</p>
      </div>
    );
  }
}
