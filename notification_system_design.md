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

# Stage 2

## Storage Choice

I would use MySQL for storing notifications.

Reasons:

- Notification data has a clear structure.
- We need filtering by student, type, read status, and time.
- SQL makes pagination and reporting queries simple.
- MySQL supports indexes well, which helps when data grows.
- It is reliable for transactional updates like marking notifications as read.

## Database Schema

```sql
CREATE TABLE students (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT NOT NULL,
  notification_type ENUM('Event', 'Result', 'Placement') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,

  CONSTRAINT fk_notifications_student
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE
);
```

Useful indexes:

```sql
CREATE INDEX idx_notifications_student_created
ON notifications (student_id, created_at DESC);

CREATE INDEX idx_notifications_student_type_created
ON notifications (student_id, notification_type, created_at DESC);

CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at DESC);
```

## Queries Based On Stage 1 APIs

### Get Notifications

```sql
SELECT
  id,
  notification_type AS type,
  message,
  created_at AS timestamp,
  is_read AS "isRead"
FROM notifications
WHERE student_id = 101
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

With type filter:

```sql
SELECT
  id,
  notification_type AS type,
  message,
  created_at AS timestamp,
  is_read AS "isRead"
FROM notifications
WHERE student_id = 101
  AND notification_type = 'Placement'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

### Get Single Notification

```sql
SELECT
  id,
  notification_type AS type,
  message,
  created_at AS timestamp,
  is_read AS "isRead"
FROM notifications
WHERE id = 1
  AND student_id = 101;
```

### Get Unread Count

```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE student_id = 101
  AND is_read = false;
```

### Mark Notification As Read

```sql
UPDATE notifications
SET is_read = true,
    read_at = CURRENT_TIMESTAMP
WHERE id = 1
  AND student_id = 101;
```

### Mark All Notifications As Read

```sql
UPDATE notifications
SET is_read = true,
    read_at = CURRENT_TIMESTAMP
WHERE student_id = 101
  AND is_read = false;
```

### Create Notifications

```sql
INSERT INTO notifications (student_id, notification_type, message)
VALUES
  (101, 'Placement', 'ABC Company hiring registration is open'),
  (102, 'Placement', 'ABC Company hiring registration is open');
```

## Problems As Data Grows

As notification data increases, these problems can happen:

- Fetching notifications can become slow if indexes are missing.
- Offset pagination becomes slower on very large pages.
- Unread count queries may run often and put pressure on the database.
- Old notifications can make the table very large.
- Sending notifications to many students can create too many inserts at once.

## How To Handle Scale

- Add indexes for common filters like student, type, read status, and created time.
- Use cursor pagination for large lists instead of deep offset pagination.
- Cache unread counts for a short time when traffic is high.
- Archive or delete very old notifications if the product does not need them forever.
- Use batch inserts when creating the same notification for many students.
- Use a queue for bulk notification sending so the API does not wait for every insert or email.
