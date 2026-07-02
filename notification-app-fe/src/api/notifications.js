const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function normalizeNotification(notification) {
  return {
    id: notification.ID || notification.id,
    type: notification.Type || notification.type || "Event",
    message: notification.Message || notification.message || "",
    timestamp: notification.Timestamp || notification.timestamp || "",
  };
}

async function request(url) {
  const headers = {
    Accept: "application/json",
  };

  if (import.meta.env.VITE_NOTIFICATION_API_TOKEN) {
    headers.Authorization = `Bearer ${import.meta.env.VITE_NOTIFICATION_API_TOKEN}`;
  }

  const response = await fetch(url, {
    headers: {
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function fetchNotifications({ page = 1, limit = 10, type = "All" } = {}) {
  const url = new URL(`${API_URL}/notifications`);
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (type && type !== "All") {
    params.set("notification_type", type);
  }

  url.search = params.toString();

  return request(url).then((data) => {
    const notifications = Array.isArray(data.notifications)
      ? data.notifications.map(normalizeNotification)
      : [];

    return {
      notifications,
      page,
      limit,
      total: data.total || notifications.length,
    };
  });
}

export function fetchPriorityNotifications({
  limit = 10,
  type = "All",
} = {}) {
  const url = new URL(`${API_URL}/notifications/priority`);
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (type && type !== "All") {
    params.set("notification_type", type);
  }

  url.search = params.toString();

  return request(url).then((data) => ({
    notifications: Array.isArray(data.notifications)
      ? data.notifications.map(normalizeNotification)
      : [],
    limit,
    total: data.total || 0,
  }));
}
