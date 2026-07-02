# Stage 1

## Notification System API Design

This document defines simple REST APIs for showing notifications to a logged-in student. The frontend can use these APIs to display all notifications, apply filters, show unread count, and update read status.

Base URL:

```text
https://api/notifications
```

Common headers:

```text
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

Notification object:

```json
{
  "id": "1",
  "type": "Placement",
  "message": "ABC Company hiring registration is open",
  "timestamp": "2026-04-22 17:51:18",
  "isRead": false
}
```

Supported notification types:

```text
Event, Result, Placement
```

## Core Actions

- View notifications
- Filter notifications by type
- Limit number of notifications
- Move between pages
- Mark notifications as read
- Show real-time notification updates

## API Endpoints

### 1. Get Notifications

```text
GET https://api/notifications
```

Query parameters:

| Name | Required | Example | Use |
| --- | --- | --- | --- |
| `limit` | No | `10` | Number of notifications to return |
| `page` | No | `1` | Page number |
| `notification_type` | No | `Placement` | Filter by notification type |

Response:

```json
{
  "notifications": [
    {
      "id": "1",
      "type": "Placement",
      "message": "ABC Company hiring registration is open",
      "timestamp": "2026-04-22 17:51:18",
      "isRead": false
    },
    {
      "id": "2",
      "type": "Result",
      "message": "Mid-sem result published",
      "timestamp": "2026-04-22 17:50:54",
      "isRead": true
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 25
}
```

### 2. Get Single Notification

```text
GET https://api/notifications/{notificationId}
```

Response:

```json
{
  "notification": {
    "id": "1",
    "type": "Placement",
    "message": "ABC Company hiring registration is open",
    "timestamp": "2026-04-22 17:51:18",
    "isRead": false
  }
}
```

### 3. Get Unread Count

```text
GET https://api/notifications/unread-count
```

Response:

```json
{
  "unreadCount": 5
}
```

### 4. Mark Notification As Read

```text
PATCH https://api/notifications/{notificationId}/read
```

Request:

```json
{
  "isRead": true
}
```

Response:

```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "1",
    "isRead": true
  }
}
```

### 5. Mark All Notifications As Read

```text
PATCH https://api/notifications/read-all
```

Response:

```json
{
  "message": "All notifications marked as read",
  "updatedCount": 5
}
```

### 6. Create Notification

This endpoint can be used by admin or backend services to create notifications for students.

```text
POST https://api/notifications
```

Request:

```json
{
  "studentIds": [101, 102],
  "type": "Placement",
  "message": "ABC Company hiring registration is open"
}
```

Response:

```json
{
  "message": "Notifications created",
  "createdCount": 2
}
```

## Error Format

```json
{
  "error": "Notification not found"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `400` | Invalid request |
| `401` | User is not authenticated |
| `404` | Notification not found |
| `500` | Server error |

## Real-Time Notifications

For real-time updates, I would use Server-Sent Events because notifications mostly move from server to frontend.

```text
GET https://api/notifications/stream
```

Headers:

```text
Authorization: Bearer <token>
Accept: text/event-stream
```

Example event:

```text
event: notification
data: {"id":"3","type":"Placement","message":"New placement drive added","timestamp":"2026-04-22 18:00:00","isRead":false}
```

SSE is simple for this use case because the frontend only needs to receive new notification events. Normal REST APIs can still handle listing, filtering, and marking notifications as read.
