# Configuration Endpoints

Manage global configuration settings for the application.

## Get Auto Reminder State

Retrieves the current state of automatic reminders.

**Endpoint**: `GET /globalconfig/reminderstate`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
true
```

Returns a boolean indicating whether automatic reminders are enabled.

---

## Update Auto Reminder State

Enables or disables automatic reminders.

**Endpoint**: `PUT /api/GlobalConfiguration`

### Request Body

**Content-Type**: `application/json`

```json
true
```

Boolean value to enable (true) or disable (false) automatic reminders.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Toggle Auto Reminder (Alternative)

Alternative endpoint for toggling auto reminder state.

**Endpoint**: `GET /api/GlobalConfiguration`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| state | boolean | No | Desired state (true/false) |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`
