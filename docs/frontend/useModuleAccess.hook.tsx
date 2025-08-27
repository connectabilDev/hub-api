import { useLogto } from '@logto/react';
import { useMemo } from 'react';

export type HubModule = 'community' | 'jobs' | 'mentoring' | 'education';
export type ModuleAction = 'view' | 'create' | 'post' | 'manage' | 'moderate' | 'admin' | 'apply' | 'schedule' | 'teach' | 'enroll' | 'review' | 'grade' | 'invite';

interface ModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canManage: boolean;
  canModerate: boolean;
  isAdmin: boolean;
  [key: string]: boolean;
}

interface UseModuleAccessReturn {
  hasModuleAccess: (module: HubModule) => boolean;
  hasModuleAction: (module: HubModule, action: ModuleAction) => boolean;
  getModulePermissions: (module: HubModule) => ModulePermissions;
  getUserModules: () => HubModule[];
  isModuleAdmin: (module: HubModule) => boolean;
}

export const useModuleAccess = (): UseModuleAccessReturn => {
  const { isAuthenticated, getIdTokenClaims } = useLogto();
  
  const userScopes = useMemo(() => {
    if (!isAuthenticated) return [];
    
    const claims = getIdTokenClaims();
    const scopeString = claims?.scope || '';
    return scopeString.split(' ').filter(Boolean);
  }, [isAuthenticated, getIdTokenClaims]);

  const hasScope = (scope: string): boolean => {
    return userScopes.includes(scope);
  };

  const hasModuleAccess = (module: HubModule): boolean => {
    return hasScope(`${module}:view`);
  };

  const hasModuleAction = (module: HubModule, action: ModuleAction): boolean => {
    return hasScope(`${module}:${action}`);
  };

  const getModulePermissions = (module: HubModule): ModulePermissions => {
    return {
      canView: hasScope(`${module}:view`),
      canCreate: hasScope(`${module}:create`) || hasScope(`${module}:post`),
      canManage: hasScope(`${module}:manage`),
      canModerate: hasScope(`${module}:moderate`),
      isAdmin: hasScope(`${module}:admin`),
      canApply: hasScope(`${module}:apply`),
      canSchedule: hasScope(`${module}:schedule`),
      canTeach: hasScope(`${module}:teach`),
      canEnroll: hasScope(`${module}:enroll`),
      canReview: hasScope(`${module}:review`),
      canGrade: hasScope(`${module}:grade`),
      canInvite: hasScope(`${module}:invite`),
    };
  };

  const getUserModules = (): HubModule[] => {
    const modules: HubModule[] = ['community', 'jobs', 'mentoring', 'education'];
    return modules.filter(module => hasModuleAccess(module));
  };

  const isModuleAdmin = (module: HubModule): boolean => {
    return hasScope(`${module}:admin`) || hasScope('admin');
  };

  return {
    hasModuleAccess,
    hasModuleAction,
    getModulePermissions,
    getUserModules,
    isModuleAdmin,
  };
};

// Example usage in a React component:
/*
import React from 'react';
import { useModuleAccess } from './hooks/useModuleAccess';

const CommunitySection: React.FC = () => {
  const { hasModuleAccess, hasModuleAction, getModulePermissions } = useModuleAccess();
  
  if (!hasModuleAccess('community')) {
    return <div>You don't have access to the community module</div>;
  }
  
  const permissions = getModulePermissions('community');
  
  return (
    <div>
      <h1>Community</h1>
      
      {permissions.canView && (
        <div>Community posts list...</div>
      )}
      
      {permissions.canCreate && (
        <button>Create New Post</button>
      )}
      
      {permissions.canModerate && (
        <button>Moderate Posts</button>
      )}
      
      {permissions.isAdmin && (
        <button>Admin Settings</button>
      )}
    </div>
  );
};

const ModuleNavigation: React.FC = () => {
  const { getUserModules } = useModuleAccess();
  const availableModules = getUserModules();
  
  return (
    <nav>
      {availableModules.includes('community') && (
        <a href="/community">Community</a>
      )}
      {availableModules.includes('jobs') && (
        <a href="/jobs">Jobs</a>
      )}
      {availableModules.includes('mentoring') && (
        <a href="/mentoring">Mentoring</a>
      )}
      {availableModules.includes('education') && (
        <a href="/education">Education</a>
      )}
    </nav>
  );
};
*/