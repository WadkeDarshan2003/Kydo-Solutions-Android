/**
 * Deep-link handler for push notifications and other navigation scenarios.
 * Routes notifications to specific views, projects, tasks, and meetings with proper context.
 */

export type ViewState = 'dashboard' | 'projects' | 'project-detail' | 'designers' | 'clients' | 'vendors' | 'admins' | 'kanban' | 'people';

export interface DeepLinkTarget {
  view: ViewState;
  projectId?: string;
  taskId?: string;
  meetingId?: string;
  targetTab?: 'discovery' | 'plan' | 'financials' | 'team' | 'timeline' | 'documents' | 'meetings';
  openModal?: string; // For opening specific modals like 'pending-items'
}

/**
 * Parses a deep-link URL or path and returns navigation parameters.
 * Examples:
 * - /project/abc123
 * - /project/abc123?tab=plan
 * - /project/abc123/task/xyz789
 * - /project/abc123/meeting/meet123
 */
export const parseDeepLink = (path: string): DeepLinkTarget | null => {
  if (!path) return null;

  // Remove leading slash and query params
  const cleanPath = path.split('?')[0].replace(/^\/+/, '');
  const queryParams = new URLSearchParams(path.split('?')[1] || '');
  const segments = cleanPath.split('/').filter(Boolean);

  // Handle different path patterns
  if (segments[0] === 'project' && segments[1]) {
    const projectId = segments[1];
    const targetTab = (queryParams.get('tab') as any) || undefined;
    
    // /project/abc123/task/xyz789
    if (segments[2] === 'task' && segments[3]) {
      return {
        view: 'project-detail',
        projectId,
        taskId: segments[3],
        targetTab,
      };
    }

    // /project/abc123/meeting/meet123
    if (segments[2] === 'meeting' && segments[3]) {
      return {
        view: 'project-detail',
        projectId,
        meetingId: segments[3],
        targetTab: 'meetings',
      };
    }

    // Just /project/abc123
    return {
      view: 'project-detail',
      projectId,
      targetTab,
    };
  }

  // Handle view-only navigation
  if (segments[0] === 'projects') {
    return { view: 'projects' };
  }
  if (segments[0] === 'dashboard') {
    return { view: 'dashboard' };
  }
  if (segments[0] === 'designers') {
    return { view: 'designers' };
  }
  if (segments[0] === 'clients') {
    return { view: 'clients' };
  }
  if (segments[0] === 'vendors') {
    return { view: 'vendors' };
  }
  if (segments[0] === 'admins') {
    return { view: 'admins' };
  }

  return null;
};

/**
 * Builds a deep-link URL path from notification data.
 * Used when sending push notifications to ensure proper routing.
 */
export const buildDeepLinkPath = (target: Partial<DeepLinkTarget>): string => {
  if (target.projectId) {
    let path = `/project/${target.projectId}`;
    
    if (target.taskId) {
      path += `/task/${target.taskId}`;
    } else if (target.meetingId) {
      path += `/meeting/${target.meetingId}`;
    }
    
    if (target.targetTab && !target.taskId && !target.meetingId) {
      path += `?tab=${target.targetTab}`;
    }
    
    return path;
  }

  if (target.view) {
    return `/${target.view}`;
  }

  return '/';
};

import { Dispatch, SetStateAction } from 'react';

/**
 * Navigation handler that executes actual navigation in the app.
 * This is called from the app when a notification is clicked.
 */
export interface DeepLinkNavigator {
  setCurrentView: Dispatch<SetStateAction<ViewState>>;
  setSelectedProject: (project: any) => void;
  setSelectedTask: (task: any) => void;
  setInitialProjectTab: (tab: any) => void;
  onSelectProject?: (project: any, opts?: any) => void;
  projects: any[];
  tasks?: Map<string, any[]>;
}

export const executeDeepLink = (target: DeepLinkTarget, navigator: DeepLinkNavigator) => {
  try {
    // Navigate to main view
    navigator.setCurrentView(target.view);

    if (target.projectId && target.view === 'project-detail') {
      // Find the project
      const project = navigator.projects.find(p => p.id === target.projectId);
      
      if (project) {
        navigator.setSelectedProject(project);
        
        // If there's a specific tab, set it
        if (target.targetTab) {
          navigator.setInitialProjectTab(target.targetTab);
        }

        // If there's a specific task, set it
        if (target.taskId && navigator.tasks) {
          const projectTasks = navigator.tasks.get(target.projectId) || [];
          const task = projectTasks.find(t => t.id === target.taskId);
          if (task) {
            navigator.setSelectedTask(task);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error executing deep link:', error);
  }
};
