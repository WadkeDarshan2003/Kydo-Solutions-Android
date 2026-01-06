# Push Notification Deep-Linking Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PUSH NOTIFICATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. SENDING NOTIFICATION
════════════════════════════════════════════════════════════════════════════════

   Your Service/Cloud Function
   │
   ├─ Create notification data
   ├─ Build deep-link path: buildDeepLinkPath({ projectId, taskId, tab })
   └─ Call sendPushNotification(userId, title, body, {
      ├─ projectId: 'proj-123'
      ├─ taskId: 'task-456'          (optional)
      ├─ meetingId: 'meet-789'       (optional)
      ├─ targetTab: 'plan'           (optional)
      └─ deepLinkPath: '/project/proj-123/task/task-456'
         })
            │
            ├─ [Browser] → Firebase Cloud Messaging
            ├─ [Mobile] → Capacitor PushNotifications
            └─ [Server] → Cloud Function → FCM Service


2. RECEIVING NOTIFICATION (App in Foreground)
════════════════════════════════════════════════════════════════════════════════

   Firebase Messaging / Capacitor
   │
   ├─ onMessage() or pushNotificationReceived listener
   │
   ├─ Extract notification data:
   │  ├─ title
   │  ├─ body
   │  ├─ projectId
   │  ├─ taskId
   │  ├─ meetingId
   │  ├─ targetTab
   │  └─ deepLinkPath
   │
   └─ Show notification (browser/native)
      │
      └─ Store in app state via addNotification()
         └─ NotificationContext


3. USER CLICKS NOTIFICATION
════════════════════════════════════════════════════════════════════════════════

   NotificationPanel.tsx
   │
   ├─ handleNotificationClick(notification)
   │  ├─ markAsRead(notification.id)
   │  └─ if deepLinkHandler exists:
   │     └─ Call deepLinkHandler(notification)
   │
   ├─ handleNotificationDeepLink(notification)
   │  ├─ Parse deepLinkPath via parseDeepLink()
   │  └─ OR construct target from notification properties:
   │     ├─ view: 'project-detail' | 'dashboard' | etc
   │     ├─ projectId
   │     ├─ taskId
   │     ├─ meetingId
   │     └─ targetTab
   │
   └─ executeDeepLink(target, navigator)
      │
      ├─ setCurrentView(target.view)
      ├─ setSelectedProject(project)
      ├─ if taskId: setSelectedTask(task)
      ├─ if targetTab: setInitialProjectTab(targetTab)
      └─ UI re-renders showing:
         ├─ Correct view
         ├─ Selected project
         ├─ Highlighted task (if applicable)
         └─ Active tab (if specified)


4. BROWSER NOTIFICATION CLICK (App Closed)
════════════════════════════════════════════════════════════════════════════════

   User clicks browser notification
   │
   ├─ notification.onclick handler in pushNotificationService
   │
   ├─ Extract deepLinkPath from notification.data
   │
   ├─ window.focus()
   │
   └─ If deepLink callback exists:
      └─ Call onDeepLink(deepLinkPath)
         └─ App opens and navigates
         
      OR fallback:
      └─ window.location.href = deepLinkPath
         └─ Browser handles navigation


5. NATIVE NOTIFICATION CLICK (Mobile App Closed)
════════════════════════════════════════════════════════════════════════════════

   Capacitor PushNotifications
   │
   ├─ pushNotificationActionPerformed listener
   │
   ├─ Extract notification data from payload
   │
   └─ App opens with deep-link data in initialization
      │
      ├─ parseDeepLink(deepLinkPath)
      │
      └─ executeDeepLink() navigates to target location
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT HIERARCHY                               │
└─────────────────────────────────────────────────────────────────────────────┘

App.tsx
├─ AuthProvider
├─ NotificationProvider ◄─── Manages notifications + deep-link handler
│  └─ LoadingProvider
│     └─ AppContent
│        ├─ useAuth()
│        ├─ useNotifications() ◄─── Gets { addNotification, setDeepLinkHandler }
│        │
│        ├─ setDeepLinkHandler(handleDeepLink) ◄─── Registers navigation callback
│        │  └─ Captures: setCurrentView, setSelectedProject, setSelectedTask, etc.
│        │
│        ├─ Dashboard
│        ├─ ProjectDetail
│        │  ├─ Project tabs (discovery, plan, financials, etc.)
│        │  ├─ Task details
│        │  └─ Meeting information
│        │
│        └─ NotificationPanel ◄─── Renders notifications
│           ├─ receives: onDeepLink callback
│           ├─ onClick → handleNotificationClick()
│           └─ Navigates via executeDeepLink()


