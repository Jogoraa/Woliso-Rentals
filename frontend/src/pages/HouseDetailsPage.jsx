import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { MapPin, BedDouble, DollarSign, ArrowLeft, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HouseDetailsPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetchHouseDetails();
    fetchFeedbacks();
  }, [id]);

  const fetchHouseDetails = async () => {
    try {
      const response = await axios.get(`${API}/houses/${id}`);
      setHouse(response.data);
    } catch (error) {
      toast.error('Failed to load house details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(`${API}/houses/${id}/feedback`);
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Failed to fetch feedbacks', error);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to make a booking');
      navigate('/login');
      return;
    }

    if (user.role !== 'tenant') {
      toast.error('Only tenants can make booking requests');
      return;
    }

    try {
      await axios.post(
        `${API}/bookings`,
        { house_id: id, message: bookingMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Booking request sent successfully!');
      setShowBookingDialog(false);
      setBookingMessage('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send booking request');
    }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-state">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">House not found</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'rented': return 'bg-red-100 text-red-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen py-8" data-testid="house-details-page">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listings
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img
                src={house.photos && house.photos.length > 0 
                  ? `${BACKEND_URL}${house.photos[0]}` 
                  : defaultImage}
                alt={house.title}
                className="w-full h-96 object-cover"
                onError={(e) => { e.target.src = defaultImage; }}
              />
              <Badge className={`absolute top-4 right-4 ${getStatusColor(house.status)}`}>
                {house.status.replace('_', ' ')}
              </Badge>
            </div>

            {house.photos && house.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {house.photos.slice(1, 5).map((photo, idx) => (
                  <img
                    key={idx}
                    src={`${BACKEND_URL}${photo}`}
                    alt={`${house.title} ${idx + 2}`}
                    className="w-full h-24 object-cover rounded-lg"
                    onError={(e) => { e.target.src = defaultImage; }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <Card className="glass-effect">
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4" data-testid="house-title">
                  {house.title}
                </h1>

                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="ml-1 text-gray-700 font-semibold">{averageRating}</span>
                    <span className="ml-1 text-gray-500 text-sm">({feedbacks.length} reviews)</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-indigo-600" />
                    <span className="text-lg">{house.location}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <BedDouble className="w-5 h-5 mr-3 text-indigo-600" />
                    <span className="text-lg">{house.num_rooms} Rooms</span>
                  </div>
                  <div className="flex items-center text-indigo-600">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-2xl font-bold" data-testid="house-price">
                      {house.price_per_month}/month
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{house.description}</p>
                </div>

                {house.status === 'available' && (
                  <Button 
                    className="w-full" 
                    onClick={() => setShowBookingDialog(true)}
                    data-testid="request-booking-btn"
                  >
                    Request Booking
                  </Button>
                )}
                {house.status === 'rented' && (
                  <Button className="w-full" disabled>
                    Currently Rented
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feedback Section */}
        {feedbacks.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((feedback) => (
                <Card key={feedback.feedback_id} className="glass-effect">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < feedback.rating
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700">{feedback.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(feedback.submitted_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent data-testid="booking-dialog">
          <DialogHeader>
            <DialogTitle>Request Booking</DialogTitle>
            <DialogDescription>
              Send a booking request to the landlord for this property.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add a message to the landlord (optional)..."
              value={bookingMessage}
              onChange={(e) => setBookingMessage(e.target.value)}
              rows={4}
              data-testid="booking-message-input"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBookingDialog(false)}
              data-testid="cancel-booking-btn"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBooking}
              data-testid="confirm-booking-btn"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HouseDetailsPage;