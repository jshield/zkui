# Entries Endpoints

Manage time entries and favourite settings for quick entry creation.

## Add Entry

Creates a new time entry.

**Endpoint**: `POST /api/Entries`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "description": "Development work",
  "taskIssue": "BUG-123",
  "comment": "Fixed authentication bug",
  "billable": true,
  "breakTime": false,
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T17:00:00Z",
  "adminComment": null,
  "duration": "PT8H",
  "unallocatedTime": false,
  "itemId": 1,
  "itemName": "Backend Development",
  "projectId": 1,
  "projectName": "Project Alpha",
  "clientId": 1,
  "clientName": "Client Corp",
  "locationId": 1,
  "locationName": "Head Office",
  "timesheetId": 1
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Entry

Updates an existing time entry.

**Endpoint**: `PUT /api/Entries`

### Request Body

**Content-Type**: `application/json`

Same schema as [Add Entry](#add-entry), but with an existing `id`.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Delete Entry

Deletes a time entry.

**Endpoint**: `DELETE /api/Entries/{entryId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entryId | integer | Yes | Entry identifier to delete |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Get Favourite Entries

Retrieves favourite entries for an employee.

**Endpoint**: `GET /api/Entries/favourite/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "name": "Daily Standup",
    "description": "Team standup meeting",
    "taskIssue": null,
    "billable": false,
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T09:30:00Z",
    "clientId": 1,
    "clientName": "Internal",
    "projectId": 1,
    "projectName": "Internal Project",
    "itemName": "Meetings",
    "locationName": "Head Office",
    "itemId": 1,
    "locationId": 1,
    "employeeId": 1
  }
]
```

---

## Add Favourite Entry

Creates a new favourite entry template.

**Endpoint**: `POST /api/Entries/favourite`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "name": "Daily Standup",
  "description": "Team standup meeting",
  "taskIssue": null,
  "billable": false,
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T09:30:00Z",
  "clientId": 1,
  "clientName": "Internal",
  "projectId": 1,
  "projectName": "Internal Project",
  "itemName": "Meetings",
  "locationName": "Head Office",
  "itemId": 1,
  "locationId": 1,
  "employeeId": 1
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Favourite Entry

Updates an existing favourite entry.

**Endpoint**: `PUT /api/Entries/favourite`

### Request Body

Same schema as [Add Favourite Entry](#add-favourite-entry), but with an existing `id`.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Delete Favourite Entry

Deletes a favourite entry.

**Endpoint**: `DELETE /api/Entries/favourite/{favouriteId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| favouriteId | integer | Yes | Favourite entry identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## FavouriteSetting Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Favourite identifier |
| name | string | No | Favourite name |
| description | string | Yes | Description |
| taskIssue | string | Yes | Associated task/issue |
| billable | boolean | Yes | Whether the entry is billable |
| startTime | date-time | Yes | Default start time |
| endTime | date-time | Yes | Default end time |
| clientId | integer | Yes | Client identifier |
| clientName | string | Yes | Client name |
| projectId | integer | Yes | Project identifier |
| projectName | string | Yes | Project name |
| itemName | string | Yes | Item name |
| locationName | string | Yes | Location name |
| itemId | integer | No | Item identifier |
| locationId | integer | Yes | Location identifier |
| employeeId | integer | No | Employee identifier |
