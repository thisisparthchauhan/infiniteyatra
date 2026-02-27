import {
    LayoutDashboard,
    Calendar,
    Package,
    Users,
    Settings,
    PenTool,
    Image,
    Briefcase,
    TrendingUp,
    Globe,
    Compass,
    Building2,
    BookOpen,
    BarChart3,
    Landmark,
    Home
} from 'lucide-react';

export const USER_ROLES = {
    SUPER_ADMIN: 'Admin Dashboard',
    TOUR_MANAGER: 'Tour Manager',
    FINANCE_MANAGER: 'Finance Manager',
    CONTENT_MANAGER: 'Content Manager',
    HOTEL_MANAGER: 'Hotel Manager',
    BOOKING_MANAGER: 'Booking Manager',
    HOTEL_PARTNER: 'Hotel Partner', // Partner Self-Service
    TOUR_PARTNER: 'Tour Partner'    // Partner Self-Service
};

export const WORKSPACES = {
    ADMIN_DASHBOARD: {
        id: 'admin_workspace',
        label: 'Admin Dashboard',
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
        modules: [
            'overview', 'staff',
            'bookings', 'crm', 'packages', 'operations',
            'finance', 'hotel-finance', 'influencers',
            'homepage', 'experiences', 'stories', 'media',
            'hotels'
        ]
    },
    TOUR_MANAGER: {
        id: 'tour_workspace',
        label: 'Tour Manager',
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.TOUR_MANAGER],
        modules: ['bookings', 'crm', 'packages', 'operations']
    },
    FINANCE_MANAGER: {
        id: 'finance_workspace',
        label: 'Finance Manager',
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.FINANCE_MANAGER],
        modules: ['finance', 'hotel-finance', 'influencers']
    },
    CONTENT_MANAGER: {
        id: 'content_workspace',
        label: 'Content Manager',
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.CONTENT_MANAGER],
        modules: ['homepage', 'experiences', 'stories', 'media']
    },
    HOTEL_MANAGER: {
        id: 'hotel_workspace',
        label: 'Hotel Manager',
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.HOTEL_MANAGER, USER_ROLES.HOTEL_PARTNER],
        modules: ['hotels', 'hotel-bookings', 'hotel-finance', 'analytics'] // Added Analytics
    },
    BOOKING_MANAGER: {
        id: 'booking_workspace',
        label: 'Booking Manager',
        allowedRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.BOOKING_MANAGER],
        modules: ['hotel-bookings', 'bookings', 'analytics']
    },
    PARTNER: {
        id: 'partner_workspace',
        label: 'Partner Portal',
        allowedRoles: [USER_ROLES.HOTEL_PARTNER, USER_ROLES.TOUR_PARTNER],
        modules: ['hotels', 'hotel-bookings'] // Restricted
    }
};

export const ROLE_WORKSPACE_MAP = {
    [USER_ROLES.SUPER_ADMIN]: WORKSPACES.ADMIN_DASHBOARD.id,
    [USER_ROLES.TOUR_MANAGER]: WORKSPACES.TOUR_MANAGER.id,
    [USER_ROLES.FINANCE_MANAGER]: WORKSPACES.FINANCE_MANAGER.id,
    [USER_ROLES.CONTENT_MANAGER]: WORKSPACES.CONTENT_MANAGER.id,
    [USER_ROLES.HOTEL_MANAGER]: WORKSPACES.HOTEL_MANAGER.id,
    [USER_ROLES.BOOKING_MANAGER]: WORKSPACES.BOOKING_MANAGER.id
};

// Flattened permissions for legacy checks if needed, but we should rely on Workspace modules
export const ROLE_PERMISSIONS = {
    [USER_ROLES.SUPER_ADMIN]: ['overview', 'staff', 'bookings', 'crm', 'packages', 'operations', 'finance', 'hotel-finance', 'influencers', 'homepage', 'experiences', 'stories', 'media', 'hotels'],
    [USER_ROLES.TOUR_MANAGER]: ['bookings', 'crm', 'packages', 'operations'],
    [USER_ROLES.FINANCE_MANAGER]: ['finance', 'hotel-finance', 'influencers', 'analytics'],
    [USER_ROLES.CONTENT_MANAGER]: ['homepage', 'experiences', 'stories', 'media'],
    [USER_ROLES.HOTEL_MANAGER]: ['hotels', 'hotel-bookings', 'hotel-finance', 'analytics'],
    [USER_ROLES.BOOKING_MANAGER]: ['hotel-bookings', 'bookings', 'analytics'],
    [USER_ROLES.HOTEL_PARTNER]: ['hotels', 'hotel-bookings', 'hotel-finance'], // Self-Service
    [USER_ROLES.TOUR_PARTNER]: ['bookings', 'finance'] // Self-Service
};

export const MENU_ITEMS = [
    // Admin
    { id: 'analytics', label: 'Live Dashboard', icon: BarChart3 }, // New
    { id: 'overview', label: 'Snapshot', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff & Roles', icon: Users },

    // Tour
    { id: 'bookings', label: 'Tour Bookings', icon: Calendar },
    { id: 'crm', label: 'Tour Clients', icon: Users },
    { id: 'packages', label: 'Packages', icon: Briefcase },
    { id: 'operations', label: 'Operations', icon: Compass }, // Changed icon

    // Finance
    { id: 'finance', label: 'Financials (Tours)', icon: TrendingUp },
    { id: 'hotel-finance', label: 'Hotel Financial', icon: Landmark },
    { id: 'influencers', label: 'Influencer ROI', icon: TrendingUp },

    // Content
    { id: 'homepage', label: 'Homepage Manager', icon: Home },
    { id: 'experiences', label: 'Experiences', icon: BookOpen },
    { id: 'stories', label: 'Blog & Stories', icon: Briefcase },
    { id: 'media', label: 'Media Library', icon: Image },

    // Hotel
    // Hotel
    { id: 'hotels', label: 'Manage Hotels', icon: Building2 },
    { id: 'hotel-bookings', label: 'Hotel Bookings', icon: BookOpen },
];
