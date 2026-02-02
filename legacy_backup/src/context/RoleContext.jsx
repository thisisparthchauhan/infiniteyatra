import React, { createContext, useContext, useState, useEffect } from 'react';
import { USER_ROLES, ROLE_PERMISSIONS } from '../config/roles';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    // Default to Super Admin for dev, or load from localStorage
    const [currentRole, setCurrentRole] = useState(() => {
        return localStorage.getItem('iy_admin_role') || USER_ROLES.SUPER_ADMIN;
    });

    useEffect(() => {
        localStorage.setItem('iy_admin_role', currentRole);
    }, [currentRole]);

    const hasPermission = (featureId) => {
        const allowedFeatures = ROLE_PERMISSIONS[currentRole] || [];
        return allowedFeatures.includes(featureId);
    };

    const getFirstAllowedTab = () => {
        const allowedFeatures = ROLE_PERMISSIONS[currentRole] || [];
        return allowedFeatures.length > 0 ? allowedFeatures[0] : 'unauthorized';
    };

    return (
        <RoleContext.Provider value={{ currentRole, setCurrentRole, hasPermission, getFirstAllowedTab, roles: USER_ROLES }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);
