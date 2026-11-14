import ImpactBanner from '../components/ImpactBanner';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  MapPin,
  LogOut,
  Scale,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  RefreshCw,
  LayoutGrid,
  Map as MapIcon,
} from 'lucide-react';
import api from '../api/axios';
import DonationMap from '../components/DonationMap';

export default function NgoDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('surplusUser'));

  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' | 'claims'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [radiusKm, setRadiusKm] = useState(25);
  const [coords, setCoords] = useState({ longitude: 88.3639, latitude: 22.5726 });

  const [nearbyDonations, setNearbyDonations] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'NGO') {
      navigate('/');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const updated = {
            longitude: Number(pos.coords.longitude.toFixed(6)),
            latitude: Number(pos.coords.latitude.toFixed(6)),
          };
          setCoords(updated);
          fetchData(updated, radiusKm);
        },
        () => {
          fetchData(coords, radiusKm);
        }
      );
    } else {
      fetchData(coords, radiusKm);
    }
  }, []);

  const fetchData = async (currentCoords = coords, currentRadius = radiusKm) => {
    setLoading(true);
    setError('');
    try {
      const [nearbyRes, claimsRes] = await Promise.all([
        api.get('/donations/nearby', {
          params: {
            longitude: currentCoords.longitude,
            latitude: currentCoords.latitude,
            maxDistance: currentRadius * 1000,
          },
        }),
        api.get('/donations/my-claims'),
      ]);
      setNearbyDonations(nearbyRes.data);
      setMyClaims(claimsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch nearby food feed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadiusKm(newRadius);
    fetchData(coords, newRadius);
  };

  const handleClaim = async (donationId) => {
    setClaimingId(donationId);
    try {
      const { data } = await api.put(`/donations/${donationId}/claim`);
      setNearbyDonations((prev) => prev.filter((item) => item._id !== donationId));
      setMyClaims((prev) => [data, ...prev]);
      setActiveTab('claims');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not claim donation.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleMarkPickedUp = async (donationId) => {
    setClaimingId(donationId);
    try {
      await api.put(`/donations/${donationId}/pickup`);
      setMyClaims((prev) =>
        prev.map((item) => (item._id === donationId ? { ...item, status: 'PickedUp' } : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update pickup status.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('surplusUser');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">SurplusRoute</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                NGO Dispatch
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <ImpactBanner refreshTrigger="{myClaims.length}"/>
        {/* Controls & Tab Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('nearby')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'nearby'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nearby Available ({nearbyDonations.length})
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                activeTab === 'claims'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Claimed Rescues ({myClaims.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle (only on Nearby tab) */}
            {activeTab === 'nearby' && (
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    viewMode === 'grid'
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Cards
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    viewMode === 'map'
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" /> Live Map
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Radius:</span>
              <select
                value={radiusKm}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            <button
              onClick={() => fetchData(coords, radiusKm)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            Scanning geospatial radius for surplus food...
          </div>
        ) : activeTab === 'nearby' ? (
          viewMode === 'map' ? (
            <DonationMap
              donations={nearbyDonations}
              ngoCoords={coords}
              radiusKm={radiusKm}
              onClaim={handleClaim}
              claimingId={claimingId}
            />
          ) : nearbyDonations.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
              <p className="text-base font-medium text-slate-300">
                No unclaimed food within {radiusKm} km
              </p>
              <p className="text-xs text-slate-500">
                Try expanding your search radius above or switch to Live Map view.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyDonations.map((donation) => {
                const [lng, lat] = donation.location?.coordinates || [0, 0];
                const totalWeight = donation.aiStructuredData?.foodItems?.reduce(
                  (sum, item) => sum + (item.estimatedWeightKg || 0),
                  0
                );

                return (
                  <div
                    key={donation._id}
                    className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="relative h-48 bg-slate-950">
                        <img
                          src={donation.imageUrl}
                          alt="Surplus food"
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
                            donation.aiStructuredData?.condition === 'Fresh'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {donation.aiStructuredData?.condition || 'Verified'}
                        </span>

                        <span className="absolute bottom-3 right-3 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-950/85 text-emerald-400 border border-slate-800 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5" /> ~{totalWeight?.toFixed(1)} kg
                        </span>
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-white text-base">
                            {donation.aiStructuredData?.foodItems
                              ?.map((i) => i.name)
                              .join(', ') || 'Surplus Meal Batch'}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Donor:{' '}
                            <strong className="text-slate-200">
                              {donation.donorId?.name || 'Local Partner'}
                            </strong>
                          </p>
                        </div>

                        {donation.rawDescription && (
                          <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                            &ldquo;{donation.rawDescription}&rdquo;
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {donation.aiStructuredData?.dietaryTags?.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="text-xs text-slate-400 space-y-1 pt-1">
                          {donation.donorId?.address && (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              {donation.donorId.address}
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            Posted{' '}
                            {new Date(donation.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => handleClaim(donation._id)}
                        disabled={claimingId === donation._id}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        {claimingId === donation._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Claim Rescue
                          </>
                        )}
                      </button>

                      {lat !== 0 && lng !== 0 && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                          title="Open route in Google Maps"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : myClaims.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-sm text-slate-400">
            You haven&apos;t claimed any donations yet. Switch to &ldquo;Nearby Available&rdquo; to
            claim food batches.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myClaims.map((claim) => {
              const [lng, lat] = claim.location?.coordinates || [0, 0];
              return (
                <div
                  key={claim._id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start"
                >
                  <img
                    src={claim.imageUrl}
                    alt="Claimed food"
                    className="w-24 h-24 rounded-xl object-cover shrink-0 border border-slate-800"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-sm">
                        {claim.aiStructuredData?.foodItems?.map((f) => f.name).join(', ')}
                      </h4>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          claim.status === 'PickedUp'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>
                        Donor: <strong className="text-slate-200">{claim.donorId?.name}</strong>
                      </p>
                      {claim.donorId?.contactNumber && (
                        <p className="flex items-center gap-1.5 text-emerald-400">
                          <Phone className="w-3 h-3" /> {claim.donorId.contactNumber}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      {claim.status === 'Claimed' && (
                        <button
                          onClick={() => handleMarkPickedUp(claim._id)}
                          disabled={claimingId === claim._id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Pickup
                        </button>
                      )}
                      {lat !== 0 && lng !== 0 && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Navigate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}