# Reports Endpoints

Generate reports and analytics on time entries and employee activity.

## Get Total Minutes for Location

Calculates total minutes worked by an employee at a specific location.

**Endpoint**: `GET /api/Reports/total-minutes/{employeeId}/{locationId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |
| locationId | integer | Yes | Location identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | date-time | No | Report period start date |
| endDate | date-time | No | Report period end date |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
28800
```

Returns the total number of minutes worked (integer).

---

## Query Employee Entries

Searches and retrieves employee entries with optional filtering.

**Endpoint**: `GET /api/Reports/entries/{employeeId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | date-time | No | Filter by start date |
| endDate | date-time | No | Filter by end date |
| queryString | string | No | Search query string |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [EntryDTO](../schemas.md#entrydto) objects.

---

## Get Employee Entries for Location

Retrieves all entries for an employee at a specific location within a date range.

**Endpoint**: `GET /api/Reports/entries/{employeeId}/{locationId}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | integer | Yes | Employee identifier |
| locationId | integer | Yes | Location identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | date-time | No | Filter by start date |
| endDate | date-time | No | Filter by end date |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

Returns an array of [EntryDTO](../schemas.md#entrydto) objects.
