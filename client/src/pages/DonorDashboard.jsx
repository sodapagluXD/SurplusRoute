import ImpactBanner from '../components/ImpactBanner';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Sparkles,
  MapPin,
  LogOut,
  CheckCircle2,
  Clock,
  Scale,
  Package,
  Loader2,
  Utensils,
} from 'lucide-react';
import api from '../api/axios';
import BrandLogo from '../components/BrandLogo';

export default function DonorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('surplusUser'));

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [rawDescription, setRawDescription] = useState('');
  const [coords, setCoords] = useState({ longitude: 88.3639, latitude: 22.5726 });

  const [analyzing, setAnalyzing] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [myDonations, setMyDonations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'Donor') {
      navigate('/');
      return;
    }

    // Grab current GPS coordinates silently on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            longitude: Number(pos.coords.longitude.toFixed(6)),
            latitude: Number(pos.coords.latitude.toFixed(6)),
          });
        },
        () => {} // Keep Kolkata fallback if blocked
      );
    }

    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      const { data } = await api.get('/donations/my-donations');
      setMyDonations(data);
    } catch (err) {
      console.error('Failed to load donation history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setLatestResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please select or drop a photo of the surplus food.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('foodImage', imageFile);
      formData.append('rawDescription', rawDescription);
      formData.append('longitude', coords.longitude);
      formData.append('latitude', coords.latitude);

      const { data } = await api.post('/donations/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLatestResult(data);
      setMyDonations((prev) => [data, ...prev]);

      // Reset form inputs
      setImageFile(null);
      setPreviewUrl('');
      setRawDescription('');
    } catch (err) {
      setError(err.response?.data?.message || 'AI analysis failed. Check server logs.');
    } finally {
      setAnalyzing(false);
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
           <BrandLogo badge="Donor Hub" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:inline">
              Welcome, <strong className="text-slate-200">{user?.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <ImpactBanner refreshTrigger="{myDonations.length}"/>
        {/* Upload & AI Result Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Upload Form */}
          <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Post Surplus Food</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Snap a photo—Gemini AI will automatically estimate weight, freshness, and dietary tags.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <MapPin className="w-3.5 h-3.5" />
                {coords.latitude}, {coords.longitude}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Drag & Drop / File Input Zone */}
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center transition bg-slate-950/50 relative overflow-hidden">
                  {previewUrl ? (
                    <div className="space-y-3">
                      <img
                        src={previewUrl}
                        alt="Food preview"
                        className="max-h-56 mx-auto rounded-xl object-cover border border-slate-800"
                      />
                      <p className="text-xs text-emerald-400">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-emerald-400">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-200">
                        Click to upload a food photo
                      </p>
                      <p className="text-xs text-slate-500">JPG, PNG, or WEBP up to 10MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Additional Context (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g., 15 boxes of veg pulao and paneer from an afternoon corporate event, packed 30 mins ago."
                  value={rawDescription}
                  onChange={(e) => setRawDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Food with Gemini Vision...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze & Broadcast to Nearby NGOs
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Live AI Analysis Card */}
          <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4" /> Gemini 3.8 Flash Inspection
              </div>

              {latestResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Condition Status</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        latestResult.aiStructuredData.condition === 'Fresh'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : latestResult.aiStructuredData.condition === 'Needs Immediate Pickup'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {latestResult.aiStructuredData.condition}
                    </span>
                  </div>

                  {/* Detected Food Items */}
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
                    <span className="text-xs text-slate-400 block">Detected Items & Est. Weight</span>
                    {latestResult.aiStructuredData.foodItems?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5" /> {item.estimatedWeightKg} kg
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Packaging */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <Package className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">Packaging Detected</span>
                      <span className="text-xs text-slate-200">
                        {latestResult.aiStructuredData.packaging}
                      </span>
                    </div>
                  </div>

                  {/* Dietary Tags */}
                  <div>
                    <span className="text-xs text-slate-400 block mb-2">Dietary & Safety Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {latestResult.aiStructuredData.dietaryTags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-xl p-6 text-slate-500">
                  <Sparkles className="w-8 h-8 mb-2 text-slate-700" />
                  <p className="text-sm font-medium text-slate-400">Awaiting Food Upload</p>
                  <p className="text-xs mt-1">
                    Upload a food image on the left to see structured JSON nutritional & safety telemetry here.
                  </p>
                </div>
              )}
            </div>

            {latestResult && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Live on the NGO geospatial feed!
              </div>
            )}
          </div>
        </div>

        {/* Donation History Grid */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-4">Your Active & Past Donations</h3>

          {loadingHistory ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your listings...
            </div>
          ) : myDonations.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
              You haven&apos;t posted any food donations yet. Upload your first batch above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDonations.map((donation) => (
                <div
                  key={donation._id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 bg-slate-950">
                    <img
                      src={donation.imageUrl}
                      alt="Donation"
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${
                        donation.status === 'Available'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : donation.status === 'Claimed'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700/70 text-slate-300'
                      }`}
                    >
                      {donation.status}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white text-sm">
                          {donation.aiStructuredData?.foodItems
                            ?.map((f) => `${f.name} (${f.estimatedWeightKg}kg)`)
                            .join(', ') || 'Surplus Food'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {donation.rawDescription || donation.aiStructuredData?.packaging}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(donation.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {donation.claimedBy ? (
                        <span className="text-amber-400 font-medium">
                          Claimed by {donation.claimedBy.name}
                        </span>
                      ) : (
                        <span>Awaiting NGO pickup</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}