import { Component, ReactNode } from "react";

type Props = { fallback?: ReactNode; children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: String(err?.message ?? err) };
  }
  componentDidCatch(err: any) {
    console.error("3D error:", err);
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
