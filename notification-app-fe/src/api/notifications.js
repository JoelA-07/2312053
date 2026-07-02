const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function fetchNotifications({ page = 1, limit = 10, type = "All" } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (type && type !== "All") {
    params.set("notification_type", type);
  }

  return request(`/notifications?${params.toString()}`);
}

export function fetchUnreadCount() {
  return request("/notifications/unread-count");
}

export function markNotificationAsRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    body: JSON.stringify({ isRead: true }),
  });
}
