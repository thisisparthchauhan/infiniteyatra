import React, { createContext, useContext, useState, useEffect } from 'react';
import { USER_ROLES, ROLE_PERMISSIONS, WORKSPACES, ROLE_WORKSPACE_MAP } from '../config/roles';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    // Default to Super Admin for dev, or load from localStorage
    const [currentRole, setCurrentRole] = useState(() => {
        return localStorage.getItem('iy_admin_role') || USER_ROLES.SUPER_ADMIN;
    });

    const [currentWorkspace, setCurrentWorkspace] = useState(() => {
        const savedWorkspace = localStorage.getItem('iy_admin_workspace');
        // Initial load: prefer saved workspace if allowed for current role, otherwise default
        return savedWorkspace || ROLE_WORKSPACE_MAP[currentRole] || WORKSPACES.ADMIN_DASHBOARD.id;
    });

    useEffect(() => {
        localStorage.setItem('iy_admin_role', currentRole);

        // Strict Rule: Non-Super Admins are locked to their assigned workspace
        if (currentRole !== USER_ROLES.SUPER_ADMIN) {
            const assignedWorkspace = ROLE_WORKSPACE_MAP[currentRole];
            // Only force switch if NOT in Admin Dashboard (allow previewing Admin Dashboard to auto-upgrade logic below to catch it)
            // Actually, if we are Hotel Manager, we shoudn't be in Admin Dashboard unless we switched.
            // If we are in Admin Dashboard, we must be Super Admin.
            if (currentWorkspace !== assignedWorkspace && currentWorkspace !== WORKSPACES.ADMIN_DASHBOARD.id) {
                setCurrentWorkspace(assignedWorkspace);
            }
        }
    }, [currentRole]);

    // Safety Net: If in Admin Workspace, MUST be Super Admin
    useEffect(() => {
        if (currentWorkspace === WORKSPACES.ADMIN_DASHBOARD.id && currentRole !== USER_ROLES.SUPER_ADMIN) {
            setCurrentRole(USER_ROLES.SUPER_ADMIN);
        }
    }, [currentWorkspace, currentRole]);

    useEffect(() => {
        localStorage.setItem('iy_admin_workspace', currentWorkspace);
    }, [currentWorkspace]);

    const hasPermission = (featureId) => {
        // Core Access Check:
        // 1. Is the feature part of the CURRENT WORKSPACE?
        // 2. Does the user's role have permission? (Legacy check, usually redundant if workspaces are strict)

        const workspaceConfig = Object.values(WORKSPACES).find(w => w.id === currentWorkspace);
        if (!workspaceConfig) return false;

        const isModuleInWorkspace = workspaceConfig.modules.includes(featureId);
        const hasRolePermission = ROLE_PERMISSIONS[currentRole]?.includes(featureId);

        return isModuleInWorkspace && hasRolePermission;
    };

    const getFirstAllowedTab = () => {
        const workspaceConfig = Object.values(WORKSPACES).find(w => w.id === currentWorkspace);
        return workspaceConfig?.modules[0] || 'overview';
    };

    return (
        <RoleContext.Provider value={{
            currentRole,
            setCurrentRole,
            currentWorkspace,
            setCurrentWorkspace,
            hasPermission,
            getFirstAllowedTab,
            roles: USER_ROLES,
            workspaces: WORKSPACES
        }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);
