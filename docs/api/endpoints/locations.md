# Locations Endpoints

Manage employee location assignments.

## Get Locations by Employee

Retrieves all locations assigned to an employee.

**Endpoint**: `GET /api/Locations`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | No | Employee identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "name": "Head Office"
  },
  {
    "id": 2,
    "name": "Remote"
  }
]
```

---

## Add Employee Location

Assigns a location to an employee.

**Endpoint**: `POST /api/Locations/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 1,
  "name": "Head Office"
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Remove Employee Location

Removes a location assignment from an employee.

**Endpoint**: `DELETE /api/Locations/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| locationId | integer | No | Location identifier to remove |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## LocationSetting Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Location identifier |
| name | string | No | Location name |
