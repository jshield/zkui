# WorkItem Endpoints

Integrate with Azure DevOps work items.

## Get Work Item Title

Retrieves the title of a work item from Azure DevOps.

**Endpoint**: `GET /api/WorkItem/{id}`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Work item ID |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organization | string | No | Azure DevOps organization name |
| accessToken | string | No | Azure DevOps Personal Access Token |

### Response

**Status**: 200 OK

**Content-Type**: `application/json`

```json
"Fix authentication bug in login flow"
```

Returns the work item title as a string.

---

## Example

```bash
curl -X GET "https://zookeepertest.azurewebsites.net/api/WorkItem/12345?organization=myorg&accessToken=pat_token" \
  -H "Authorization: Bearer <token>"
```

## Notes

- The organization and access token can be provided via query parameters or retrieved from the employee's profile if configured
- This endpoint is typically used to validate work item IDs and fetch their titles when creating time entries