Data Flow in NotificationPanel:
════════════════════════════════════════════════════════════════════════════════

User clicks notification
        │
        ↓
handleNotificationClick(notification)
        │
        ├─→ markAsRead(notification.id)
        │
        ├─→ useNotifications().handleNotificationDeepLink(notification)
        │   └─→ parseDeepLink(notification.deepLinkPath) → DeepLinkTarget
        │       or construct from notification properties
        │
        └─→ onDeepLink(target) callback
            └─→ executeDeepLink(target, navigator)
                ├─→ setCurrentView()
                ├─→ setSelectedProject()
                ├─→ setSelectedTask() [if taskId]
                └─→ setInitialProjectTab() [if targetTab]
                    └─→ UI Updates & Renders
```

## Data Structure Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA TRANSFORMATIONS                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. NOTIFICATION STRUCTURE
═════════════════════════════════════════════════════════════════════════════

Notification {
  id: string                                    // Unique ID
  title: string                                 // "Task Assigned"
  message: string                               // "You have a new task"
  type: 'info' | 'success' | 'warning' | 'error'
  
  // Deep-link properties (NEW)
  projectId?: string                            // "proj-123"
  taskId?: string                               // "task-456"
  meetingId?: string                            // "meet-789"
  targetTab?: 'discovery'|'plan'|'financials'   // Which tab to open
                |'team'|'timeline'|'documents'
                |'meetings'
  deepLinkPath?: string                         // "/project/proj-123/task/task-456"
  
  // Metadata
  projectName?: string                          // "Website Redesign"
  recipientId?: string                          // User ID
  timestamp: Date
  read: boolean
}


2. DEEP-LINK TARGET STRUCTURE
═════════════════════════════════════════════════════════════════════════════

DeepLinkTarget {
  view: 'dashboard' | 'projects' | 'project-detail' | 'designers' | 
        'clients' | 'vendors' | 'admins' | 'kanban' | 'people'
  
  projectId?: string        // "proj-123"
  taskId?: string          // "task-456"
  meetingId?: string       // "meet-789"
  targetTab?: string       // "plan", "financials", etc.
  openModal?: string       // e.g., "pending-items"
}


3. PUSH NOTIFICATION PAYLOAD (FCM/Capacitor)
═════════════════════════════════════════════════════════════════════════════

FCM/Capacitor Payload {
  notification: {
    title: string
    body: string
    icon?: string
    badge?: string
  }
  
  data: {
    // Deep-link information
    deepLinkPath: string          // "/project/proj-123?tab=plan"
    projectId?: string            // "proj-123"
    taskId?: string               // "task-456"
    meetingId?: string            // "meet-789"
    targetTab?: string            // "plan"
    
    // Metadata
    type?: string                 // "task-update", "meeting", etc.
    priority?: string             // "high", "normal"
  }
}


4. APP STATE UPDATES
═════════════════════════════════════════════════════════════════════════════

Current View State Before:
{
  currentView: 'dashboard'
  selectedProject: null
  selectedTask: null
  initialProjectTab: undefined
}
            ↓ (executeDeepLink called)
Current View State After:
{
  currentView: 'project-detail'
  selectedProject: Project { id: 'proj-123', ... }
  selectedTask: Task { id: 'task-456', ... }
  initialProjectTab: 'plan'  // ProjectDetail uses this to set active tab
}
            ↓
UI Renders:
- ProjectDetail component loads
- Loads project with ID 'proj-123'
- Loads tasks for that project
- Finds and highlights task 'task-456'
- Sets plan tab as active
- User sees the exact location they need to see!
```

## Deep-Link Path Examples

```
SIMPLE PATHS
═════════════════════════════════════════════════════════════════════════════

/project/abc123
  → Opens project detail view
  → view: 'project-detail'
  → projectId: 'abc123'


PROJECT WITH TAB
═════════════════════════════════════════════════════════════════════════════

/project/abc123?tab=plan
  → Opens project detail view
  → Sets active tab to "plan"
  → view: 'project-detail'
  → projectId: 'abc123'
  → targetTab: 'plan'


TASK IN PROJECT
═════════════════════════════════════════════════════════════════════════════

/project/abc123/task/xyz789
  → Opens project detail view
  → Loads and highlights task xyz789
  → view: 'project-detail'
  → projectId: 'abc123'
  → taskId: 'xyz789'


MEETING IN PROJECT
═════════════════════════════════════════════════════════════════════════════

/project/abc123/meeting/meet123
  → Opens project detail view
  → Sets active tab to "meetings"
  → Loads and shows meeting meet123
  → view: 'project-detail'
  → projectId: 'abc123'
  → meetingId: 'meet123'
  → targetTab: 'meetings'


VIEW-ONLY PATHS
═════════════════════════════════════════════════════════════════════════════

/dashboard         → Opens dashboard view
/projects          → Opens projects list
/designers         → Opens designers list
/clients           → Opens clients list
/vendors           → Opens vendors list
/admins            → Opens admins list
```

