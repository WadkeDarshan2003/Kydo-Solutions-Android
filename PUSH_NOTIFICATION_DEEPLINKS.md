# Push Notification Deep-Linking Guide

## Overview

The push notification system now supports deep-linking, which means clicking on a push notification will take you directly to the relevant page, tab, project, task, or meeting instead of just opening the app generically.

## How It Works

### 1. **Sending Push Notifications with Deep-Links**

When you send a push notification, you can now include deep-link data to specify where the user should be taken:

```typescript
import { sendPushNotification } from './services/pushNotificationService';
import { buildDeepLinkPath } from './utils/deepLinkHandler';

// Example 1: Notify about a project
await sendPushNotification(
  userId,
  'Project Updated',
  'Your project "Website Redesign" has been updated',
  {
    projectId: 'project-123',
    deepLinkPath: '/project/project-123',
    targetTab: 'discovery'
  }
);

// Example 2: Notify about a specific task
const deepLinkPath = buildDeepLinkPath({
  projectId: 'project-123',
  taskId: 'task-456'
});

await sendPushNotification(
  userId,
  'Task Assigned',
  'You have been assigned a new task',
  {
    projectId: 'project-123',
    taskId: 'task-456',
    deepLinkPath
  }
);

// Example 3: Notify about a meeting
await sendPushNotification(
  userId,
  'Meeting Scheduled',
  'New meeting scheduled in your project',
  {
    projectId: 'project-123',
    meetingId: 'meeting-789',
    targetTab: 'meetings',
    deepLinkPath: '/project/project-123/meeting/meeting-789'
  }
);
```

### 2. **Deep-Link Path Format**

The system supports the following URL patterns:

```
/project/{projectId}                    - Opens project detail view
/project/{projectId}?tab=discovery      - Opens project with specific tab
/project/{projectId}?tab=plan           - Available tabs: discovery, plan, financials, team, timeline, documents, meetings
/project/{projectId}/task/{taskId}      - Opens specific task in project
/project/{projectId}/meeting/{meetingId} - Opens specific meeting in project
/projects                               - Opens projects list
/dashboard                              - Opens dashboard
/designers                              - Opens designers list
/clients                                - Opens clients list
/vendors                                - Opens vendors list
/admins                                 - Opens admins list
```

### 3. **Using buildDeepLinkPath Utility**

The `buildDeepLinkPath` function helps construct proper deep-link paths:

```typescript
import { buildDeepLinkPath } from './utils/deepLinkHandler';

// Build a path for a project with a specific tab
const path1 = buildDeepLinkPath({
  projectId: 'proj-123',
  targetTab: 'financials'
});
// Result: /project/proj-123?tab=financials

// Build a path for a specific task
const path2 = buildDeepLinkPath({
  projectId: 'proj-123',
  taskId: 'task-456'
});
// Result: /project/proj-123/task/task-456

// Build a path for a specific meeting
const path3 = buildDeepLinkPath({
  projectId: 'proj-123',
  meetingId: 'meet-789'
});
// Result: /project/proj-123/meeting/meet-789
```

### 4. **Notification Data Structure**

Each notification now supports the following properties:

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  recipientId?: string;           // Specific user
  projectId?: string;             // Related project
  projectName?: string;           // Project name for display
  taskId?: string;                // Related task
  meetingId?: string;             // Related meeting
  targetTab?: string;             // Which tab to open in project
  deepLinkPath?: string;          // Full path like /project/abc123?tab=plan
}
```

## Integration Points

### For Developers Sending Notifications

When creating notifications in your code (e.g., in Firebase Cloud Functions or services), always include deep-link information:

```typescript
// Example in a Cloud Function or notification service
export const notifyProjectUpdate = async (
  userId: string,
  projectId: string,
  projectName: string
) => {
  await sendPushNotification(
    userId,
    'Project Updated',
    `${projectName} has been updated`,
    {
      projectId,
      deepLinkPath: buildDeepLinkPath({ projectId }),
      targetTab: 'discovery'
    }
  );
};

