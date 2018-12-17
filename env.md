# Configurable Environment Variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| USER | `undefined` | Username used when running authentication tests (integration and api unit) |
| PASSWORD | `undefined` | Password used when running authentication tests |
| REACT_APP_API_BASE_URL | http://kbapi01:8XYZ/api where X is current api major version, Y is minor version, Z is patch version | API base URL that all query endpoints are appended to.|
| API_BASE_URL | - | Alias to REACT_APP_API_BASE_URL |
| REACT_APP_KEYCLOAK_REALM | 'TestKB'| Keycloak realm ID |
| REACT_APP_KEYCLOAK_CLIENT_ID | 'GraphKB' | Keycloak client ID |
| REACT_APP_KEYCLOAK_URL | http://ga4ghdev01.bcgsc.ca:8080/auth | Keycloak deployment URL |
| REACT_APP_KEYCLOAK_ROLE | GraphKB | Keycloak app role(s) |
