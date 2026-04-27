# Push Notification Examples - Code Snippets

## Common Notification Scenarios

### 1. Project Status Changed

```typescript
import { sendPushNotification } from './services/pushNotificationService';
import { buildDeepLinkPath } from './utils/deepLinkHandler';

export const notifyProjectStatusChange = async (
  projectId: string,
  projectName: string,
  newStatus: string,
  userIds: string[]
) => {
  const deepLinkPath = buildDeepLinkPath({ projectId });

  for (const userId of userIds) {
    await sendPushNotification(
      userId,
      'Project Status Changed',
      `${projectName} is now ${newStatus}`,
      {
        projectId,
        deepLinkPath,
        targetTab: 'discovery'
      }
    );
  }
};
```

### 2. Task Assigned to User

```typescript
export const notifyTaskAssigned = async (
  projectId: string,
  taskId: string,
  taskName: string,
  projectName: string,
  assignedUserId: string
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    taskId
  });

  await sendPushNotification(
    assignedUserId,
    'Task Assigned',
    `New task: ${taskName} in ${projectName}`,
    {
      projectId,
      taskId,
      deepLinkPath
    }
  );
};
```

### 3. Task Status Updated

```typescript
export const notifyTaskStatusChange = async (
  projectId: string,
  taskId: string,
  taskName: string,
  oldStatus: string,
  newStatus: string,
  notifyUserIds: string[]
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    taskId
  });

  for (const userId of notifyUserIds) {
    await sendPushNotification(
      userId,
      'Task Updated',
      `${taskName}: ${oldStatus} → ${newStatus}`,
      {
        projectId,
        taskId,
        deepLinkPath
      }
    );
  }
};
```

### 4. Meeting Scheduled

```typescript
export const notifyMeetingScheduled = async (
  projectId: string,
  meetingId: string,
  meetingTitle: string,
  projectName: string,
  attendeeIds: string[],
  meetingDate: Date
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    meetingId
  });

  const dateStr = meetingDate.toLocaleDateString();
  const timeStr = meetingDate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  for (const userId of attendeeIds) {
    await sendPushNotification(
      userId,
      'Meeting Scheduled',
      `${meetingTitle} on ${dateStr} at ${timeStr}`,
      {
        projectId,
        meetingId,
        targetTab: 'meetings',
        deepLinkPath
      }
    );
  }
};
```

### 5. Budget/Financials Updated

```typescript
export const notifyFinancialsUpdated = async (
  projectId: string,
  projectName: string,
  notifyUserIds: string[]
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    targetTab: 'financials'
  });

  for (const userId of notifyUserIds) {
    await sendPushNotification(
      userId,
      'Financials Updated',
      `Budget information updated for ${projectName}`,
      {
        projectId,
        targetTab: 'financials',
        deepLinkPath
      }
    );
  }
};
```

### 6. Team Member Added

```typescript
export const notifyTeamMemberAdded = async (
  projectId: string,
  projectName: string,
  newMemberName: string,
  notifyUserIds: string[]
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    targetTab: 'team'
  });

  for (const userId of notifyUserIds) {
    await sendPushNotification(
      userId,
      'Team Member Added',
      `${newMemberName} joined the ${projectName} team`,
      {
        projectId,
        targetTab: 'team',
        deepLinkPath
      }
    );
  }
};
```

### 7. Document Uploaded

```typescript
export const notifyDocumentUploaded = async (
  projectId: string,
  documentName: string,
  projectName: string,
  uploadedByName: string,
  notifyUserIds: string[]
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    targetTab: 'documents'
  });

  for (const userId of notifyUserIds) {
    await sendPushNotification(
      userId,
      'Document Uploaded',
      `${uploadedByName} uploaded "${documentName}" to ${projectName}`,
      {
        projectId,
        targetTab: 'documents',
        deepLinkPath
      }
    );
  }
};
```

### 8. Project Milestone Reached

```typescript
export const notifyMilestoneReached = async (
  projectId: string,
  projectName: string,
  milestoneName: string,
  notifyUserIds: string[]
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    targetTab: 'timeline'
  });

  for (const userId of notifyUserIds) {
    await sendPushNotification(
      userId,
      '🎉 Milestone Reached',
      `"${milestoneName}" completed in ${projectName}`,
      {
        projectId,
        targetTab: 'timeline',
        deepLinkPath
      }
    );
  }
};
```

### 9. Comment Added to Task

```typescript
export const notifyCommentAdded = async (
  projectId: string,
  taskId: string,
  taskName: string,
  commenterName: string,
  notifyUserIds: string[]
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    taskId
  });

  for (const userId of notifyUserIds) {
    await sendPushNotification(
      userId,
      'New Comment',
      `${commenterName} commented on "${taskName}"`,
      {
        projectId,
        taskId,
        deepLinkPath
      }
    );
  }
};
```

### 10. Approval Requested

