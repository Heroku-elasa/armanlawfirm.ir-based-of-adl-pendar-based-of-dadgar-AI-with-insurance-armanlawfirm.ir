# Library Utilities

Utility functions and shared libraries.

## Files

| File | Description |
|------|-------------|
| `queryClient.ts` | React Query client configuration |
| `authUtils.ts` | Authentication helper functions |

## Query Client

Configures React Query for data fetching.

```typescript
import { queryClient } from './lib/queryClient';
```

### Default Options
- `refetchOnWindowFocus`: false
- `retry`: false

## Auth Utilities

Helper functions for authentication.

### Functions
- `login()` - Initiate login flow
- `logout()` - Log out current user
