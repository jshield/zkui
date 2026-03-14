# Employees Endpoints

Manage employee information, configuration, and settings.

## Get All Employees

Retrieves a list of all employees.

**Endpoint**: `GET /api/Employees`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "microsoftObjectId": "12345678-1234-1234-1234-123456789012",
    "emailAddress": "john.doe@example.com",
    "active": true,
    "devOpsPersonalAccessToken": null,
    "azureDevOpsOrganization": null,
    "colorCode": "#FF5733",
    "role": 1,
    "status": 1,
    "initialStartDate": "2020-01-01T00:00:00Z",
    "assignedHoursPerWeek": 40.0,
    "timerStartTime": null
  }
]
```

---

## Get Employee by ID

Retrieves a specific employee by ID.

**Endpoint**: `GET /api/Employees/{id}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Employee identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an [EmployeeDTO](../schemas.md#employeedto) object.

---

## Get Employee by GUID

Retrieves an employee by their Microsoft GUID.

**Endpoint**: `GET /api/Employees/guid/{guid}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| guid | string (guid) | Yes | Microsoft Object ID |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an [EmployeeDTO](../schemas.md#employeedto) object.

---

## Add Employee

Creates a new employee.

**Endpoint**: `POST /api/Employees`

### Request Body

**Content-Type**: `application/json`

```json
{
  "id": 0,
  "name": "Jane Smith",
  "microsoftObjectId": "87654321-4321-4321-4321-210987654321",
  "emailAddress": "jane.smith@example.com",
  "active": true,
  "devOpsPersonalAccessToken": null,
  "azureDevOpsOrganization": null,
  "colorCode": "#33FF57",
  "role": 1,
  "status": 1,
  "initialStartDate": "2024-01-15T00:00:00Z",
  "assignedHoursPerWeek": 40.0,
  "timerStartTime": null
}
```

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns the created employee ID (integer).

---

## Update Employee

Updates an existing employee.

**Endpoint**: `PUT /api/Employees`

### Request Body

**Content-Type**: `application/json`

Same schema as [Add Employee](#add-employee), but with an existing `id`.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## EmployeeDTO Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Employee identifier |
| name | string | No | Employee full name |
| microsoftObjectId | string (guid) | No | Microsoft Azure AD Object ID |
| emailAddress | string | No | Email address |
| active | boolean | No | Whether the employee is active |
| devOpsPersonalAccessToken | string | Yes | Azure DevOps PAT |
| azureDevOpsOrganization | string | Yes | Azure DevOps organization name |
| colorCode | string | Yes | Color code for UI display |
| role | EmployeeRoleTypeId | No | Employee role (1=Employee, 2=Admin) |
| status | EmployeeStatusTypeId | No | Employment status |
| initialStartDate | date-time | No | Employee start date |
| assignedHoursPerWeek | number (float) | Yes | Expected hours per week |
| timerStartTime | date-time | Yes | Timer start time (if running) |

### EmployeeRoleTypeId Enum

| Value | Name | Description |
|-------|------|-------------|
| 1 | Employee | Standard employee role |
| 2 | Admin | Administrator role with elevated permissions |

### EmployeeStatusTypeId Enum

| Value | Name | Description |
|-------|------|-------------|
| 1 | FullTime | Full-time employee |
| 2 | PartTime | Part-time employee |
| 3 | Casual | Casual employee |
| 4 | Intern | Intern |
| 5 | Other | Other employment type |
