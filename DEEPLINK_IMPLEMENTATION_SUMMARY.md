# Push Notification Deep-Linking - Quick Integration Summary

## What Was Changed

Your push notification system now includes **deep-linking** - clicking a notification takes users directly to the relevant page/project/task instead of just opening the app.

## Key Components

### 1. **New Utility: `utils/deepLinkHandler.ts`**
- `parseDeepLink(path)` - Parse URL paths into navigation targets
- `buildDeepLinkPath(target)` - Build URL paths from navigation targets  
- `executeDeepLink(target, navigator)` - Execute navigation in the app
- Supports projects, tasks, meetings, and specific tabs

### 2. **Enhanced Services**

#### `services/pushNotificationService.ts`
- Updated `sendPushNotification()` to accept deep-link options:
  ```typescript
  await sendPushNotification(userId, title, body, {
    projectId: 'abc123',
    taskId: 'task456',
    targetTab: 'plan',
    deepLinkPath: '/project/abc123?tab=plan'
  });
  ```
- Updated `onMessageListener()` to handle deep-link callbacks

#### `types.ts`
- Extended `Notification` interface with:
  - `taskId?: string`
  - `meetingId?: string`
  - `deepLinkPath?: string`
  - Improved `targetTab` type hints

#### `contexts/NotificationContext.tsx`
- Added `setDeepLinkHandler()` - Register navigation callback
- Added `handleNotificationDeepLink()` - Execute deep-link navigation
- Support for passing deep-link data through notifications

#### `components/NotificationPanel.tsx`
- Updated click handler to execute deep-links
- Passes full navigation info (projectId, taskId, targetTab, etc.)
- Fallback to legacy onSelectProject if deep-link handler not available

#### `App.tsx`
- Imported `DeepLinkTarget` and `executeDeepLink` from deep-link utility
- Set up deep-link handler on component load:
  ```typescript
  const handleDeepLink = (target: DeepLinkTarget) => {
    executeDeepLink(target, {
      setCurrentView,
      setSelectedProject,
      setSelectedTask,
      setInitialProjectTab,
      projects,
      tasks: realTimeTasks
    });
  };
  setDeepLinkHandler(handleDeepLink);
  ```
- Pass deep-link handler to `NotificationPanel`
- Extract deep-link data from received notifications

## How It Works

### User Clicks Push Notification

```
Notification Click
    ↓
NotificationPanel onClick handler
    ↓
handleNotificationDeepLink() parses notification data
    ↓
setDeepLinkHandler callback executes
    ↓
executeDeepLink() navigates to target:
  - Sets currentView (dashboard, projects, project-detail, etc.)
  - Sets selectedProject
  - Sets selectedTask if taskId present
  - Sets initialProjectTab if targetTab specified
```

## Usage Examples

### Send Notification for Project Update
```typescript
import { sendPushNotification, buildDeepLinkPath } from './services/pushNotificationService';

await sendPushNotification(
  userId,
  'Project Updated',
  'Website Redesign has new updates',
  {
    projectId: 'proj-123',
    deepLinkPath: buildDeepLinkPath({ projectId: 'proj-123' })
  }
);
```

### Send Notification for Task Assignment
```typescript
const deepLinkPath = buildDeepLinkPath({
  projectId: 'proj-123',
  taskId: 'task-456'
});

await sendPushNotification(
  userId,
  'Task Assigned',
  'You have been assigned a task',
  {
    projectId: 'proj-123',
    taskId: 'task-456',
    deepLinkPath
  }
);
```

### Send Notification for Meeting
```typescript
await sendPushNotification(
  userId,
  'Meeting Scheduled',
  'New project meeting added',
  {
    projectId: 'proj-123',
    meetingId: 'meet-789',
    targetTab: 'meetings',
    deepLinkPath: '/project/proj-123/meeting/meet-789'
  }
);
```

### Send Notification with Specific Tab
```typescript
await sendPushNotification(
  userId,
  'Budget Updated',
  'Project financials have been updated',
  {
    projectId: 'proj-123',
    targetTab: 'financials',
    deepLinkPath: '/project/proj-123?tab=financials'
  }
);
```

## Supported Deep-Link Formats

| Pattern | Result |
|---------|--------|
| `/project/{id}` | Open project |
| `/project/{id}?tab=discovery` | Open project → Discovery tab |
| `/project/{id}?tab=plan` | Open project → Plan tab |
| `/project/{id}?tab=financials` | Open project → Financials tab |
| `/project/{id}?tab=team` | Open project → Team tab |
| `/project/{id}?tab=timeline` | Open project → Timeline tab |
| `/project/{id}?tab=documents` | Open project → Documents tab |
| `/project/{id}?tab=meetings` | Open project → Meetings tab |
| `/project/{id}/task/{taskId}` | Open project and task |
| `/project/{id}/meeting/{meetingId}` | Open project and meeting |
| `/projects` | Open projects list |
| `/dashboard` | Open dashboard |
| `/designers` | Open designers list |
| `/clients` | Open clients list |
| `/vendors` | Open vendors list |
| `/admins` | Open admins list |

## Testing Checklist

- [ ] Click notification in notification panel → Navigates to project
- [ ] Click task notification → Navigates to project AND shows task
- [ ] Click meeting notification → Navigates to project with Meetings tab
- [ ] Click notification with targetTab → Opens correct tab
- [ ] Browser notification click → App opens and navigates correctly
- [ ] Native notification click → App navigates to correct location
- [ ] Test with various notification types (project, task, meeting)

## File Reference

| File | Changes |
|------|---------|
| `utils/deepLinkHandler.ts` | **NEW** - Core deep-linking logic |
| `services/pushNotificationService.ts` | Enhanced with deep-link data support |
| `types.ts` | Extended Notification interface |
| `contexts/NotificationContext.tsx` | Added deep-link handler setup |
| `components/NotificationPanel.tsx` | Integrated deep-link navigation |
| `App.tsx` | Configured and integrated deep-link handler |

## Next Steps

1. **Update Cloud Functions** - Modify notification sending code to include deep-link data
2. **Update Services** - Add deep-link data when creating notifications
3. **Test** - Verify notifications navigate correctly
4. **Monitor** - Track which notifications are being clicked and where users go

See `PUSH_NOTIFICATION_DEEPLINKS.md` for detailed implementation guide.
