import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, DollarSign } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const HouseCard = ({ house }) => {
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
      className="card-hover cursor-pointer overflow-hidden" 
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