```typescript
export const notifyApprovalRequested = async (
  projectId: string,
  taskId: string,
  itemName: string,
  requesterName: string,
  approverUserId: string
) => {
  const deepLinkPath = buildDeepLinkPath({
    projectId,
    taskId
  });

  await sendPushNotification(
    approverUserId,
    'Approval Required',
    `${requesterName} is requesting approval for "${itemName}"`,
    {
      projectId,
      taskId,
      deepLinkPath
    }
  );
};
```

## Integration in Services

### In `projectDetailsService.ts` or similar:

```typescript
import { 
  notifyTaskAssigned, 
  notifyTaskStatusChange,
  notifyProjectStatusChange 
} from './notificationHelpers';

export const updateTaskStatus = async (
  projectId: string,
  taskId: string,
  newStatus: TaskStatus,
  userId: string
) => {
  // Get task and project info
  const task = await getTask(taskId);
  const project = await getProject(projectId);
  
  // Update the task
  await updateDoc(taskRef, { status: newStatus });
  
  // Notify team
  const teamMembers = [
    project.leadDesignerId,
    project.clientId,
    ...project.teamMembers
  ].filter(id => id !== userId); // Don't notify the person who made the change
  
  await notifyTaskStatusChange(
    projectId,
    taskId,
    task.name,
    task.status,
    newStatus,
    teamMembers
  );
};
```

### In Cloud Functions:

```typescript
import * as functions from 'firebase-functions';
import { 
  notifyTaskAssigned,
  notifyProjectStatusChange 
} from './notificationHelpers';

exports.onTaskCreated = functions.firestore
  .document('projects/{projectId}/tasks/{taskId}')
  .onCreate(async (snap, context) => {
    const { projectId } = context.params;
    const task = snap.data();
    const project = await getProject(projectId);
    
    if (task.assignedTo) {
      await notifyTaskAssigned(
        projectId,
        task.id,
        task.name,
        project.name,
        task.assignedTo
      );
    }
  });

exports.onProjectStatusChange = functions.firestore
  .document('projects/{projectId}')
  .onUpdate(async (change, context) => {
    const { projectId } = context.params;
    const oldData = change.before.data();
    const newData = change.after.data();
    
    if (oldData.status !== newData.status) {
      const teamMembers = [
        newData.leadDesignerId,
        newData.clientId,
        ...newData.teamMembers
      ];
      
      await notifyProjectStatusChange(
        projectId,
        newData.name,
        newData.status,
        teamMembers
      );
    }
  });
```

## Helper File Setup

Create `services/notificationHelpers.ts`:

```typescript
// Re-export all notification functions for easy importing
export { 
  notifyProjectStatusChange,
  notifyTaskAssigned,
  notifyTaskStatusChange,
  notifyMeetingScheduled,
  notifyFinancialsUpdated,
  notifyTeamMemberAdded,
  notifyDocumentUploaded,
  notifyMilestoneReached,
  notifyCommentAdded,
  notifyApprovalRequested
} from './notificationFunctions';
```

Then use it anywhere:
```typescript
import { notifyTaskAssigned } from './services/notificationHelpers';
// Use it...
```

## Testing Notifications

```typescript
// Test in console or test file
import { sendPushNotification, buildDeepLinkPath } from './services/pushNotificationService';

// Test 1: Simple project notification
await sendPushNotification(
  'test-user-id',
  'Test Notification',
  'This is a test notification',
  {
    projectId: 'test-project-id',
    deepLinkPath: '/project/test-project-id'
  }
);

// Test 2: Task notification with deep-link
const deepLinkPath = buildDeepLinkPath({
  projectId: 'test-project-id',
  taskId: 'test-task-id'
});

await sendPushNotification(
  'test-user-id',
  'Task Test',
  'Test task notification',
  {
    projectId: 'test-project-id',
    taskId: 'test-task-id',
    deepLinkPath
  }
);
```

## Best Practices

1. **Always include projectId** - Helps with filtering and notifications
2. **Set targetTab** - If the notification is about a specific section (financials, meetings, etc.)
3. **Use buildDeepLinkPath** - Don't hardcode paths, let the utility build them
4. **Include context names** - Use project name, task name in notification body
5. **Filter recipients** - Don't notify the person who triggered the action
6. **Use meaningful titles** - Keep titles short and action-oriented
7. **Include details** - Provide enough context in the message body
8. **Test thoroughly** - Test different notification types and navigation paths

## Error Handling

```typescript
export const safeNotifyTaskAssigned = async (
  projectId: string,
  taskId: string,
  taskName: string,
  projectName: string,
  assignedUserId: string
) => {
  try {
    await notifyTaskAssigned(
      projectId,
      taskId,
      taskName,
      projectName,
      assignedUserId
    );
  } catch (error) {
    console.error('Failed to send task assignment notification:', error);
    // Optionally: Log to error tracking service
    // Or: Retry logic here
  }
};
```
