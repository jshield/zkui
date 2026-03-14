# Emails Endpoints

Manage email notifications and reminders.

## Send Email Reminder

Sends email reminders for specified timesheets.

**Endpoint**: `POST /api/Emails`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| isOverdue | boolean | No | Whether this is an overdue reminder |

### Request Body

**Content-Type**: `application/json`

```json
[1, 2, 3]
```

Array of timesheet IDs to send reminders for.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Use Cases

### Weekly Reminder
```bash
curl -X POST "https://zookeepertest.azurewebsites.net/api/Emails?isOverdue=false" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "[1, 2, 3]"
```

### Overdue Reminder
```bash
curl -X POST "https://zookeepertest.azurewebsites.net/api/Emails?isOverdue=true" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "[4, 5, 6]"
```
