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

# Stage 3

## Slow Unread Query Analysis

Original query:

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

The idea is correct because it fetches unread notifications for one student. I would still change the column names to match the schema:

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
  AND is_read = false
ORDER BY created_at ASC;
```

It becomes slow at 5,000,000 rows if MySQL has to scan many rows, filter by `student_id` and `is_read`, and then sort by `created_at`.

Better index:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at);
```

With this compound index, MySQL can directly find rows for one student, only unread rows, already ordered by created time. The cost becomes close to `O(log n + k)`, where `k` is the number of unread notifications returned. Without the index, it can be close to `O(n log n)` because it may scan and sort a large part of the table.

Adding indexes on every column is not a good idea. Indexes improve selected reads, but they also use extra storage and slow down inserts, updates, and deletes. Indexes should match real query patterns.

Query to find all students who got a placement notification in the last 7 days:

```sql
SELECT DISTINCT
  s.id,
  s.name,
  s.email
FROM students s
JOIN notifications n ON n.student_id = s.id
WHERE n.notification_type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL 7 DAY;
```

# Stage 4

## Reducing Load From Page Reloads

Fetching notifications from the database on every page load can overwhelm the DB. I would combine these changes:

### 1. Cache Recent Notifications

Use Redis to cache the first page of notifications and unread count for each student.

Example keys:

```text
notifications:student:1042:page:1:type:all
notifications:student:1042:unread_count
```

Tradeoff: cache makes reads faster, but the app must invalidate or refresh cache when new notifications arrive or read status changes.

### 2. Use Pagination

Always fetch limited rows with `limit` and `page`, or cursor pagination for very large lists.

Tradeoff: offset pagination is easy, but deep pages are slow. Cursor pagination is faster but slightly more complex for frontend state.

### 3. Use Real-Time Push

Use SSE to send only new notifications after the page is loaded. The frontend should not refetch everything repeatedly.

Tradeoff: SSE adds connection handling, but it reduces repeated database reads.

### 4. Store Viewed State On Frontend

The frontend can store viewed notification IDs in `localStorage`. This avoids unnecessary mark-read calls for the same notification.

Tradeoff: localStorage is per browser, so server-side `is_read` is still needed for permanent state across devices.

### 5. Archive Old Notifications

Move old notifications to an archive table or cheaper storage.

Tradeoff: old data becomes slower to access, but normal user flows stay fast.

# Stage 5

## Notify All Reliability Problem

The proposed implementation is risky:

```python
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

Problems:

- It runs one student at a time, so 50,000 users will be slow.
- If email fails midway, the loop stops or leaves partial work.
- Email API, DB insert, and push notification are tightly coupled.
- Retrying the whole loop may send duplicate emails.
- The request may timeout before finishing.

If email failed for 200 students, those 200 jobs should be retried separately. Successful students should not be processed again.

## Redesigned Flow

The API should create a notification campaign and push jobs into a queue. Workers process the jobs in the background.

Revised pseudocode:

```python
function notify_all(student_ids, message):
    campaign_id = create_campaign(message)

    for student_id in student_ids:
        enqueue("notification_jobs", {
            "campaign_id": campaign_id,
            "student_id": student_id,
            "message": message
        })

    return {
        "message": "Notification campaign queued",
        "campaign_id": campaign_id,
        "total_students": len(student_ids)
    }

function notification_worker(job):
    save_to_db(job.student_id, job.message)
    push_to_app(job.student_id, job.message)
    enqueue("email_jobs", job)

function email_worker(job):
    try:
        send_email(job.student_id, job.message)
        mark_email_sent(job.campaign_id, job.student_id)
    except:
        retry_with_backoff(job)
```

DB save and email should not depend on each other. The in-app notification should be stored first because it is the main product record. Email is a delivery channel and can be retried without losing the notification.

Good additions:

- Use idempotency keys like `campaign_id + student_id`.
- Retry failed jobs with backoff.
- Move permanently failed jobs to a dead-letter queue.
- Track campaign status and failed count.

# Stage 6

## Priority Inbox Approach

Priority is based on notification type and recency.

Weights:

```text
Placement = 3
Result = 2
Event = 1
```

The score can be calculated using type weight first, then timestamp. This means placement notifications are ranked above results and events. Within the same type, newer notifications come first.

For top 10 notifications, the submitted code uses a fixed-size min-heap. This is efficient because the heap only keeps 10 items while scanning all notifications.

Cost:

```text
O(n log 10), which is almost O(n)
```

To handle new incoming notifications, compare the new notification with the smallest item in the heap. If it has higher priority, remove the smallest and insert the new one. This keeps the top 10 updated without sorting the full list again.

Code file:

```text
priority-inbox/priorityInbox.js
```
