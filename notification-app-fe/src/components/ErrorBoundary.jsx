import { Component } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { Log } from "../utils/logger";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error.message || "Something went wrong",
    };
  }

  componentDidCatch(error) {
    Log("frontend", "fatal", "component", error.message || "UI crashed");
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 6 }}>
        <Alert severity="error">
          <Typography fontWeight={700}>Application error</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {this.state.message}
          </Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={this.handleReload}>
            Reload
          </Button>
        </Alert>
      </Box>
    );
  }
}
