# Configurable Environment Variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| USER | | Username used when running authentication tests (integration and api unit) |
| PASSWORD | | Password used when running authentication tests |
| DISABLE_AUTH | | Disable keycloak authentication for testing |
| API_BASE_URL | http://kbapi01:8080/api | API base URL that all query endpoints are appended to.|
| KEYCLOAK_REALM | 'GSC'| Keycloak realm ID |
| KEYCLOAK_CLIENT_ID | 'GraphKB' | Keycloak client ID |
| KEYCLOAK_URL | https://sso.bcgsc.ca/auth | Keycloak deployment URL |
| KEYCLOAK_ROLE | GraphKB | Keycloak app role(s) |