export const notifyNewTask = async (
  userId: string,
  projectId: string,
  taskId: string,
  taskName: string
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    taskId
  });

  await sendPushNotification(
    userId,
    'New Task Assigned',
    `${taskName} assigned to you`,
    {
      projectId,
      taskId,
      deepLinkPath
    }
  );
};
```

### For Cloud Functions

Update your Firebase Cloud Functions to include deep-link data in the notification payload:

```javascript
// functions/src/index.ts example
const payload = {
  notification: {
    title: 'Project Updated',
    body: 'Your project has new updates'
  },
  data: {
    projectId: 'project-123',
    taskId: 'task-456',
    targetTab: 'plan',
    deepLinkPath: '/project/project-123/task/task-456'
  }
};

// Send via FCM
await admin.messaging().sendToDevice(fcmToken, payload);
```

## Frontend Behavior

### Click Behavior

When a user clicks on a notification:

1. **From Notification Panel in App**: The app uses the deep-link handler to navigate directly to the specified view/project/task
2. **From Browser Notification**: If app is closed, it opens the app and navigates to the deep-link path
3. **From Notification in Background**: App receives the deep-link and navigates accordingly

### User Flow Example

1. User receives push notification: "Task assigned: Design Homepage"
2. User clicks notification
3. App opens and:
   - Sets view to 'project-detail'
   - Loads the project
   - Scrolls to the specific task
   - Opens the task modal or highlights it
   - Shows the relevant tab if needed

## Implementation Checklist

When adding new notification types to your app:

- [ ] Include `projectId` in notification if it's project-related
- [ ] Include `taskId` if notifying about a specific task
- [ ] Include `meetingId` if notifying about a meeting
- [ ] Set `targetTab` to the relevant tab in project detail
- [ ] Generate `deepLinkPath` using `buildDeepLinkPath()` utility
- [ ] Pass all deep-link data to `sendPushNotification()`
- [ ] Test that clicking the notification navigates correctly

## Testing Deep-Links

### Test Deep-Link Parsing

```typescript
import { parseDeepLink } from './utils/deepLinkHandler';

// Test cases
const target1 = parseDeepLink('/project/abc123');
// Expected: { view: 'project-detail', projectId: 'abc123' }

const target2 = parseDeepLink('/project/abc123?tab=plan');
// Expected: { view: 'project-detail', projectId: 'abc123', targetTab: 'plan' }

const target3 = parseDeepLink('/project/abc123/task/xyz789');
// Expected: { view: 'project-detail', projectId: 'abc123', taskId: 'xyz789' }
```

### Test Notification Panel

1. Add a test notification in the notification panel
2. Click it and verify it navigates to the correct view
3. Check that the correct tab is opened (if specified)
4. Verify the task/meeting is scrolled into view or opened

## Troubleshooting

### Notification doesn't navigate anywhere

- Check that `deepLinkPath` is properly set
- Verify the path format matches the expected patterns
- Check browser console for deep-link parsing errors

### Wrong view opens

- Verify the `deepLinkPath` is correct
- Check that `projectId` matches an existing project
- Ensure the project is loaded before navigation is triggered

### Task/Meeting not found

- Verify `taskId` or `meetingId` are correctly formatted
- Check that tasks/meetings are loaded for the project
- Confirm the ID actually exists in the data

## Files Modified

- `utils/deepLinkHandler.ts` - New utility for deep-link parsing and navigation
- `types.ts` - Extended Notification interface
- `services/pushNotificationService.ts` - Enhanced with deep-link support
- `contexts/NotificationContext.tsx` - Added deep-link handler callback
- `components/NotificationPanel.tsx` - Integrated deep-link navigation
- `App.tsx` - Configured deep-link handler

## Future Enhancements

Potential improvements:
- Deep-link analytics to track which notifications drive engagement
- Analytics for most-clicked notifications
- URL preview in notification panel
- Custom notification actions (reply, mark as done, etc.)
- Deep-link queuing for notifications received while offline
