import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { fetchPriorityNotifications } from "../api/notifications";
import { Log } from "../utils/logger";
import {
  getViewedNotificationIds,
  saveViewedNotificationId,
} from "../utils/viewedNotifications";

export function PriorityNotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [limit, setLimit] = useState(10);
  const [priorityNotifications, setPriorityNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadPriorityNotifications() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchPriorityNotifications({ limit, type: filter });

        if (ignore) {
          return;
        }

        const viewedIds = getViewedNotificationIds();
        setPriorityNotifications(
          data.notifications.map((notification) => ({
            ...notification,
            isRead: viewedIds.includes(notification.id),
          }))
        );
        Log("frontend", "info", "page", "Priority notifications loaded");
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load priority notifications");
          Log("frontend", "error", "page", "Unable to load priority notifications");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPriorityNotifications();

    return () => {
      ignore = true;
    };
  }, [filter, limit]);

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    Log("frontend", "info", "page", `Priority filter changed to ${nextFilter}`);
  };

  const handleLimitChange = (event) => {
    const nextLimit = Number(event.target.value);

    setLimit(nextLimit);
    Log("frontend", "debug", "page", `Priority limit changed to ${nextLimit}`);
  };

  const markAsRead = (notificationId) => {
    saveViewedNotificationId(notificationId);
    setPriorityNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  return (
    <Box sx={{ maxWidth: 820, mx: "auto", px: 2, py: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Priority Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Placement first, then result, then event. Newer items rank higher.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel id="priority-limit-label">Limit</InputLabel>
          <Select
            labelId="priority-limit-label"
            label="Limit"
            value={limit}
            onChange={handleLimitChange}
          >
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={15}>Top 15</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load priority notifications: {error}</Alert>
      )}

      {!loading && !error && priorityNotifications.length === 0 && (
        <Alert severity="info">No priority notifications found.</Alert>
      )}

      {!loading && !error && priorityNotifications.length > 0 && (
        <Stack spacing={1.5}>
          {priorityNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              action={
                !notification.isRead ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark read
                  </Button>
                ) : null
              }
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
