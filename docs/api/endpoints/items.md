# Items Endpoints

Manage work item configuration and employee assignments.

## Get All Items

Retrieves all items.

**Endpoint**: `GET /api/Items`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "name": "Development",
    "projectName": "Project Alpha",
    "clientName": "Acme Corp",
    "organisationName": "Tech Division",
    "archived": false
  }
]
```

---

## Get Item Employees

Retrieves employees assigned to an item.

**Endpoint**: `GET /api/Items/{id}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Item identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [EmployeeConfiguration](../schemas.md#employeeconfiguration) objects.

---

## Get Items by Employee

Retrieves items available to an employee.

**Endpoint**: `GET /employee/{employeeId}`

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
    "name": "Development",
    "projectId": 1,
    "projectName": "Project Alpha",
    "clientId": 1,
    "clientName": "Acme Corp"
  }
]
```

---

## Add Item

Creates a new item.

**Endpoint**: `POST /api/Items`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "name": "New Item",
  "projectName": "Project Alpha",
  "clientName": "Acme Corp",
  "organisationName": "Tech Division",
  "archived": false
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns the created item ID (integer).

---

## Update Item Name

Updates an existing item.

**Endpoint**: `PUT /api/Items`

### Request Body

Same schema as [Add Item](#add-item), but with an existing `id`.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Item Employees

Updates the employee assignments for an item.

**Endpoint**: `PUT /api/Items/{itemId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | integer | Yes | Item identifier |

### Request Body

**Content-Type**: `application/json`

```json
{
  "toAdd": [1, 2],
  "toRemove": [3]
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Delete Item

Deletes an item.

**Endpoint**: `DELETE /api/Items/{itemId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | integer | Yes | Item identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## ItemConfiguration Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Item identifier |
| name | string | Yes | Item name |
| projectName | string | Yes | Associated project name |
| clientName | string | Yes | Associated client name |
| organisationName | string | Yes | Organization name |
| archived | boolean | No | Whether the item is archived |

---

## ItemDTO Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Item identifier |
| name | string | No | Item name |
| projectId | integer | No | Project identifier |
| projectName | string | No | Project name |
| clientId | integer | No | Client identifier |
| clientName | string | No | Client name |
