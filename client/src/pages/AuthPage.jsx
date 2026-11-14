
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  HeartHandshake,
  Sparkles,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  Scale,
  Leaf,
  Loader2,
  CheckCircle2,
  Phone,
  Building2,
  UserCheck,
  Radio,
} from 'lucide-react';
import api from '../api/axios';

const WORKFLOW_STEPS = [
  {
    id: 'scan',
    step: '01',
    title: 'Gemini Vision Inspection',
    badge: 'Multimodal AI',
    description:
      'Donors snap a photo of surplus trays. Gemini Flash automatically estimates weight in kg, freshness condition, packaging type, and dietary tags.',
    sample: {
      item: 'Paneer Pulao & Dal Makhani',
      weight: '6.5 kg (~16 meals)',
      status: 'Fresh • Sealed Foil Trays',
    },
  },
  {
    id: 'match',
    step: '02',
    title: '2dsphere Geospatial Matching',
    badge: 'Live Radius Radar',
    description:
      'MongoDB geospatial indexing broadcasts the verified batch strictly to verified NGOs operating within a 5 km to 50 km pickup radius.',
    sample: {
      item: '3 NGOs Alerted Nearby',
      weight: '1.8 km away',
      status: 'Avg. Claim Time: < 4 mins',
    },
  },
  {
    id: 'dispatch',
    step: '03',
    title: 'One-Click Claim & Route',
    badge: 'Zero-Wait Dispatch',
    description:
      'NGOs lock in the rescue on the live map, unlock direct donor phone contact, and launch turn-by-turn navigation before food spoils.',
    sample: {
      item: 'Pickup Confirmed',
      weight: '16.2 kg CO2e Offset',
      status: 'Chain of Custody Logged',
    },
  },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    containerRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    containerRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('Donor'); // 'Donor' | 'NGO'
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ longitude: 88.3639, latitude: 22.5726 });
  const [gpsStatus, setGpsStatus] = useState('default'); // 'default' | 'locating' | 'locked'

  // Live stats & UI states
  const [stats, setStats] = useState({
    totalWeightKg: 0,
    mealsServed: 0,
    co2SavedKg: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const existingUser = JSON.parse(localStorage.getItem('surplusUser'));
    if (existingUser?.token) {
      navigate(existingUser.role === 'NGO' ? '/ngo' : '/donor');
      return;
    }

    // Fetch live platform impact metrics for the landing showcase
    const loadStats = async () => {
      try {
        const { data } = await api.get('/donations/stats');
        setStats(data);
      } catch {
        // Keep 0 fallback if backend is waking up
      }
    };
    loadStats();
  }, [navigate]);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          longitude: Number(pos.coords.longitude.toFixed(6)),
          latitude: Number(pos.coords.latitude.toFixed(6)),
        });
        setGpsStatus('locked');
      },
      () => {
        setGpsStatus('default');
        setError('Location permission blocked—using default Kolkata coordinates.');
      }
    );
  };

  const fillDemoAccount = (demoRole) => {
    setIsLogin(true);
    setError('');
    if (demoRole === 'Donor') {
      setEmail('donor@iem.edu');
      setPassword('password123');
    } else {
      setEmail('test@iem.edu');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email, password }
        : {
            name,
            email,
            password,
            role,
            contactNumber,
            address,
            longitude: coords.longitude,
            latitude: coords.latitude,
            location: {
              type: 'Point',
              coordinates: [coords.longitude, coords.latitude],
            },
          };

      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('surplusUser', JSON.stringify(data));
      navigate(data.role === 'NGO' ? '/ngo' : '/donor');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Authentication failed. If the Render server was asleep, wait 15s and retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  const currentStep = WORKFLOW_STEPS[activeStep];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-10"
    >
      {/* Interactive Cursor-Following Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(650px circle at var(--mouse-x, 50%) var(--mouse-y, 35%), rgba(16, 185, 129, 0.15), rgba(20, 184, 166, 0.06) 40%, transparent 75%)',
        }}
      />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* LEFT COLUMN: Interactive Mission & Live Telemetry Showcase */}
        <div className="lg:col-span-6 space-y-7">
          {/* Brand Pill */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            AI-Powered Surplus Food Rescue Grid
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
                <Utensils className="w-6 h-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Surplus<span className="text-emerald-400">Route</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Real-time food redistribution connecting banquet halls, restaurants, and events with nearby NGOs using Gemini Vision triage and geospatial dispatch.
            </p>
          </div>

          {/* Interactive Workflow Stepper */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              {WORKFLOW_STEPS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                    activeStep === idx
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-mono mr-1.5 text-emerald-400">{item.step}</span>
                  <span className="hidden sm:inline">{item.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{currentStep.title}</h3>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {currentStep.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentStep.description}
              </p>

              {/* Simulated Live Telemetry Preview Box */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-200 font-semibold block">
                    {currentStep.sample.item}
                  </span>
                  <span className="text-slate-500 text-[11px]">{currentStep.sample.status}</span>
                </div>
                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {currentStep.sample.weight}
                </span>
              </div>
            </div>
          </div>

          {/* Live Platform Impact Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Scale className="w-3.5 h-3.5 text-emerald-400" /> Diverted
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.totalWeightKg} kg</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Utensils className="w-3.5 h-3.5 text-amber-400" /> Meals
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.mealsServed}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Leaf className="w-3.5 h-3.5 text-teal-400" /> CO2e Saved
              </div>
              <p className="text-xl font-bold text-white mt-1">{stats.co2SavedKg} kg</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Glassmorphic Login / Register Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/75 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  isLogin
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  !isLogin
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Quick Demo Autofill Bar */}
            {isLogin && (
              <div className="mb-5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Quick Judge Demo:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('Donor')}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition cursor-pointer"
                  >
                    Donor Login
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('NGO')}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition cursor-pointer"
                  >
                    NGO Login
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Interactive Role Cards (Register Mode) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-400">
                    Select Your Network Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('Donor')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        role === 'Donor'
                          ? 'bg-emerald-500/15 border-emerald-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Utensils className="w-4 h-4 text-emerald-400 mb-1.5" />
                      <div className="text-xs font-bold">Food Donor</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Restaurants, Hostels & Events
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('NGO')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        role === 'NGO'
                          ? 'bg-teal-500/15 border-teal-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <HeartHandshake className="w-4 h-4 text-teal-400 mb-1.5" />
                      <div className="text-xs font-bold">NGO Partner</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Shelters & Rescue Fleets
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Name (Register Mode) */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {role === 'Donor' ? 'Restaurant / Kitchen Name' : 'NGO / Organization Name'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={role === 'Donor' ? 'e.g., Salt Lake Banquet' : 'e.g., Hope Food Foundation'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@organization.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Password with Show/Hide Toggle */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Phone, Address & GPS Capture (Register Mode) */}
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Dispatch Phone
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Locality / Street Address
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Sector V, Salt Lake, Kolkata"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Interactive GPS Pin Capture */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        {gpsStatus === 'locked' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {gpsStatus === 'locked' ? 'Live GPS Locked' : 'Dispatch Coordinates'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                        {coords.latitude}, {coords.longitude}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={gpsStatus === 'locating'}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium transition cursor-pointer shrink-0"
                    >
                      {gpsStatus === 'locating' ? 'Locating...' : 'Use Current GPS'}
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/50 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isLogin ? 'Authenticating...' : 'Registering Partner...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Enter SurplusRoute' : `Join as ${role}`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}