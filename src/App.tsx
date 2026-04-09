import React, { useState, useEffect, useMemo } from 'react';
import { calculateDistance, formatDistance, KIGALI_HUBS, Location } from './lib/geo';
import ErrorBoundary from './components/ErrorBoundary';
import Map from './components/Map';
import { Bus, User, LogIn, LogOut, MapPin, Users, Navigation, CheckCircle2, AlertCircle, RefreshCcw, Map as MapIcon, Ticket as TicketIcon, Route as RouteIcon, Settings, QrCode, Calendar, Clock, CreditCard, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UserProfile {
  uid: string;
  name: string;
  role: 'passenger' | 'driver' | 'admin' | 'agent';
}

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}

interface Vehicle {
  id: string;
  type: 'bus' | 'minibus' | 'taxi';
  driverId: string;
  location: Location;
  totalSeats: number;
  availableSeats: number;
  destination: string;
  status: 'active' | 'inactive';
}

interface Booking {
  id: string;
  passengerId: string;
  vehicleId: string;
  seatCount: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  bookingPlace: string;
  destination: string;
  timestamp: any;
}

function AuthScreen({ onLogin, mode, setMode, role, setRole }: { 
  onLogin: () => void, 
  mode: 'login' | 'signup', 
  setMode: (m: 'login' | 'signup') => void,
  role: 'passenger' | 'agent',
  setRole: (r: 'passenger' | 'agent') => void
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="bg-blue-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <Bus className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SmartTransport</h1>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-widest mt-1">Rwanda Transit System</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Select Your Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setRole('passenger')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === 'passenger' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-bold">Passenger</span>
                  </button>
                  <button 
                    onClick={() => setRole('agent')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === 'agent' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Users className="w-6 h-6" />
                    <span className="text-xs font-bold">Agent</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={onLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-white px-4 text-slate-400">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={onLogin}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Account
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-blue-600 font-bold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function PaymentModal({ isOpen, onClose, onConfirm, vehicleId, fare }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void,
  vehicleId: string | null,
  fare: number
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Payment Required</h3>
          <p className="text-blue-100 text-xs mt-1">Confirm your transfer to finalize booking</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Vehicle</span>
              <span className="font-bold">{vehicleId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Fare</span>
              <span className="font-bold text-blue-600">{fare} RWF</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex justify-between text-base">
              <span className="font-bold">Total</span>
              <span className="font-bold text-blue-600">{fare} RWF</span>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Confirm Transfer
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 py-3.5 rounded-2xl font-bold text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<'passenger' | 'agent'>('passenger');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userLocation, setUserLocation] = useState<Location>(KIGALI_HUBS.DOWNTOWN);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'tickets' | 'routes' | 'profile'>('map');
  const [viewingTicket, setViewingTicket] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bus' | 'minibus' | 'taxi'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingVehicleId, setPendingVehicleId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);

  // Fetch Routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch('/api/routes');
        const data = await res.json();
        setRoutes(data);
      } catch (error) {
        console.error("Failed to fetch routes", error);
      }
    };
    fetchRoutes();
  }, []);

  // Keep selected vehicle updated if its data changes in the vehicles list
  const activeSelectedVehicle = useMemo(() => {
    if (!selectedVehicle) return null;
    return vehicles.find(v => v.id === selectedVehicle.id) || selectedVehicle;
  }, [vehicles, selectedVehicle]);

  // Auth Listener
  useEffect(() => {
    const savedUser = localStorage.getItem('demo_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed.user);
      setProfile(parsed.profile);
    }
    setIsAuthLoading(false);
  }, []);

  // Real-time Vehicles Listener (Polling for SQL)
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        setVehicles(data);
      } catch (error) {
        console.error("Failed to fetch vehicles", error);
      }
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Bookings Listener (Polling for SQL)
  useEffect(() => {
    if (!user || !profile) return;
    
    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?passengerId=${user.uid}&role=${profile.role}`);
        const data = await res.json();
        setBookings(data);
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      }
    };

    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [user, profile]);

  // GPS Simulation (User Location)
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      });
    }
  }, []);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           v.destination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || v.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [vehicles, searchQuery, filterType]);

  // Recommendation Logic: Find nearest vehicle with available seats
  const recommendedVehicle = useMemo(() => {
    if (filteredVehicles.length === 0) return null;
    
    return filteredVehicles
      .filter(v => v.availableSeats > 0)
      .map(v => ({
        ...v,
        distance: calculateDistance(userLocation, v.location)
      }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [filteredVehicles, userLocation]);

  const handleLogin = async () => {
    const mockUser = {
      uid: 'user-' + Math.random().toString(36).substr(2, 5),
      displayName: 'Demo User',
      email: 'demo@example.com',
    };
    const mockProfile: UserProfile = {
      uid: mockUser.uid,
      name: mockUser.displayName,
      role: selectedRole as any
    };

    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockProfile)
      });
      
      setUser(mockUser as any);
      setProfile(mockProfile);
      localStorage.setItem('demo_user', JSON.stringify({ user: mockUser, profile: mockProfile }));
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('demo_user');
  };

  const initiateBooking = (vehicleId: string) => {
    if (!user) return;
    
    // Single booking at a time check
    const hasActiveBooking = bookings.some(b => b.status === 'confirmed');
    if (hasActiveBooking) {
      alert("You already have an active booking. Please complete or cancel it first.");
      return;
    }

    setPendingVehicleId(vehicleId);
    setShowPaymentModal(true);
  };

  const handleBooking = async (vehicleId: string) => {
    if (!user) return;
    
    setIsBooking(true);
    setBookingStatus('loading');
    setShowPaymentModal(false);

    const vehicle = vehicles.find(v => v.id === vehicleId);
    const bookingPlace = "Current Location"; // In a real app, reverse geocode userLocation
    const destination = vehicle?.destination || "Unknown";

    const newBooking: Booking = {
      id: `BK-${Math.random().toString(36).substr(2, 9)}`,
      passengerId: user.uid,
      vehicleId: vehicleId,
      seatCount: 1,
      status: 'confirmed',
      bookingPlace,
      destination,
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });

      if (!res.ok) throw new Error("Booking failed");

      setBookingStatus('success');
      setViewingTicket(newBooking);
      
      setTimeout(() => {
        setBookingStatus('idle');
        setSelectedVehicle(null);
      }, 3000);
    } catch (error) {
      console.error("Booking failed", error);
      setBookingStatus('error');
    } finally {
      setIsBooking(false);
    }
  };

  // Driver Simulation: Update vehicle location and seats
  const simulateDriverUpdate = async () => {
    if (!user) return;
    const vehicleId = `RAA ${Math.floor(100 + Math.random() * 900)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    
    // Random movement near Nyabugogo
    const newLat = KIGALI_HUBS.NYABUGOGO.lat + (Math.random() - 0.5) * 0.01;
    const newLng = KIGALI_HUBS.NYABUGOGO.lng + (Math.random() - 0.5) * 0.01;

    // This is a mock update, in a real app we'd have a dedicated driver API
    console.log("Simulating driver update for", vehicleId);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen 
        onLogin={handleLogin} 
        mode={authMode} 
        setMode={setAuthMode}
        role={selectedRole}
        setRole={setSelectedRole}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">SmartTransport</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">RWANDA REAL-TIME</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'map', icon: MapIcon, label: 'Map' },
              { id: 'tickets', icon: TicketIcon, label: profile?.role === 'agent' ? 'All Bookings' : 'My Tickets' },
              { id: 'routes', icon: RouteIcon, label: 'Routes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{profile?.role}</p>
                </div>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`p-2 rounded-full transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-400">Guest Passenger</p>
                </div>
                <button 
                  onClick={handleLogin}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 pb-24 md:pb-6">
          {/* Onboarding / Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {profile?.name}!
            </h2>
            <p className="text-slate-500 mt-1">
              {profile?.role === 'agent' 
                ? 'System Overview: Monitor all active vehicles and passenger bookings across Kigali.'
                : 'Ready to travel? Find the nearest bus and book your seat in one tap.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'map' && (
              <motion.div 
                key="map-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col lg:flex-row gap-0 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 h-[calc(100vh-180px)] min-h-[600px]"
              >
                {/* Left Sidebar: Search & List */}
                <div className="w-full lg:w-[400px] flex flex-col border-r border-slate-100 bg-slate-50/30">
                  {/* Search Bar */}
                  <div className="p-6 pb-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Search plate or destination..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="px-6 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900">Nearby Vehicles</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{filteredVehicles.length} Found</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'bus', label: 'Buses' },
                        { id: 'minibus', label: 'Minibuses' },
                        { id: 'taxi', label: 'Taxis' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilterType(f.id as any)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            filterType === f.id 
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle List */}
                  <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
                    {filteredVehicles.map((vehicle) => (
                      <motion.div 
                        key={vehicle.id}
                        layoutId={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                          activeSelectedVehicle?.id === vehicle.id 
                            ? 'border-blue-500 bg-blue-50/50' 
                            : 'border-white bg-white shadow-sm hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${
                              activeSelectedVehicle?.id === vehicle.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <Bus className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{vehicle.id}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vehicle.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              vehicle.availableSeats > 5 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {vehicle.availableSeats} SEATS
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Navigation className="w-3 h-3 text-slate-400" />
                            <span>{vehicle.destination}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{formatDistance(calculateDistance(userLocation, vehicle.location))} away</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateBooking(vehicle.id);
                          }}
                          disabled={vehicle.availableSeats <= 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                        >
                          Book Seat Now
                        </button>
                      </motion.div>
                    ))}
                    
                    {filteredVehicles.length === 0 && (
                      <div className="text-center py-12">
                        <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Search className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No vehicles found</p>
                      </div>
                    )}
                  </div>

                  {/* Smart Recommendation Footer */}
                  {recommendedVehicle && (
                    <div className="p-6 bg-white border-t border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                          <RefreshCcw className="w-4 h-4 animate-spin-slow" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-900 mb-1">Smart Recommendation</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            We prioritize vehicles with available seats and proximity to your current location.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Map */}
                <div className="flex-1 relative">
                  <Map 
                    userLocation={userLocation} 
                    vehicles={vehicles} 
                    onVehicleClick={setSelectedVehicle} 
                  />
                  
                  {/* Floating Selection Details (Mobile/Small screens overlay) */}
                  <AnimatePresence>
                    {activeSelectedVehicle && (
                      <motion.div 
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="absolute bottom-6 left-6 right-6 lg:hidden z-30"
                      >
                        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold">Vehicle Details</h3>
                            <button onClick={() => setSelectedVehicle(null)} className="text-slate-400">✕</button>
                          </div>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="bg-blue-600 p-3 rounded-2xl text-white">
                              <Bus className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-lg font-bold">{activeSelectedVehicle.id}</p>
                              <p className="text-xs text-slate-500">{activeSelectedVehicle.destination}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => initiateBooking(activeSelectedVehicle.id)}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold"
                          >
                            Confirm Booking
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'tickets' && (
              <motion.div 
                key="tickets-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">{profile?.role === 'agent' ? 'Global Bookings' : 'My Tickets'}</h2>
                  <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{bookings.length} {profile?.role === 'agent' ? 'Total' : 'Active'}</span>
                </div>

                {profile?.role === 'agent' && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-medium mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>Agent View: You are seeing all bookings made across the system.</span>
                  </div>
                )}

                {bookings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {bookings.map(booking => (
                      <motion.div 
                        key={booking.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setViewingTicket(booking)}
                        className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <TicketIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{booking.vehicleId}</p>
                            <p className="text-lg font-bold">1 Seat Reserved</p>
                            <p className="text-xs text-slate-500">{booking.timestamp?.toDate ? booking.timestamp.toDate().toLocaleString() : 'Just now'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Confirmed</span>
                          </div>
                          <span className="text-xs text-blue-600 font-bold group-hover:underline">View Details →</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TicketIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No active tickets</h3>
                    <p className="text-slate-500 mb-8">Book a seat from the map to see your tickets here.</p>
                    <button 
                      onClick={() => setActiveTab('map')}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
                    >
                      Find a Vehicle
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'routes' && (
              <motion.div 
                key="routes-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6">Transport Routes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {routes.map(route => (
                    <div key={route.id} className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <RouteIcon className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">{route.baseFare} RWF</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{route.name}</h3>
                      <div className="flex items-center gap-3 text-slate-500 text-sm mb-4">
                        <span className="font-medium">{route.startHub}</span>
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="font-medium">{route.endHub}</span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('map')}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition-colors"
                      >
                        Check Live Vehicles
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto space-y-6"
              >
                <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-200 text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-12 h-12 text-blue-600" />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold">{user?.displayName}</h2>
                  <p className="text-slate-500 mb-6">{user?.email}</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-left">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Account Type</p>
                        <p className="font-bold capitalize">{profile?.role}</p>
                      </div>
                      <Settings className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-left">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Trips</p>
                        <p className="font-bold">{bookings.length}</p>
                      </div>
                      <Bus className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="mt-8 w-full flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-50 py-3 rounded-2xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>

                {/* Simulation Panel (Moved to profile for cleaner UI) */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Developer Controls</h3>
                    <button 
                      onClick={() => setIsDriverMode(!isDriverMode)}
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${isDriverMode ? 'bg-green-500' : 'bg-slate-700'}`}
                    >
                      {isDriverMode ? 'Driver Mode' : 'Passenger Mode'}
                    </button>
                  </div>
                  {isDriverMode ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Simulate an IoT device sending GPS updates and seat counts.</p>
                      <button 
                        onClick={simulateDriverUpdate}
                        className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Send GPS Update
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400">Simulate moving your location to test the recommendation engine.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(KIGALI_HUBS).map(([key, hub]) => (
                          <button 
                            key={key}
                            onClick={() => setUserLocation({ lat: hub.lat, lng: hub.lng })}
                            className="bg-slate-800 hover:bg-slate-700 p-2 rounded text-[10px] font-bold transition-colors"
                          >
                            {hub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          {[
            { id: 'map', icon: MapIcon, label: 'Map' },
            { id: 'tickets', icon: TicketIcon, label: 'Tickets' },
            { id: 'routes', icon: RouteIcon, label: 'Routes' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Ticket Details Modal */}
        <AnimatePresence>
          {viewingTicket && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewingTicket(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                {/* Ticket Header */}
                <div className="bg-blue-600 p-8 text-white text-center relative">
                  <div className="absolute top-4 right-4">
                    <button onClick={() => setViewingTicket(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">✕</button>
                  </div>
                  <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                    <Bus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Boarding Pass</h3>
                  <p className="text-blue-100 text-sm opacity-80">SmartTransport Rwanda</p>
                </div>

                {/* Ticket Body */}
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle</p>
                      <p className="text-lg font-bold text-slate-900">{viewingTicket.vehicleId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Seat</p>
                      <p className="text-lg font-bold text-blue-600">01 (Reserved)</p>
                    </div>
                  </div>

                  <div className="h-px bg-dashed border-t-2 border-dashed border-slate-100" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</p>
                        <p className="text-sm font-bold text-slate-900">{viewingTicket.bookingPlace}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</p>
                        <p className="text-sm font-bold text-slate-900">{viewingTicket.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                        <p className="text-sm font-bold">Apr 06, 2026</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Time</p>
                        <p className="text-sm font-bold">Real-Time</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                        <p className="text-sm font-bold text-green-600">Paid & Confirmed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">500 RWF</p>
                    </div>
                  </div>

                  {/* QR Code Simulation */}
                  <div className="flex flex-col items-center pt-4">
                    <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-inner mb-4">
                      <QrCode className="w-32 h-32 text-slate-900" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Scan at Boarding</p>
                  </div>
                </div>

                {/* Ticket Footer */}
                <div className="px-8 pb-8">
                  <button 
                    onClick={() => setViewingTicket(null)}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Close Ticket
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <PaymentModal 
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              onConfirm={() => pendingVehicleId && handleBooking(pendingVehicleId)}
              vehicleId={pendingVehicleId}
              fare={(() => {
                const vehicle = vehicles.find(v => v.id === pendingVehicleId);
                if (!vehicle) return 500;
                const route = routes.find(r => 
                  vehicle.destination.toLowerCase().includes(r.endHub.toLowerCase()) || 
                  r.name.toLowerCase().includes(vehicle.destination.toLowerCase())
                );
                return route ? route.baseFare : 500;
              })()}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
