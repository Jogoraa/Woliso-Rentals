import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'landlord') return '/landlord/dashboard';
    if (user.role === 'tenant') return '/tenant/dashboard';
    return '/';
  };

  return (
    <nav className="glass-effect sticky top-0 z-50 border-b border-gray-200" data-testid="navbar">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2" data-testid="nav-home-link">
            <Home className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-800">Woliso Rentals</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to={getDashboardPath()}>
                  <Button variant="ghost" size="sm" data-testid="nav-dashboard-btn">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-2" data-testid="user-info">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.full_name}</span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {user.role}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  data-testid="nav-logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" data-testid="nav-login-btn">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" data-testid="nav-register-btn">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;