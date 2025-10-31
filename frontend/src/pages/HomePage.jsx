import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HouseCard from '../components/HouseCard';
import { Search, MapPin, DollarSign, BedDouble } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    num_rooms: '',
    min_price: '',
    max_price: ''
  });

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', 'available');
      
      if (filters.location) params.append('location', filters.location);
      if (filters.num_rooms) params.append('num_rooms', filters.num_rooms);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);

      const response = await axios.get(`${API}/houses?${params.toString()}`);
      setHouses(response.data);
    } catch (error) {
      console.error('Failed to fetch houses', error);
      toast.error('Failed to load houses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHouses();
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
              Find Your Perfect Home in Woliso
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the best rental properties in Woliso Town. Simple, secure, and hassle-free.
            </p>
          </div>

          {/* Search Filters */}
          <div className="glass-effect rounded-xl p-6 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <Input
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    data-testid="filter-location"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <BedDouble className="w-5 h-5 text-gray-500" />
                  <Select 
                    value={filters.num_rooms} 
                    onValueChange={(value) => setFilters({ ...filters, num_rooms: value })}
                  >
                    <SelectTrigger data-testid="filter-rooms">
                      <SelectValue placeholder="Rooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Room</SelectItem>
                      <SelectItem value="2">2 Rooms</SelectItem>
                      <SelectItem value="3">3 Rooms</SelectItem>
                      <SelectItem value="4">4+ Rooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={filters.min_price}
                    onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                    data-testid="filter-min-price"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={filters.max_price}
                    onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                    data-testid="filter-max-price"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" data-testid="search-btn">
                <Search className="w-4 h-4 mr-2" />
                Search Properties
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Houses Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Properties</h2>
        
        {loading ? (
          <div className="text-center py-12" data-testid="loading-state">
            <p className="text-gray-600">Loading properties...</p>
          </div>
        ) : houses.length === 0 ? (
          <div className="text-center py-12 glass-effect rounded-xl" data-testid="no-houses-state">
            <p className="text-gray-600 text-lg">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="houses-grid">
            {houses.map((house) => (
              <HouseCard key={house.house_id} house={house} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;