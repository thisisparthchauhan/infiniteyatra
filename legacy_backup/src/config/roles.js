import {
    LayoutDashboard,
    CalendarRange,
    Users,
    Briefcase,
    TrendingUp,
    Home,
    Map,
    BookOpen,
    Building2,
    Landmark,
    Image
} from 'lucide-react';

export const USER_ROLES = {
    SUPER_ADMIN: 'Super Admin',
    BOOKING_MANAGER: 'Booking Manager',
    FINANCE_MANAGER: 'Finance Manager',
    CONTENT_MANAGER: 'Content Manager',
    OPERATIONS_MANAGER: 'Operations Manager'
};

// Define which tabs are accessible for each role
export const ROLE_PERMISSIONS = {
    [USER_ROLES.SUPER_ADMIN]: [
        'overview', 'bookings', 'finance', 'crm', 'packages', 'homepage',
        'operations', 'staff', 'experiences', 'hotels', 'hotel-finance',
        'stories', 'media', 'influencers'
    ],
    [USER_ROLES.BOOKING_MANAGER]: [
        'bookings', 'crm', 'packages'
    ],
    [USER_ROLES.FINANCE_MANAGER]: [
        'finance', 'hotel-finance', 'bookings' // Bookings read-only handled in component 
    ],
    [USER_ROLES.CONTENT_MANAGER]: [
        'hotels', 'homepage', 'media', 'stories'
    ],
    [USER_ROLES.OPERATIONS_MANAGER]: [
        'operations', 'packages', 'experiences'
    ]
};

// Sidebar Menu Configuration
export const MENU_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'bookings', label: 'Tour Booking', icon: CalendarRange },
    { id: 'finance', label: 'Tour Financials', icon: TrendingUp },
    { id: 'crm', label: 'Tour Customers', icon: Users },
    { id: 'packages', label: 'Packages', icon: Briefcase },
    { id: 'experiences', label: 'Story Manage', icon: BookOpen },
    { id: 'operations', label: 'Operations', icon: Map },
    { id: 'hotels', label: 'Manage Hotels', icon: Building2 },
    { id: 'hotel-finance', label: 'Hotel Financial', icon: Landmark },
    { id: 'homepage', label: 'Home Package Manager', icon: Home },
    { id: 'stories', label: 'Story', icon: Briefcase },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'influencers', label: 'Influencer ROI', icon: TrendingUp },
    { id: 'staff', label: 'Staff & Roles', icon: Users },
];
