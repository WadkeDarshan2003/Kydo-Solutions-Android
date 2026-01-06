# ⚡ Deep-Linking Quick Reference Card

## 🎯 One-Line Summary
**When users click a push notification, they go directly to the relevant page/project/task/meeting instead of just opening the app.**

---

## 🚀 Quick Start (30 seconds)

```typescript
import { sendPushNotification, buildDeepLinkPath } from './services/pushNotificationService';

// Step 1: Build the deep-link path
const path = buildDeepLinkPath({ projectId: 'abc123' });

// Step 2: Send the notification
await sendPushNotification(
  userId,
  'Title',
  'Message',
  {
    projectId: 'abc123',
    deepLinkPath: path
  }
);

// That's it! 🎉
```

---

## 📝 Common Patterns

### Pattern 1: Project Only
```typescript
buildDeepLinkPath({ projectId: 'abc' })
// → /project/abc
```

### Pattern 2: Project + Task
```typescript
buildDeepLinkPath({ projectId: 'abc', taskId: 'xyz' })
// → /project/abc/task/xyz
```

### Pattern 3: Project + Tab
```typescript
buildDeepLinkPath({ projectId: 'abc', targetTab: 'plan' })
// → /project/abc?tab=plan
```

### Pattern 4: Project + Meeting
```typescript
buildDeepLinkPath({ projectId: 'abc', meetingId: 'meet123' })
// → /project/abc/meeting/meet123
```

---

## 🎨 Available Tabs

```
discovery    → Project overview
plan         → Planning & tasks
financials   → Budget & costs
team         → Team members
timeline     → Schedule & dates
documents    → Files & uploads
meetings     → Project meetings
```

---

## 📤 Sending Notifications

### Minimal
```typescript
await sendPushNotification(userId, 'Title', 'Body', {
  projectId: 'proj-123',
  deepLinkPath: '/project/proj-123'
});
```

### With Task
```typescript
await sendPushNotification(userId, 'Title', 'Body', {
  projectId: 'proj-123',
  taskId: 'task-456',
  deepLinkPath: '/project/proj-123/task/task-456'
});
```

### With Tab
```typescript
await sendPushNotification(userId, 'Title', 'Body', {
  projectId: 'proj-123',
  targetTab: 'financials',
  deepLinkPath: '/project/proj-123?tab=financials'
});
```

### Complete
```typescript
await sendPushNotification(userId, 'Title', 'Body', {
  projectId: 'proj-123',
  taskId: 'task-456',
  targetTab: 'plan',
  deepLinkPath: '/project/proj-123/task/task-456'
});
```

---

## 🔄 Complete Notification Helper

```typescript
// Copy & paste this helper
import { sendPushNotification, buildDeepLinkPath } from './services/pushNotificationService';

export const notifyTaskAssigned = async (
  userId: string,
  projectId: string,
  taskId: string,
  taskName: string
) => {
  const deepLinkPath = buildDeepLinkPath({ projectId, taskId });
  
  await sendPushNotification(
    userId,
    'Task Assigned',
    `${taskName} assigned to you`,
    { projectId, taskId, deepLinkPath }
  );
};

// Usage:
await notifyTaskAssigned(userId, 'proj-123', 'task-456', 'Design Homepage');
```

---

## ✅ Checklist for Each Notification

- [ ] Have projectId? → Include it
- [ ] Have taskId? → Include it
- [ ] Have meetingId? → Include it
- [ ] Want specific tab? → Set targetTab
- [ ] Built the path? → Use buildDeepLinkPath()
- [ ] Passing to sendPushNotification()? → Include deepLinkPath

---

## 🐛 Debugging

### Notification doesn't navigate?
```typescript
// ✅ Check: deepLinkPath is included
await sendPushNotification(userId, title, body, {
  projectId: 'xyz',
  deepLinkPath: '/project/xyz'  // ← Must have this!
});
```

### Wrong view opens?
```typescript
// ✅ Check: Path format is correct
/project/{id}                    ✅ valid
/project/{id}?tab=plan          ✅ valid
/project/{id}/task/{taskId}     ✅ valid
project/123                      ❌ missing leading /
```

### Task not found?
```typescript
// ✅ Check: taskId exists and matches
const deepLinkPath = buildDeepLinkPath({
  projectId: 'proj-123',
  taskId: 'task-456'  // ← Verify this task exists!
});
```

---

## 📊 Path Reference Table

