# Leaves Endpoints

Manage employee leave types and leave entries.

## Get Leave Types

Returns a list of available leave types.

**Endpoint**: `GET /api/Leaves`

### Request

```bash
curl -X GET "https://zookeepertest.azurewebsites.net/api/Leaves" \
  -H "Authorization: Bearer <token>"
```

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "type": "Annual Leave",
    "description": "Paid annual leave",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-05T00:00:00Z"
  }
]
```

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Leave type identifier |
| type | string | Leave type name |
| description | string | Description of the leave type |
| startDate | date-time | Start date of leave period |
| endDate | date-time | End date of leave period |

---

## Add Leave Entry

Creates a new leave entry for an employee.

**Endpoint**: `POST /api/Leaves/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "type": "Annual Leave",
  "description": "Vacation",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-05T00:00:00Z"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | No | Leave entry ID (0 for new entries) |
| type | string | No | Leave type |
| description | string | No | Leave description |
| startDate | date-time | No | Start date |
| endDate | date-time | No | End date |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

Returns binary response indicating success.

---

## Get Future Leave Entries

Retrieves all future leave entries marked as leave for an employee.

**Endpoint**: `GET /api/Leaves/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [EntryDTO](../schemas.md#entrydto) objects.

---

## Remove Leave Entry

Deletes a leave entry.

**Endpoint**: `DELETE /api/Leaves/{entryId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entryId | integer | Yes | Entry identifier to remove |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

Returns binary response indicating success.

---

## LeaveDTO Schema

```json
{
  "id": 1,
  "type": "Annual Leave",
  "description": "Paid vacation",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-05T00:00:00Z"
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Leave identifier |
| type | string | Yes | Leave type name |
| description | string | Yes | Leave description |
| startDate | date-time | Yes | Start date and time |
| endDate | date-time | Yes | End date and time |