## Helper Function Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UTILITY FUNCTION RELATIONSHIPS                        │
└─────────────────────────────────────────────────────────────────────────────┘

buildDeepLinkPath()
├─ Input: { projectId, taskId, meetingId, targetTab }
├─ Output: "/project/{id}/task/{id}" or similar string
└─ Usage: When SENDING notifications
   └─ Ensures consistent path format


parseDeepLink()
├─ Input: "/project/abc123?tab=plan" string
├─ Output: { view: 'project-detail', projectId: 'abc123', targetTab: 'plan' }
└─ Usage: When RECEIVING notifications
   └─ Converts path string to navigation target


executeDeepLink()
├─ Input: DeepLinkTarget object + navigator functions
├─ Process: Call setters to update app state
├─ Output: None (side effects only)
└─ Usage: When NAVIGATING from notification
   └─ Actually performs the navigation


Integration Flow:
════════════════════════════════════════════════════════════════════════════════

SENDING:
  Your Code
    ↓
  buildDeepLinkPath({ projectId, taskId })
    ↓
  deepLinkPath = "/project/abc/task/xyz"
    ↓
  sendPushNotification(..., { deepLinkPath, ... })
    ↓
  FCM Payload


RECEIVING:
  FCM Payload
    ↓
  onMessageListener() / pushNotificationReceived
    ↓
  addNotification({ deepLinkPath, projectId, taskId, ... })
    ↓
  Store in NotificationContext


NAVIGATING:
  User clicks notification
    ↓
  handleNotificationDeepLink()
    ↓
  parseDeepLink(notification.deepLinkPath)
    ↓
  DeepLinkTarget = { view: 'project-detail', projectId: 'abc', taskId: 'xyz' }
    ↓
  executeDeepLink(target, navigator)
    ↓
  UI Updates
```

## Tab Navigation Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AVAILABLE PROJECT TABS                              │
└─────────────────────────────────────────────────────────────────────────────┘

ProjectDetail Component Tabs
════════════════════════════════════════════════════════════════════════════════

Tab Name          | Target Value  | Contents
──────────────────┼───────────────┼──────────────────────────────────────
Discovery         | 'discovery'   | Project overview, status, timeline
Planning          | 'plan'        | Project planning, tasks, milestones
Financials        | 'financials'  | Budget, costs, pricing details
Team              | 'team'        | Team members, roles, assignments
Timeline          | 'timeline'    | Gantt chart, schedule, deadlines
Documents         | 'documents'   | Files, uploads, shared documents
Meetings          | 'meetings'    | Project meetings, schedule, notes


Deep-Link Examples for Each Tab
════════════════════════════════════════════════════════════════════════════════

Discovery:
  /project/abc123?tab=discovery
  sendPushNotification(..., { projectId: 'abc123', targetTab: 'discovery', ... })

Plan:
  /project/abc123?tab=plan
  sendPushNotification(..., { projectId: 'abc123', targetTab: 'plan', ... })

Financials:
  /project/abc123?tab=financials
  sendPushNotification(..., { projectId: 'abc123', targetTab: 'financials', ... })

Team:
  /project/abc123?tab=team
  sendPushNotification(..., { projectId: 'abc123', targetTab: 'team', ... })

Timeline:
  /project/abc123?tab=timeline
  sendPushNotification(..., { projectId: 'abc123', targetTab: 'timeline', ... })

Documents:
  /project/abc123?tab=documents
  sendPushNotification(..., { projectId: 'abc123', targetTab: 'documents', ... })

Meetings:
  /project/abc123?tab=meetings
  sendPushNotification(..., { projectId: 'abc123', targetTab: 'meetings', ... })
```

---

**This architecture ensures:**
✅ Clean separation of concerns
✅ Reusable deep-link logic
✅ Consistent navigation across notification sources
✅ Type-safe data transformations
✅ Easy to test and debug
✅ Scalable for future notification types
