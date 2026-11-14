import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Scale, Navigation, Sparkles, Loader2 } from 'lucide-react';

// Custom glowing marker for NGO's current base location
const ngoIcon = L.divIcon({
  className: 'custom-ngo-pin',
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background: #38bdf8;
      border: 3px solid #0f172a;
      border-radius: 9999px;
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.3);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Custom emerald pulse marker for available food donations
const createFoodIcon = (isUrgent) =>
  L.divIcon({
    className: 'custom-food-pin',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${isUrgent ? '#f59e0b' : '#10b981'};
        border: 3px solid #020617;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #020617;
        font-weight: 800;
        font-size: 12px;
        box-shadow: 0 0 14px ${isUrgent ? 'rgba(245, 158, 11, 0.65)' : 'rgba(16, 185, 129, 0.65)'};
      ">🍲</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

// Smoothly re-centers map when GPS coordinates update
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function DonationMap({
  donations,
  ngoCoords,
  radiusKm,
  onClaim,
  claimingId,
}) {
  const center = [ngoCoords.latitude, ngoCoords.longitude];

  // Filter out invalid [0, 0] coordinates
  const validDonations = donations.filter((d) => {
    const [lng, lat] = d.location?.coordinates || [0, 0];
    return lat !== 0 && lng !== 0;
  });

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-[540px] z-0">
      {/* Legend Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs space-y-1.5 shadow-lg">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
          Your NGO Base
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          Fresh Food Batch
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          Needs Immediate Pickup
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapRecenter center={center} />

        {/* Keyless OpenStreetMap Tiles (styled dark via CSS) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* NGO Search Radius Circle */}
        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: '6 6',
          }}
        />

        {/* NGO Location Pin */}
        <Marker position={center} icon={ngoIcon}>
          <Popup>
            <div className="text-xs font-semibold text-sky-400">Your NGO Dispatch Center</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Scanning {radiusKm} km radius
            </div>
          </Popup>
        </Marker>

        {/* Available Donation Pins */}
        {validDonations.map((donation) => {
          const [lng, lat] = donation.location.coordinates;
          const isUrgent = donation.aiStructuredData?.condition === 'Needs Immediate Pickup';
          const totalWeight = donation.aiStructuredData?.foodItems?.reduce(
            (sum, item) => sum + (item.estimatedWeightKg || 0),
            0
          );

          return (
            <Marker
              key={donation._id}
              position={[lat, lng]}
              icon={createFoodIcon(isUrgent)}
            >
              <Popup minWidth={230} maxWidth={260}>
                <div className="space-y-2.5 py-0.5">
                  <img
                    src={donation.imageUrl}
                    alt="Food batch"
                    className="w-full h-24 object-cover rounded-lg border border-slate-800"
                  />

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-white text-xs leading-tight">
                        {donation.aiStructuredData?.foodItems
                          ?.map((i) => i.name)
                          .join(', ') || 'Surplus Food'}
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-0.5 shrink-0">
                        <Scale className="w-3 h-3" /> {totalWeight?.toFixed(1)}kg
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {donation.donorId?.name || 'Local Donor'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onClaim(donation._id)}
                      disabled={claimingId === donation._id}
                      className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      {claimingId === donation._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" /> Claim Rescue
                        </>
                      )}
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      title="Navigate in Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}