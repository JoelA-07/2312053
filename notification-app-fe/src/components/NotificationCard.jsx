import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

const typeColor = {
  Placement: "success",
  Result: "primary",
  Event: "warning",
};

export function NotificationCard({ notification, action }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: notification.isRead ? "divider" : "primary.main",
        bgcolor: notification.isRead ? "background.paper" : "#eef5ff",
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Chip
              label={notification.type || "Notification"}
              color={typeColor[notification.type] || "default"}
              size="small"
            />
            {!notification.isRead && <Chip label="New" size="small" />}
          </Stack>

          <Typography fontWeight={600}>{notification.message}</Typography>

          <Typography variant="body2" color="text.secondary" mt={0.75}>
            {notification.timestamp || "No timestamp"}
          </Typography>
        </Box>

        <Box sx={{ flexShrink: 0 }}>{action}</Box>
      </Stack>
    </Paper>
  );
}
