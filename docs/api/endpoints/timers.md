# Timers Endpoints

Manage employee timer functionality for tracking work sessions.

## Get Timer

Retrieves the current timer state for an employee.

**Endpoint**: `GET /api/Timers/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
"2024-01-15T09:00:00Z"
```

Returns the timer start time as an ISO 8601 date-time string, or `null` if no timer is running.

---

## Update Timer

Starts or stops the timer for an employee.

**Endpoint**: `PUT /api/Timers/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startTime | date-time | No | Timer start time. Pass `null` to stop the timer. |

### Examples

**Start Timer:**
```bash
curl -X PUT "https://zookeepertest.azurewebsites.net/api/Timers/1?startTime=2024-01-15T09:00:00Z" \
  -H "Authorization: Bearer <token>"
```

**Stop Timer:**
```bash
curl -X PUT "https://zookeepertest.azurewebsites.net/api/Timers/1" \
  -H "Authorization: Bearer <token>"
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`
