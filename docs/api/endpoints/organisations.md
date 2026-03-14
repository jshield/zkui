# Organisations Endpoints

Manage organization configuration and client assignments.

## Get All Organisations

Retrieves all organizations.

**Endpoint**: `GET /api/Organisations`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "name": "Tech Division",
    "archived": false
  }
]
```

---

## Add Organisation

Creates a new organization.

**Endpoint**: `POST /api/Organisations`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "name": "New Division",
  "archived": false
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Organisation Name

Updates an existing organization.

**Endpoint**: `PUT /api/Organisations`

### Request Body

Same schema as [Add Organisation](#add-organisation), but with an existing `id`.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Organisation Clients

Updates the client assignments for an organization.

**Endpoint**: `PUT /api/Organisations/{orgId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orgId | integer | Yes | Organization identifier |

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

## Delete Organisation

Deletes an organization.

**Endpoint**: `DELETE /api/Organisations/{orgId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orgId | integer | Yes | Organization identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## OrganisationConfiguration Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Organization identifier |
| name | string | Yes | Organization name |
| archived | boolean | No | Whether the organization is archived |
