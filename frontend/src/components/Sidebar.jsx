import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Home, 
  Calendar, 
  Heart, 
  MessageSquare,
  Users,
  Clock,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ role, isOpen, onClose }) => {
  const location = useLocation();

  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', section: 'overview' },
          { icon: Clock, label: 'Property Approval', path: '/admin/dashboard?tab=pending', section: 'pending' },
          { icon: Users, label: 'User Management', path: '/admin/dashboard?tab=users', section: 'users' },
          { icon: MessageSquare, label: 'Feedback', path: '/admin/dashboard?tab=feedback', section: 'feedback' },
        ];
      case 'landlord':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/landlord/dashboard', section: 'overview' },
          { icon: Home, label: 'My Listings', path: '/landlord/dashboard?tab=properties', section: 'properties' },
          { icon: Calendar, label: 'Booking Requests', path: '/landlord/dashboard?tab=bookings', section: 'bookings' },
          { icon: BarChart3, label: 'Analytics', path: '/landlord/dashboard?tab=analytics', section: 'analytics' },
        ];
      case 'tenant':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/tenant/dashboard', section: 'overview' },
          { icon: Heart, label: 'Saved Houses', path: '/tenant/dashboard?tab=saved', section: 'saved' },
          { icon: Calendar, label: 'My Requests', path: '/tenant/dashboard?tab=requests', section: 'requests' },
          { icon: MessageSquare, label: 'Reviews', path: '/tenant/dashboard?tab=reviews', section: 'reviews' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const isActiveLink = (path) => {
    return location.pathname === path.split('?')[0];
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        data-testid="sidebar"
      >
        <nav className="h-full flex flex-col p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveLink(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                data-testid={`sidebar-link-${item.section}`}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
