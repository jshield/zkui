# Timesheets Endpoints

Manage employee timesheets including submission, approval, and reporting.

## Get Timesheet by Employee

Retrieves a timesheet for a specific employee.

**Endpoint**: `GET /api/Timesheets`

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | No | Employee identifier |
| referenceDate | date-time | No | Reference date for the timesheet week |
| includeEntries | boolean | No | Whether to include timesheet entries |
| createTimesheet | boolean | No | Create timesheet if it doesn't exist |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns a [TimesheetDTO](../schemas.md#timesheetdto) object.

---

## Get Timesheet by ID

Retrieves a specific timesheet by its ID.

**Endpoint**: `GET /api/Timesheets/{timesheetId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timesheetId | integer | Yes | Timesheet identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeEntries | boolean | No | Whether to include timesheet entries |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
{
  "id": 1,
  "startDate": "2024-01-15T00:00:00Z",
  "submitted": false,
  "approved": false,
  "expectedHours": 40.0,
  "employeeId": 1,
  "employeeName": "John Doe",
  "entries": [...],
  "totalHours": 35.5,
  "percentageWorked": 88.75
}
```

---

## Get Timesheets by Employee

Retrieves all timesheets for an employee.

**Endpoint**: `GET /api/Timesheets/employee/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| overdue | boolean | No | Filter for overdue timesheets only (default: false) |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [TimesheetDTO](../schemas.md#timesheetdto) objects.

---

## Get Submitted Timesheets

Retrieves all submitted timesheets.

**Endpoint**: `GET /api/Timesheets/submitted`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [TimesheetDTO](../schemas.md#timesheetdto) objects.

---

## Get Unsubmitted Timesheets

Retrieves all unsubmitted timesheets.

**Endpoint**: `GET /api/Timesheets/unsubmitted`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [TimesheetDTO](../schemas.md#timesheetdto) objects.

---

## Get Overdue Timesheets

Retrieves all overdue timesheets.

**Endpoint**: `GET /api/Timesheets/overdue`

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [TimesheetDTO](../schemas.md#timesheetdto) objects.

---

## Submit Timesheet

Submits or unsubmits a timesheet.

**Endpoint**: `PUT /api/Timesheets/{timesheetId}/submit`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timesheetId | integer | Yes | Timesheet identifier |

### Request Body

**Content-Type**: `application/json`

```json
true
```

Boolean value indicating whether to submit (true) or unsubmit (false) the timesheet.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Approve Timesheet

Approves or rejects a timesheet.

**Endpoint**: `PUT /api/Timesheets/{timesheetId}/approve`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timesheetId | integer | Yes | Timesheet identifier |

### Request Body

**Content-Type**: `application/json`

```json
true
```

Boolean value indicating whether to approve (true) or reject (false) the timesheet.

### Response

**Status**: 200 OK

**Content-Type**: `application/octet-stream`

---

## Generate Timesheet Excel

Generates an Excel file for a timesheet.

**Endpoint**: `GET /api/Timesheets/{timesheetId}/excel`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timesheetId | integer | Yes | Timesheet identifier |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
"base64-encoded-excel-content"
```

Returns a base64-encoded string of the Excel file.

---

## TimesheetDTO Schema

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | integer | No | Timesheet identifier |
| startDate | date-time | No | Week start date |
| submitted | boolean | No | Whether the timesheet is submitted |
| approved | boolean | No | Whether the timesheet is approved |
| expectedHours | number (float) | No | Expected working hours for the week |
| employeeId | integer | No | Employee identifier |
| employeeName | string | No | Employee name |
| entries | array of EntryDTO | No | Time entries in the timesheet |
| totalHours | number (double) | No | Total hours worked |
| percentageWorked | number (double) | No | Percentage of expected hours worked |