| Need | Path | Code |
|------|------|------|
| Open project | `/project/abc` | `buildDeepLinkPath({ projectId: 'abc' })` |
| Open task | `/project/abc/task/xyz` | `buildDeepLinkPath({ projectId: 'abc', taskId: 'xyz' })` |
| Open meeting | `/project/abc/meeting/m1` | `buildDeepLinkPath({ projectId: 'abc', meetingId: 'm1' })` |
| Open plan tab | `/project/abc?tab=plan` | `buildDeepLinkPath({ projectId: 'abc', targetTab: 'plan' })` |
| Open team tab | `/project/abc?tab=team` | `buildDeepLinkPath({ projectId: 'abc', targetTab: 'team' })` |
| Open budget | `/project/abc?tab=financials` | `buildDeepLinkPath({ projectId: 'abc', targetTab: 'financials' })` |

---

## 💾 Copy-Paste Templates

### Template 1: Simple Project
```typescript
const path = buildDeepLinkPath({ projectId: 'PROJECT_ID' });
await sendPushNotification(
  USER_ID,
  'Notification Title',
  'Notification message',
  { projectId: 'PROJECT_ID', deepLinkPath: path }
);
```

### Template 2: Task Update
```typescript
const path = buildDeepLinkPath({ 
  projectId: 'PROJECT_ID', 
  taskId: 'TASK_ID' 
});
await sendPushNotification(
  USER_ID,
  'Task Updated',
  'Task details...',
  { 
    projectId: 'PROJECT_ID',
    taskId: 'TASK_ID',
    deepLinkPath: path 
  }
);
```

### Template 3: Tab Navigation
```typescript
const path = buildDeepLinkPath({ 
  projectId: 'PROJECT_ID',
  targetTab: 'TAB_NAME'  // discovery, plan, financials, team, timeline, documents, meetings
});
await sendPushNotification(
  USER_ID,
  'Notification',
  'Details...',
  { 
    projectId: 'PROJECT_ID',
    targetTab: 'TAB_NAME',
    deepLinkPath: path 
  }
);
```

---

## 🎯 When to Use Each Tab

| Tab | Use When | Example |
|-----|----------|---------|
| discovery | Project overview | Status changed |
| plan | Task/planning updates | Task assigned |
| financials | Budget changes | Budget updated |
| team | Team changes | Member added |
| timeline | Schedule changes | Deadline approaching |
| documents | New files | Document uploaded |
| meetings | Meeting updates | Meeting scheduled |

---

## ⚡ Performance Notes

- ✅ Fast: Navigation happens instantly
- ✅ Efficient: No extra API calls needed
- ✅ Offline: Works even if offline briefly
- ✅ Smooth: Animated transitions included

---

## 🔒 Security Notes

- ✅ Safe: Only shows notifications to assigned users
- ✅ Filtered: Notifications filtered by project membership
- ✅ Secure: No sensitive data in deep-links
- ✅ Validated: Paths validated before navigation

---

## 📱 Platform Support

✅ Web/Browser
✅ iOS (via Capacitor)
✅ Android (via Capacitor)
✅ PWA
✅ All modern browsers

---

## 📚 More Info

- **Quick Guide:** DEEPLINK_COMPLETE_GUIDE.md
- **Code Examples:** NOTIFICATION_CODE_EXAMPLES.md
- **Full Docs:** PUSH_NOTIFICATION_DEEPLINKS.md
- **Architecture:** DEEPLINK_ARCHITECTURE.md

---

## 🆘 Common Questions

**Q: Do I need to update all my notifications?**
A: No, old notifications still work. New ones with deep-links are better.

**Q: Can I use this with old FCM payloads?**
A: Yes, system is backward compatible.

**Q: What if user doesn't have permission?**
A: App still opens, just at home screen. No error.

**Q: Can I test locally?**
A: Yes, send test notifications from your service.

**Q: How do I know if it worked?**
A: Check browser console or logs, click notification.

---

## 📞 Support Quick Links

Lost? Start here:
1. Read this file (you're here!)
2. Check DEEPLINK_COMPLETE_GUIDE.md
3. Look at NOTIFICATION_CODE_EXAMPLES.md
4. Search PUSH_NOTIFICATION_DEEPLINKS.md

---

**Version:** 1.0
**Last Updated:** January 3, 2026
**Status:** ✅ READY TO USE

---

## 🎉 You've Got This!

```
// It's this simple:

const path = buildDeepLinkPath({ projectId: 'abc123' });
await sendPushNotification(userId, 'Title', 'Body', {
  projectId: 'abc123',
  deepLinkPath: path
});

// Click notification → Opens project. Done! ✨
```
