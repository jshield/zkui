# Clients Endpoints

Manage client configuration and employee assignments.

## Get All Clients

Retrieves all clients.

**Endpoint**: `GET /api/Clients`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "name": "Acme Corp",
    "officialName": "Acme Corporation Pty Ltd",
    "colour": "#FF5733",
    "organisationName": "Tech Division",
    "archived": false
  }
]
```

---

## Get Client Employees

Retrieves employees assigned to a client.

**Endpoint**: `GET /api/Clients/{clientId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | integer | Yes | Client identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [EmployeeConfiguration](../schemas.md#employeeconfiguration) objects.

---

## Add Client

Creates a new client.

**Endpoint**: `POST /api/Clients`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "name": "New Client",
  "officialName": "New Client Inc.",
  "colour": "#33FF57",
  "organisationName": "Division A",
  "archived": false
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Client

Updates an existing client.

**Endpoint**: `PUT /api/Clients`

### Request Body

Same schema as [Add Client](#add-client), but with an existing `id`.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Client Employees

Updates the employee assignments for a client.

**Endpoint**: `PUT /api/Clients/{clientId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | integer | Yes | Client identifier |

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

## Duplicate Client

Creates a copy of an existing client.

**Endpoint**: `POST /api/Clients/duplicate`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 1,
  "name": "Acme Corp Copy",
  "officialName": "Acme Corporation Copy Pty Ltd",
  "colour": "#FF5733",
  "organisationName": "Tech Division",
  "archived": false
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Remove Client

Deletes a client.

**Endpoint**: `DELETE /api/Clients/{clientId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | integer | Yes | Client identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## ClientConfiguration Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Client identifier |
| name | string | Yes | Client display name |
| officialName | string | Yes | Official/legal name |
| colour | string | Yes | Color code for UI |
| organisationName | string | Yes | Organization name |
| archived | boolean | No | Whether the client is archived |

---

## EmployeeConfiguration Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Employee identifier |
| name | string | No | Employee name |
| allocationCount | integer | No | Number of allocations |

---

## UpdatedClients Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| toAdd | array of integer | No | Employee IDs to add |
| toRemove | array of integer | No | Employee IDs to remove |
