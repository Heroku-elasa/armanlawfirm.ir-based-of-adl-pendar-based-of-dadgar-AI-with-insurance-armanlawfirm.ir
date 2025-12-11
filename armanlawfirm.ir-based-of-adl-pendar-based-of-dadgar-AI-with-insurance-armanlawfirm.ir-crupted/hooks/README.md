# React Hooks

Custom React hooks for the application.

## Files

| File | Description |
|------|-------------|
| `useAuth.ts` | Authentication state hook |

## useAuth

Hook for accessing authentication state.

### Usage

```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Welcome, {user.email}</div>;
}
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `user` | User or null | Current user object |
| `isLoading` | boolean | Loading state |
| `isAuthenticated` | boolean | Whether user is logged in |
| `error` | Error or null | Any auth error |

### Notes

- Uses React Query for data fetching
- Caches user data for 5 minutes
- Requires backend server to be running
