import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page">
          <div className="not-found">
            <div className="not-found-code">Something went wrong</div>
            <p className="not-found-message">{this.state.error.message}</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ error: null });
                window.location.href = "/agents";
              }}
            >
              Back to Agents
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
