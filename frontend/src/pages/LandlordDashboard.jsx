import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, Upload, X, CheckCircle, XCircle, Home, Eye, TrendingUp, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useSearchParams } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandlordDashboard = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [houses, setHouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddHouseDialog, setShowAddHouseDialog] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [newHouse, setNewHouse] = useState({
    title: '',
    description: '',
    location: '',
    price_per_month: '',
    num_rooms: '',
    photos: []
  });

  useEffect(() => {
    fetchHouses();
    fetchBookings();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const fetchHouses = async () => {
    try {
      const response = await axios.get(`${API}/my-houses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHouses(response.data);
    } catch (error) {
      toast.error('Failed to fetch houses');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/landlord/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploadingImages(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API}/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setNewHouse({ ...newHouse, photos: [...newHouse.photos, ...urls] });
      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddHouse = async () => {
    try {
      const response = await axios.post(
        `${API}/houses`,
        {
          title: newHouse.title,
          description: newHouse.description,
          location: newHouse.location,
          price_per_month: parseFloat(newHouse.price_per_month),
          num_rooms: parseInt(newHouse.num_rooms)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add photos if any
      if (newHouse.photos.length > 0) {
        await axios.post(
          `${API}/houses/${response.data.house_id}/photos`,
          newHouse.photos,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success('House added successfully! Waiting for admin approval.');
      setShowAddHouseDialog(false);
      setNewHouse({ title: '', description: '', location: '', price_per_month: '', num_rooms: '', photos: [] });
      fetchHouses();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add house');
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      await axios.put(
        `${API}/bookings/${bookingId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Booking ${status}`);
      fetchBookings();
      fetchHouses();
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'rented': return 'bg-red-100 text-red-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const BookingCard = ({ booking }) => {
    const [houseDetails, setHouseDetails] = useState(null);

    useEffect(() => {
      const fetchDetails = async () => {
        try {
          const houseRes = await axios.get(`${API}/houses/${booking.house_id}`);
          setHouseDetails(houseRes.data);
        } catch (error) {
          console.error('Failed to fetch details');
        }
      };
      fetchDetails();
    }, []);

    return (
      <Card className="glass-effect" data-testid={`booking-request-${booking.booking_id}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <Badge className={booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}>
              {booking.status}
            </Badge>
            <span className="text-xs text-gray-500">
              {new Date(booking.requested_at).toLocaleDateString()}
            </span>
          </div>

          {houseDetails && (
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {houseDetails.title}
            </h3>
          )}

          {booking.message && (
            <div className="mt-3 p-2 bg-gray-50 rounded mb-3">
              <p className="text-sm text-gray-600">Tenant's message:</p>
              <p className="text-sm text-gray-800">{booking.message}</p>
            </div>
          )}

          {booking.status === 'pending' && (
            <div className="flex space-x-2 mt-3">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleBookingAction(booking.booking_id, 'approved')}
                data-testid="approve-booking-btn"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => handleBookingAction(booking.booking_id, 'rejected')}
                data-testid="reject-booking-btn"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
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
      <div data-testid="landlord-dashboard">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Landlord Dashboard</h1>
          <Button onClick={() => setShowAddHouseDialog(true)} data-testid="add-house-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add New Property
          </Button>
        </div>

        {/* Analytics Cards */}
        {analytics && activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Properties</p>
                    <p className="text-3xl font-bold" data-testid="stat-total-properties">{analytics.total_properties}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Views</p>
                    <p className="text-3xl font-bold" data-testid="stat-total-views">{analytics.total_views}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <Eye className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                    <p className="text-3xl font-bold" data-testid="stat-pending-bookings">{analytics.pending_bookings}</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100">
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-green-600" data-testid="stat-total-revenue">${analytics.total_revenue}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
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
            <TabsTrigger value="properties" data-testid="tab-properties">
              My Listings ({houses.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">
              Booking Requests ({bookings.filter(b => b.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  {houses.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No properties yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {houses.slice(0, 3).map(house => (
                        <Card key={house.house_id} className="glass-effect">
                          <CardContent className="p-4">
                            <Badge className={getStatusColor(house.status)}>
                              {house.status.replace('_', ' ')}
                            </Badge>
                            <h3 className="text-lg font-semibold text-gray-800 mt-2 mb-1">
                              {house.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{house.location}</p>
                            <p className="text-lg font-bold text-indigo-600">
                              ${house.price_per_month}/month
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="properties">
            {houses.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center">
                  <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No properties yet. Add your first property!</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Property Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Rooms</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {houses.map(house => (
                          <TableRow key={house.house_id} data-testid={`house-row-${house.house_id}`}>
                            <TableCell className="font-medium">{house.title}</TableCell>
                            <TableCell>{house.location}</TableCell>
                            <TableCell>${house.price_per_month}</TableCell>
                            <TableCell>{house.num_rooms}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(house.status)}>
                                {house.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <Card className="glass-effect">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">No booking requests yet.</p>
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

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Total Properties</span>
                        <span className="font-bold text-lg">{analytics.total_properties}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Approved Bookings</span>
                        <span className="font-bold text-lg text-green-600">{analytics.approved_bookings}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-bold text-lg">
                          {analytics.total_views > 0 
                            ? ((analytics.approved_bookings / analytics.total_views) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-green-600">${analytics.total_revenue}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600 mb-1">Rented Properties</p>
                        <p className="font-bold">{houses.filter(h => h.status === 'rented').length}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600 mb-1">Available Properties</p>
                        <p className="font-bold">{houses.filter(h => h.status === 'available').length}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add House Dialog */}
      <Dialog open={showAddHouseDialog} onOpenChange={setShowAddHouseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-house-dialog">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Add details about your property. It will be reviewed by admin before going live.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Property Title</Label>
              <Input
                id="title"
                placeholder="e.g., Modern 2 Bedroom Apartment"
                value={newHouse.title}
                onChange={(e) => setNewHouse({ ...newHouse, title: e.target.value })}
                data-testid="input-title"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Downtown Woliso"
                value={newHouse.location}
                onChange={(e) => setNewHouse({ ...newHouse, location: e.target.value })}
                data-testid="input-location"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price per Month ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="500"
                  value={newHouse.price_per_month}
                  onChange={(e) => setNewHouse({ ...newHouse, price_per_month: e.target.value })}
                  data-testid="input-price"
                />
              </div>
              <div>
                <Label htmlFor="rooms">Number of Rooms</Label>
                <Input
                  id="rooms"
                  type="number"
                  placeholder="2"
                  value={newHouse.num_rooms}
                  onChange={(e) => setNewHouse({ ...newHouse, num_rooms: e.target.value })}
                  data-testid="input-rooms"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your property..."
                value={newHouse.description}
                onChange={(e) => setNewHouse({ ...newHouse, description: e.target.value })}
                rows={4}
                data-testid="input-description"
              />
            </div>
            <div>
              <Label>Photos</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload"
                  data-testid="input-photos"
                />
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" className="w-full" asChild disabled={uploadingImages}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImages ? 'Uploading...' : 'Upload Photos'}
                    </span>
                  </Button>
                </label>
              </div>
              {newHouse.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newHouse.photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={`${BACKEND_URL}${photo}`}
                        alt={`Upload ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <button
                        onClick={() => setNewHouse({
                          ...newHouse,
                          photos: newHouse.photos.filter((_, i) => i !== idx)
                        })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHouseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHouse} data-testid="submit-house-btn">
              Add Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default LandlordDashboard;