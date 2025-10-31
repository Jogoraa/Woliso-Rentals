import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, MapPin, CreditCard, Heart } from 'lucide-react';
import HouseCard from '../components/HouseCard';
import { useSearchParams } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TenantDashboard = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [savedHouses, setSavedHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    fetchBookings();
    fetchSavedHouses();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedHouses = async () => {
    try {
      const response = await axios.get(`${API}/tenant/saved-houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedHouses(response.data);
    } catch (error) {
      console.error('Failed to fetch saved houses', error);
    }
  };

  const handleProceedToPayment = async (bookingId) => {
    try {
      const response = await axios.post(
        `${API}/payment/initialize`,
        { booking_id: bookingId, amount: 500, currency: 'ETB' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Redirect to Chapa checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initialize payment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filterBookings = (status) => {
    return bookings.filter(b => b.status === status);
  };

  const BookingCard = ({ booking }) => {
    const [houseDetails, setHouseDetails] = useState(null);

    useEffect(() => {
      const fetchHouse = async () => {
        try {
          const response = await axios.get(`${API}/houses/${booking.house_id}`);
          setHouseDetails(response.data);
        } catch (error) {
          console.error('Failed to fetch house details');
        }
      };
      fetchHouse();
    }, [booking.house_id]);

    return (
      <Card className="glass-effect" data-testid={`booking-card-${booking.booking_id}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(booking.status)}
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(booking.requested_at).toLocaleDateString()}
            </span>
          </div>

          {houseDetails && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {houseDetails.title}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                {houseDetails.location}
              </div>
              <p className="text-lg font-bold text-indigo-600 mb-2">
                ${houseDetails.price_per_month}/month
              </p>
            </>
          )}

          {booking.message && (
            <div className="mt-3 p-2 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Your message:</p>
              <p className="text-sm text-gray-800">{booking.message}</p>
            </div>
          )}

          {booking.status === 'approved' && !booking.deposit_paid && (
            <Button
              className="w-full mt-3 bg-green-600 hover:bg-green-700"
              onClick={() => handleProceedToPayment(booking.booking_id)}
              data-testid="proceed-to-payment-btn"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment (500 ETB)
            </Button>
          )}

          {booking.deposit_paid && (
            <div className="mt-3 p-2 bg-green-50 rounded text-center">
              <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
              <span className="text-sm text-green-700 font-medium">Deposit Paid</span>
            </div>
          )}
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
      <div data-testid="tenant-dashboard">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Tenant Dashboard</h1>

        {/* Overview Cards */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-total-requests">{bookings.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Saved Houses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="stat-saved-houses">{savedHouses.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600" data-testid="stat-approved">
                  {filterBookings('approved').length}
                </div>
              </CardContent>
            </Card>
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
            <TabsTrigger value="saved" data-testid="tab-saved">
              Saved Houses ({savedHouses.length})
            </TabsTrigger>
            <TabsTrigger value="requests" data-testid="tab-requests">
              My Requests ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Booking Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No booking requests yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookings.slice(0, 3).map(booking => (
                        <BookingCard key={booking.booking_id} booking={booking} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            {savedHouses.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center">
                  <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No saved houses yet. Start exploring properties!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedHouses.map(house => (
                  <HouseCard key={house.house_id} house={house} onSaveToggle={fetchSavedHouses} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {bookings.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">No booking requests yet. Start exploring properties!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map(booking => (
                  <BookingCard key={booking.booking_id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TenantDashboard;