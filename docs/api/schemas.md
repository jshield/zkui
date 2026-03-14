# API Schemas

This document describes all data transfer objects (DTOs) and schemas used in the API.

## EntryDTO

Represents a time entry in the timesheet system.

```json
{
  "id": 1,
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

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Entry identifier |
| description | string | No | Entry description |
| taskIssue | string | Yes | Associated task/issue ID |
| comment | string | Yes | User comment |
| billable | boolean | No | Whether the time is billable |
| breakTime | boolean | No | Whether this is a break entry |
| startTime | date-time | No | Start date and time |
| endTime | date-time | No | End date and time |
| adminComment | string | Yes | Administrator comment |
| duration | duration | No | Entry duration (ISO 8601) |
| unallocatedTime | boolean | No | Whether this is unallocated time |
| itemId | integer | Yes | Work item identifier |
| itemName | string | Yes | Work item name |
| projectId | integer | Yes | Project identifier |
| projectName | string | Yes | Project name |
| clientId | integer | Yes | Client identifier |
| clientName | string | Yes | Client name |
| locationId | integer | Yes | Location identifier |
| locationName | string | Yes | Location name |
| timesheetId | integer | No | Parent timesheet identifier |

---

## TimesheetDTO

Represents an employee timesheet.

```json
{
  "id": 1,
  "startDate": "2024-01-15T00:00:00Z",
  "submitted": false,
  "approved": false,
  "expectedHours": 40.0,
  "employeeId": 1,
  "employeeName": "John Doe",
  "entries": [],
  "totalHours": 35.5,
  "percentageWorked": 88.75
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Timesheet identifier |
| startDate | date-time | No | Week start date |
| submitted | boolean | No | Whether submitted |
| approved | boolean | No | Whether approved |
| expectedHours | number (float) | No | Expected hours for the week |
| employeeId | integer | No | Employee identifier |
| employeeName | string | No | Employee name |
| entries | array of EntryDTO | No | Time entries |
| totalHours | number (double) | No | Total hours worked |
| percentageWorked | number (double) | No | Percentage of expected hours |

---

## EmployeeDTO

Represents an employee.

```json
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
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Employee identifier |
| name | string | No | Employee name |
| microsoftObjectId | string (guid) | No | Azure AD Object ID |
| emailAddress | string | No | Email address |
| active | boolean | No | Whether active |
| devOpsPersonalAccessToken | string | Yes | Azure DevOps PAT |
| azureDevOpsOrganization | string | Yes | Azure DevOps org |
| colorCode | string | Yes | UI color code |
| role | EmployeeRoleTypeId | No | Employee role |
| status | EmployeeStatusTypeId | No | Employment status |
| initialStartDate | date-time | No | Start date |
| assignedHoursPerWeek | number (float) | Yes | Hours per week |
| timerStartTime | date-time | Yes | Timer start time |

---

## FavouriteSetting

Represents a favourite entry template.

```json
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
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Favourite identifier |
| name | string | No | Favourite name |
| description | string | Yes | Description |
| taskIssue | string | Yes | Task/issue |
| billable | boolean | Yes | Billable flag |
| startTime | date-time | Yes | Default start time |
| endTime | date-time | Yes | Default end time |
| clientId | integer | Yes | Client ID |
| clientName | string | Yes | Client name |
| projectId | integer | Yes | Project ID |
| projectName | string | Yes | Project name |
| itemName | string | Yes | Item name |
| locationName | string | Yes | Location name |
| itemId | integer | No | Item ID |
| locationId | integer | Yes | Location ID |
| employeeId | integer | No | Employee ID |

---

## LeaveDTO

Represents a leave entry.

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
| type | string | Yes | Leave type |
| description | string | Yes | Description |
| startDate | date-time | Yes | Start date |
| endDate | date-time | Yes | End date |

---

## LocationSetting

Represents a location.

```json
{
  "id": 1,
  "name": "Head Office"
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Location identifier |
| name | string | No | Location name |

---

## ClientConfiguration

Represents a client configuration.

```json
{
  "id": 1,
  "name": "Acme Corp",
  "officialName": "Acme Corporation Pty Ltd",
  "colour": "#FF5733",
  "organisationName": "Tech Division",
  "archived": false
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Client identifier |
| name | string | Yes | Display name |
| officialName | string | Yes | Legal name |
| colour | string | Yes | Color code |
| organisationName | string | Yes | Organization name |
| archived | boolean | No | Archived flag |

---

## ProjectConfiguration

Represents a project configuration.

```json
{
  "id": 1,
  "name": "Project Alpha",
  "clientName": "Acme Corp",
  "organisationName": "Tech Division",
  "archived": false
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Project identifier |
| name | string | Yes | Project name |
| clientName | string | Yes | Client name |
| organisationName | string | Yes | Organization name |
| archived | boolean | No | Archived flag |

---

## ItemConfiguration

Represents a work item configuration.

```json
{
  "id": 1,
  "name": "Development",
  "projectName": "Project Alpha",
  "clientName": "Acme Corp",
  "organisationName": "Tech Division",
  "archived": false
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Item identifier |
| name | string | Yes | Item name |
| projectName | string | Yes | Project name |
| clientName | string | Yes | Client name |
| organisationName | string | Yes | Organization name |
| archived | boolean | No | Archived flag |

---

## ItemDTO

Represents a work item (simplified).

```json
{
  "id": 1,
  "name": "Development",
  "projectId": 1,
  "projectName": "Project Alpha",
  "clientId": 1,
  "clientName": "Acme Corp"
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Item identifier |
| name | string | No | Item name |
| projectId | integer | No | Project identifier |
| projectName | string | No | Project name |
| clientId | integer | No | Client identifier |
| clientName | string | No | Client name |

---

## OrganisationConfiguration

Represents an organization configuration.

```json
{
  "id": 1,
  "name": "Tech Division",
  "archived": false
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Organization identifier |
| name | string | Yes | Organization name |
| archived | boolean | No | Archived flag |

---

## EmployeeConfiguration

Represents employee configuration (minimal).

```json
{
  "id": 1,
  "name": "John Doe",
  "allocationCount": 3
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Employee identifier |
| name | string | No | Employee name |
| allocationCount | integer | No | Number of allocations |

---

## UpdatedClients

Represents a bulk update operation for client/project/item assignments.

```json
{
  "toAdd": [1, 2, 3],
  "toRemove": [4, 5]
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| toAdd | array of integer | No | IDs to add |
| toRemove | array of integer | No | IDs to remove |

---

## Enums

### EmployeeRoleTypeId

| Value | Name | Description |
|-------|------|-------------|
| 1 | Employee | Standard employee |
| 2 | Admin | Administrator |

### EmployeeStatusTypeId

| Value | Name | Description |
|-------|------|-------------|
| 1 | FullTime | Full-time employee |
| 2 | PartTime | Part-time employee |
| 3 | Casual | Casual employee |
| 4 | Intern | Intern |
| 5 | Other | Other employment type |
