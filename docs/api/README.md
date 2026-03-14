# API Documentation

## Overview

This API provides a comprehensive time tracking and timesheet management system. It supports employee timesheet management, leave tracking, project/client organization, and reporting capabilities.

## Base URL

```
https://zookeepertest.azurewebsites.net
```

## Authentication

All API endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

See [Authentication](./authentication.md) for more details.

## API Resources

The API is organized around the following resources:

| Resource | Description |
|----------|-------------|
| [Leaves](./endpoints/leaves.md) | Manage employee leave entries and types |
| [Entries](./endpoints/entries.md) | Time entries and favourite settings |
| [Timesheets](./endpoints/timesheets.md) | Timesheet management, submission, and approval |
| [Employees](./endpoints/employees.md) | Employee management and configuration |
| [Locations](./endpoints/locations.md) | Employee location assignments |
| [Timers](./endpoints/timers.md) | Employee timer functionality |
| [Reports](./endpoints/reports.md) | Reporting and analytics |
| [Clients](./endpoints/clients.md) | Client configuration and management |
| [Projects](./endpoints/projects.md) | Project configuration and management |
| [Items](./endpoints/items.md) | Work item configuration and assignment |
| [Organisations](./endpoints/organisations.md) | Organization management |
| [Configuration](./endpoints/configuration.md) | Global configuration settings |
| [Emails](./endpoints/emails.md) | Email notification services |
| [WorkItem](./endpoints/workitem.md) | Azure DevOps work item integration |

## Content Types

- **Request/Response Format**: JSON (`application/json`)
- **Binary Responses**: Some endpoints return binary/octet-stream for operations without data response
- **Excel Export**: Timesheet Excel exports return base64-encoded bytes

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Request completed successfully |
| 401 | Unauthorized - JWT token missing or invalid |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 500 | Internal Server Error |

## Common Parameters

### Path Parameters

- `employeeId` (integer): Employee identifier
- `entryId` (integer): Time entry identifier
- `timesheetId` (integer): Timesheet identifier
- `clientId` (integer): Client identifier
- `projectId` (integer): Project identifier
- `itemId` (integer): Work item identifier
- `locationId` (integer): Location identifier
- `orgId` (integer): Organization identifier

### Date Formats

All date-time fields use ISO 8601 format:
```
2024-01-15T09:00:00Z
```

### Durations

Duration fields use ISO 8601 duration format:
```
PT8H30M  (8 hours, 30 minutes)
```

## Rate Limiting

Please contact the API administrator for rate limiting policies.

## Swagger/OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- File: `specs/swagger.json`

## Getting Started

1. Obtain a JWT token through your authentication provider
2. Include the token in the Authorization header for all requests
3. Start with the [Employees](./endpoints/employees.md) endpoints to retrieve employee information
4. Use [Timesheets](./endpoints/timesheets.md) endpoints to manage timesheets
5. Use [Entries](./endpoints/entries.md) endpoints to add time entries
