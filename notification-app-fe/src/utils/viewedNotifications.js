import { Log } from "./logger";

const STORAGE_KEY = "viewed_notification_ids";

export function getViewedNotificationIds() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function saveViewedNotificationId(notificationId) {
  const viewedIds = getViewedNotificationIds();

  if (!viewedIds.includes(notificationId)) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...viewedIds, notificationId])
    );
    Log("frontend", "debug", "state", `Saved viewed notification ${notificationId}`);
  }
}
