import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, MapPin } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TenantDashboard = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

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
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-state">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" data-testid="tenant-dashboard">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Booking Requests</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({filterBookings('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({filterBookings('approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({filterBookings('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
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

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBookings('pending').map(booking => (
                <BookingCard key={booking.booking_id} booking={booking} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBookings('approved').map(booking => (
                <BookingCard key={booking.booking_id} booking={booking} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBookings('rejected').map(booking => (
                <BookingCard key={booking.booking_id} booking={booking} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;