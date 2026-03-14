# Projects Endpoints

Manage project configuration and employee assignments.

## Get All Projects

Retrieves all projects.

**Endpoint**: `GET /api/Projects`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "name": "Project Alpha",
    "clientName": "Acme Corp",
    "organisationName": "Tech Division",
    "archived": false
  }
]
```

---

## Get Project Employees

Retrieves employees assigned to a project.

**Endpoint**: `GET /api/Projects/{projectId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectId | integer | Yes | Project identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [EmployeeConfiguration](../schemas.md#employeeconfiguration) objects.

---

## Add Project

Creates a new project.

**Endpoint**: `POST /api/Projects`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "name": "New Project",
  "clientName": "Acme Corp",
  "organisationName": "Tech Division",
  "archived": false
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Project Name

Updates an existing project.

**Endpoint**: `PUT /api/Projects`

### Request Body

Same schema as [Add Project](#add-project), but with an existing `id`.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Update Project Employees

Updates the employee assignments for a project.

**Endpoint**: `PUT /api/Projects/{projectId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectId | integer | Yes | Project identifier |

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

## Remove Project

Deletes a project.

**Endpoint**: `DELETE /api/Projects/{projectId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectId | integer | Yes | Project identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## ProjectConfiguration Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Project identifier |
| name | string | Yes | Project name |
| clientName | string | Yes | Associated client name |
| organisationName | string | Yes | Organization name |
| archived | boolean | No | Whether the project is archived |
