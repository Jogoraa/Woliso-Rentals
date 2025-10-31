import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, DollarSign, Heart } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const HouseCard = ({ house, onSaveToggle }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(false);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    if (user?.role === 'tenant' && token) {
      checkIfSaved();
    }
  }, [house.house_id, user, token]);

  const checkIfSaved = async () => {
    try {
      setCheckingSaved(true);
      const response = await axios.get(`${API}/tenant/is-saved/${house.house_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(response.data.saved);
    } catch (error) {
      console.error('Failed to check if saved', error);
    } finally {
      setCheckingSaved(false);
    }
  };

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to save houses');
      return;
    }

    if (user.role !== 'tenant') {
      toast.error('Only tenants can save houses');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/tenant/save-house/${house.house_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSaved(response.data.saved);
      toast.success(response.data.message);
      if (onSaveToggle) onSaveToggle();
    } catch (error) {
      toast.error('Failed to update saved status');
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

  const defaultImage = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500';
  const imageUrl = house.photos && house.photos.length > 0 
    ? `${BACKEND_URL}${house.photos[0]}`
    : defaultImage;

  return (
    <Card 
      className="card-hover cursor-pointer overflow-hidden relative" 
      onClick={() => navigate(`/house/${house.house_id}`)}
      data-testid={`house-card-${house.house_id}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={house.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          onError={(e) => { e.target.src = defaultImage; }}
        />
        <Badge className={`absolute top-2 right-2 ${getStatusColor(house.status)}`}>
          {house.status.replace('_', ' ')}
        </Badge>
        
        {/* Save/Favorite Button */}
        {user?.role === 'tenant' && (
          <Button
            size="icon"
            variant="secondary"
            className={`absolute top-2 left-2 rounded-full ${isSaved ? 'bg-red-500 hover:bg-red-600' : 'bg-white/90 hover:bg-white'}`}
            onClick={handleSaveToggle}
            disabled={checkingSaved}
            data-testid="save-house-btn"
          >
            <Heart 
              className={`w-5 h-5 ${isSaved ? 'fill-white text-white' : 'text-gray-700'}`}
            />
          </Button>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2" data-testid="house-title">{house.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{house.description}</p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
            <span>{house.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <BedDouble className="w-4 h-4 mr-2 text-indigo-600" />
            <span>{house.num_rooms} Rooms</span>
          </div>
          <div className="flex items-center text-lg font-bold text-indigo-600">
            <DollarSign className="w-5 h-5" />
            <span data-testid="house-price">{house.price_per_month}/month</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full"
          data-testid="view-details-btn"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HouseCard;