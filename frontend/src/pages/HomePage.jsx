import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HouseCard from '../components/HouseCard';
import { Search, MapPin, DollarSign, BedDouble, CheckCircle, Home as HomeIcon, CreditCard } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [houses, setHouses] = useState([]);
  const [featuredHouses, setFeaturedHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    num_rooms: '',
    min_price: '',
    max_price: ''
  });

  useEffect(() => {
    fetchHouses();
    fetchFeaturedHouses();
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

  const fetchFeaturedHouses = async () => {
    try {
      const response = await axios.get(`${API}/houses?status=available`);
      // Get first 6 houses as featured
      setFeaturedHouses(response.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch featured houses', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHouses();
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section with Full-Screen Background */}
      <section 
        className="relative bg-cover bg-center py-24 sm:py-32 lg:py-40"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1730620023453-b080a5bc1bbd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwzfHxldGhpb3BpYW4lMjBob3VzZXxlbnwwfHx8fDE3NjE5MTcwNDN8MA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Find Your Perfect Home in Woliso
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Discover the best rental properties in Woliso Town. Simple, secure, and hassle-free.
            </p>
          </div>

          {/* Search Filters */}
          <div className="glass-effect rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <Input
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    data-testid="filter-location"
                    className="border-gray-300"
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
                    className="border-gray-300"
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
                    className="border-gray-300"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" data-testid="search-btn">
                <Search className="w-4 h-4 mr-2" />
                Search Properties
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Search</h3>
                <p className="text-gray-600">Browse available properties with advanced filters</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HomeIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Book</h3>
                <p className="text-gray-600">Request a booking and wait for landlord approval</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Pay</h3>
                <p className="text-gray-600">Secure payment through Chapa gateway</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      {featuredHouses.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Featured Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHouses.map((house) => (
                <HouseCard key={house.house_id} house={house} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Available Properties Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Available Properties</h2>
        
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

      {/* Footer Section */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Woliso Rentals</h3>
              <p className="text-gray-400">Your trusted partner for finding the perfect home in Woliso.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-white">Home</a></li>
                <li><a href="/login" className="hover:text-white">Login</a></li>
                <li><a href="/register" className="hover:text-white">Register</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">Woliso Town, Ethiopia</p>
              <p className="text-gray-400">contact@woliso-rentals.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Woliso Rentals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;