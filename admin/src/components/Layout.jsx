import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Video, Users, CreditCard, LogOut, Settings } from 'lucide-react';

const Layout = () => {
    const { user, clearAuth } = useAuthStore();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Videos', href: '/videos', icon: Video },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Plans', href: '/plans', icon: CreditCard },
        { name: 'Metadata', href: '/metadata', icon: Settings },
    ];

    const handleLogout = () => {
        clearAuth();
    };

    return (
        <div className="flex h-screen bg-bg">
            <div className="w-64 bg-bg-surface border-r border-border p-4 flex flex-col">
                <div className="text-2xl font-bold text-accent mb-8 px-4">EduReel Admin</div>
                <nav className="flex-1 space-y-2">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                                    isActive 
                                    ? 'bg-accent/10 text-accent' 
                                    : 'text-gray-400 hover:bg-bg-elevated hover:text-white'
                                }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="pt-4 border-t border-border mt-auto">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </div>
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
