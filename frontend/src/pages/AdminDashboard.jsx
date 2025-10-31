import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Users, Home, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [pendingHouses, setPendingHouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, housesRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/pending-houses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setPendingHouses(housesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleHouseAction = async (houseId, status) => {
    try {
      await axios.put(
        `${API}/admin/houses/${houseId}/status?status=${status}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`House ${status === 'available' ? 'approved' : 'rejected'}`);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update house status');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="glass-effect">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-800" data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const HouseCard = ({ house }) => (
    <Card className="glass-effect" data-testid={`pending-house-${house.house_id}`}>
      <CardContent className="p-4">
        <Badge className="bg-yellow-100 text-yellow-700 mb-2">
          Pending Approval
        </Badge>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {house.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{house.location}</p>
        <p className="text-lg font-bold text-indigo-600 mb-3">
          ${house.price_per_month}/month
        </p>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {house.description}
        </p>
        <div className="flex space-x-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => handleHouseAction(house.house_id, 'available')}
            data-testid="approve-house-btn"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleHouseAction(house.house_id, 'hidden')}
            data-testid="reject-house-btn"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const UserCard = ({ user }) => {
    const getRoleBadgeColor = (role) => {
      switch (role) {
        case 'admin': return 'bg-purple-100 text-purple-700';
        case 'landlord': return 'bg-blue-100 text-blue-700';
        case 'tenant': return 'bg-green-100 text-green-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <Card className="glass-effect" data-testid={`user-card-${user.user_id}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {user.full_name}
            </h3>
            <Badge className={getRoleBadgeColor(user.role)}>
              {user.role}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">{user.email}</p>
          {user.phone_number && (
            <p className="text-sm text-gray-600">{user.phone_number}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Joined: {new Date(user.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96" data-testid="loading-state">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div data-testid="admin-dashboard">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        {stats && activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.total_users}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Houses"
              value={stats.total_houses}
              icon={Home}
              color="bg-green-500"
            />
            <StatCard
              title="Pending Houses"
              value={stats.pending_houses}
              icon={Clock}
              color="bg-yellow-500"
            />
            <StatCard
              title="Total Bookings"
              value={stats.total_bookings}
              icon={CheckCircle}
              color="bg-indigo-500"
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          setSearchParams({ tab: val });
        }} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-houses">
              Pending Houses ({pendingHouses.length})
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              All Users ({users.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingHouses.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No pending houses for approval.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingHouses.slice(0, 3).map(house => (
                        <HouseCard key={house.house_id} house={house} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            {pendingHouses.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center">
                  <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No pending houses for approval.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingHouses.map(house => (
                  <HouseCard key={house.house_id} house={house} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <UserCard key={user.user_id} user={user} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;