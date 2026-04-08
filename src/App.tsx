import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, handleFirestoreError, OperationType, runTransaction, increment, isFirebaseConfigured } from './lib/firebase';
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { calculateDistance, formatDistance, KIGALI_HUBS, Location } from './lib/geo';
import ErrorBoundary from './components/ErrorBoundary';
import Map from './components/Map';
import { Bus, User, LogIn, LogOut, MapPin, Users, Navigation, CheckCircle2, AlertCircle, RefreshCcw, Map as MapIcon, Ticket as TicketIcon, Route as RouteIcon, Settings, QrCode, Calendar, Clock, CreditCard, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfile {
  uid: string;
  name: string;
  role: 'passenger' | 'driver' | 'admin';
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
  timestamp: any;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
  const [routes, setRoutes] = useState<any[]>([
    { id: 'R1', name: 'Nyabugogo - Kimironko', startHub: 'NYABUGOGO', endHub: 'KIMIRONKO', baseFare: 500 },
    { id: 'R2', name: 'Downtown - Remera', startHub: 'DOWNTOWN', endHub: 'REMERA', baseFare: 400 },
    { id: 'R3', name: 'Nyabugogo - Downtown', startHub: 'NYABUGOGO', endHub: 'DOWNTOWN', baseFare: 300 },
  ]);

  // Keep selected vehicle updated if its data changes in the vehicles list
  const activeSelectedVehicle = useMemo(() => {
    if (!selectedVehicle) return null;
    return vehicles.find(v => v.id === selectedVehicle.id) || selectedVehicle;
  }, [vehicles, selectedVehicle]);

  // Auth Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Mock user for demo mode
      setUser({
        uid: 'demo-user-123',
        displayName: 'Guest Passenger',
        email: 'guest@example.com',
        photoURL: null,
      } as any);
      setProfile({
        uid: 'demo-user-123',
        name: 'Guest Passenger',
        role: 'passenger'
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        try {
          // In a real app, we'd check if it exists first. For this demo, we'll auto-create.
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            role: 'passenger'
          };
          await setDoc(profileRef, newProfile, { merge: true });
          setProfile(newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'users');
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Vehicles Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Initial mock vehicles for demo mode
      const mockVehicles: Vehicle[] = [
        { id: 'RAA 123 A', type: 'bus', driverId: 'd1', location: KIGALI_HUBS.NYABUGOGO, totalSeats: 30, availableSeats: 12, destination: 'Musanze', status: 'active' },
        { id: 'RAB 456 B', type: 'minibus', driverId: 'd2', location: KIGALI_HUBS.KIMIRONKO, totalSeats: 18, availableSeats: 5, destination: 'Rubavu', status: 'active' },
        { id: 'RAC 789 C', type: 'taxi', driverId: 'd3', location: KIGALI_HUBS.REMERA, totalSeats: 4, availableSeats: 2, destination: 'Airport', status: 'active' },
        { id: 'RAD 012 D', type: 'bus', driverId: 'd4', location: KIGALI_HUBS.DOWNTOWN, totalSeats: 30, availableSeats: 0, destination: 'Nyamirambo', status: 'active' },
      ];
      setVehicles(mockVehicles);
      return;
    }

    const q = query(collection(db, 'vehicles'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehicleData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(vehicleData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });
    return () => unsubscribe();
  }, []);

  // Real-time Bookings Listener (for current user)
  useEffect(() => {
    if (!user) return;
    if (!isFirebaseConfigured) {
      const savedBookings = localStorage.getItem('demo_bookings');
      if (savedBookings) {
        setBookings(JSON.parse(savedBookings));
      }
      return;
    }

    const q = query(collection(db, 'bookings'), where('passengerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(bookingData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });
    return () => unsubscribe();
  }, [user]);

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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleBooking = async (vehicleId: string) => {
    if (!user) return;
    setIsBooking(true);
    setBookingStatus('loading');

    if (!isFirebaseConfigured) {
      // Local fallback booking
      setTimeout(() => {
        const newBooking: Booking = {
          id: `BK-${Math.random().toString(36).substr(2, 9)}`,
          passengerId: user.uid,
          vehicleId: vehicleId,
          seatCount: 1,
          status: 'confirmed',
          timestamp: new Date().toISOString()
        };
        
        const updatedBookings = [newBooking, ...bookings];
        setBookings(updatedBookings);
        localStorage.setItem('demo_bookings', JSON.stringify(updatedBookings));
        
        // Update local vehicle seats
        setVehicles(prev => prev.map(v => 
          v.id === vehicleId ? { ...v, availableSeats: Math.max(0, v.availableSeats - 1) } : v
        ));

        setBookingStatus('success');
        setViewingTicket(newBooking);
        setIsBooking(false);
        
        setTimeout(() => {
          setBookingStatus('idle');
          setSelectedVehicle(null);
        }, 3000);
      }, 1000);
      return;
    }

    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      const bookingRef = collection(db, 'bookings');

      await runTransaction(db, async (transaction) => {
        const vehicleDoc = await transaction.get(vehicleRef);
        if (!vehicleDoc.exists()) {
          throw new Error("Vehicle not found");
        }

        const vehicleData = vehicleDoc.data() as Vehicle;
        if (vehicleData.availableSeats <= 0) {
          throw new Error("No seats available");
        }

        // 1. Create Booking
        const newBookingDoc = doc(bookingRef);
        transaction.set(newBookingDoc, {
          passengerId: user.uid,
          vehicleId: vehicleId,
          seatCount: 1,
          status: 'confirmed',
          timestamp: Timestamp.now()
        });

        // 2. Decrement Available Seats
        transaction.update(vehicleRef, {
          availableSeats: increment(-1)
        });
      });

      setBookingStatus('success');
      // Show the ticket immediately after success
      const latestBooking = {
        id: 'NEW', // Temporary ID for immediate view
        passengerId: user.uid,
        vehicleId: vehicleId,
        seatCount: 1,
        status: 'confirmed' as const,
        timestamp: Timestamp.now()
      };
      setViewingTicket(latestBooking);
      
      setTimeout(() => {
        setBookingStatus('idle');
        setSelectedVehicle(null);
      }, 3000);
    } catch (error) {
      console.error("Booking failed", error);
      setBookingStatus('error');
      // Surface error to user
      if (error instanceof Error) {
        // We could use handleFirestoreError here if it was a permission issue, 
        // but this handles business logic errors too.
      }
    } finally {
      setIsBooking(false);
    }
  };

  // Driver Simulation: Update vehicle location and seats
  const simulateDriverUpdate = async () => {
    if (!user) return;
    const vehicleId = `RAA ${Math.floor(100 + Math.random() * 900)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    
    if (!isFirebaseConfigured) {
      const newVehicle: Vehicle = {
        id: vehicleId,
        type: 'bus',
        driverId: user.uid,
        location: { 
          lat: KIGALI_HUBS.NYABUGOGO.lat + (Math.random() - 0.5) * 0.01, 
          lng: KIGALI_HUBS.NYABUGOGO.lng + (Math.random() - 0.5) * 0.01 
        },
        totalSeats: 30,
        availableSeats: Math.floor(Math.random() * 30),
        destination: "Kigali - Musanze",
        status: 'active'
      };
      setVehicles(prev => [newVehicle, ...prev.filter(v => v.id !== vehicleId)]);
      return;
    }

    const vehicleRef = doc(db, 'vehicles', vehicleId);
    
    // Random movement near Nyabugogo
    const newLat = KIGALI_HUBS.NYABUGOGO.lat + (Math.random() - 0.5) * 0.01;
    const newLng = KIGALI_HUBS.NYABUGOGO.lng + (Math.random() - 0.5) * 0.01;

    try {
      await setDoc(vehicleRef, {
        id: vehicleId,
        type: 'bus',
        driverId: user.uid,
        location: { lat: newLat, lng: newLng },
        totalSeats: 30,
        availableSeats: Math.floor(Math.random() * 30),
        destination: "Kigali - Musanze",
        status: 'active',
        lastUpdated: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'vehicles');
    }
  };

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
              { id: 'tickets', icon: TicketIcon, label: 'Tickets' },
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
            {!isFirebaseConfigured && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                <AlertCircle className="w-3 h-3" />
                Demo Mode (Local)
              </div>
            )}
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
                            handleBooking(vehicle.id);
                          }}
                          disabled={isBooking || vehicle.availableSeats <= 0}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50"
                        >
                          {isBooking ? 'Processing...' : 'Book Seat Now'}
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
                          {!isFirebaseConfigured && (
                            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-amber-600 font-bold uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" />
                              Local Simulation Mode
                            </div>
                          )}
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
                            onClick={() => handleBooking(activeSelectedVehicle.id)}
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
                  <h2 className="text-2xl font-bold">My Tickets</h2>
                  <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{bookings.length} Active</span>
                </div>

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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle</p>
                      <p className="text-xl font-bold text-slate-900">{viewingTicket.vehicleId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seat</p>
                      <p className="text-xl font-bold text-blue-600">01 (Reserved)</p>
                    </div>
                  </div>

                  <div className="h-px bg-dashed border-t-2 border-dashed border-slate-100" />

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
      </div>
    </ErrorBoundary>
  );
}
