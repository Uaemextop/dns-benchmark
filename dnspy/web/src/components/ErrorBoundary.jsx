import React from "react";
import { Card, CardBody, Button } from "@nextui-org/react";

/**
 * Error Boundary that catches rendering errors in its subtree and shows a
 * friendly fallback UI instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <Card className="max-w-md border border-danger-200/50 bg-danger-50/30 dark:bg-danger-950/20">
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-danger-600 dark:text-danger-400 mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-default-500 mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                onPress={this.handleReset}
              >
                Try Again
              </Button>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
