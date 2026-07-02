import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { NotificationsPage } from "./pages/NotificationsPage";

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationsPage />
    </ThemeProvider>
  );
}
