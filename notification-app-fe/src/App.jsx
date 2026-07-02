import { useState } from "react";
import {
  Box,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityNotificationsPage } from "./pages/PriorityNotificationsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Log } from "./utils/logger";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f6feb",
    },
    background: {
      default: "#f6f8fb",
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default function App() {
  const [page, setPage] = useState("all");

  const handlePageChange = (_, nextPage) => {
    setPage(nextPage);
    Log("frontend", "info", "page", `Navigation changed to ${nextPage}`);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
          <Box sx={{ maxWidth: 920, mx: "auto", px: 2, pt: 2 }}>
            <Tabs
              value={page}
              onChange={handlePageChange}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="All Notifications" value="all" />
              <Tab label="Priority" value="priority" />
            </Tabs>
          </Box>

          {page === "all" ? <NotificationsPage /> : <PriorityNotificationsPage />}
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
