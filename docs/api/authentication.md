# Authentication

## JWT Authentication

The API uses JSON Web Tokens (JWT) for authentication. All endpoints require a valid JWT token to be included in the request headers.

## Authorization Header

Include the JWT token in the `Authorization` header using the Bearer scheme:

```http
Authorization: Bearer <your-jwt-token>
```

## Obtaining a JWT Token

JWT tokens are obtained through your organization's identity provider (likely Azure AD or similar). The authentication flow is handled externally to this API.

## Token Requirements

- **Format**: JWT (JSON Web Token)
- **Algorithm**: RS256 (asymmetric signing)
- **Header Name**: `Authorization`
- **Header Value**: `Bearer <token>`

## Example Request

```bash
curl -X GET "https://zookeepertest.azurewebsites.net/api/Employees" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

## Security Schemes (OpenAPI)

```yaml
securitySchemes:
  JWT:
    type: apiKey
    description: Type into the textbox: Bearer {your JWT token}.
    name: Authorization
    in: header
```

## Global Security

All endpoints in the API require JWT authentication by default:

```yaml
security:
  - JWT: []
```

## Error Responses

### 401 Unauthorized

Returned when the JWT token is missing, expired, or invalid.

```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

Returned when the JWT token is valid but the user does not have permission to access the requested resource.

```json
{
  "status": 403,
  "message": "Forbidden"
}
```

## Best Practices

1. **Secure Storage**: Store JWT tokens securely and never expose them in client-side code
2. **Token Refresh**: Implement token refresh logic before tokens expire
3. **HTTPS Only**: Always use HTTPS when transmitting JWT tokens
4. **Token Validation**: Validate the token signature and expiration before using

## Role-Based Access

The API uses role-based access control. Users can have the following roles:

| Role | Description |
|------|-------------|
| Employee | Standard user - can manage own timesheets and entries |
| Admin | Administrator - can manage all resources and configurations |

Role information is typically encoded in the JWT token claims.
