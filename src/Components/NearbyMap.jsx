import React, { useState, useRef, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.karte.io/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const fetchNearbyHospitals = async (lat, lng, radiusM, signal) => {
  const query = `[out:json][timeout:25];(nwr["amenity"~"^(hospital|clinic)$"](around:${radiusM},${lat},${lng});nwr["healthcare"="hospital"](around:${radiusM},${lat},${lng}););out center;`;
  let lastErr;
  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal,
      });
      if (res.status === 429) throw new Error('rate_limit');
      if (!res.ok) { lastErr = new Error('fetch_error'); continue; }
      const data = await res.json();
      const seen = new Set();
      return data.elements
        .map(el => {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) return null;
          const name = el.tags?.name;
          if (!name) return null;
          const key = name.toLowerCase().trim();
          if (seen.has(key)) return null;
          seen.add(key);
          return {
            id: String(el.id),
            name,
            type: el.tags?.amenity === 'hospital' || el.tags?.healthcare === 'hospital' ? 'Hospital' : 'Clinic',
            lat: elLat,
            lng: elLng,
            distance: haversine(lat, lng, elLat, elLng),
            phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastErr = err;
    }
  }
  throw lastErr || new Error('fetch_error');
};

const RADII = [
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
];

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export default function NearbyMap() {
  const [phase, setPhase] = useState('idle');
  const [userCoords, setUserCoords] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [radius, setRadius] = useState(10000);
  const [error, setError] = useState('');
  const [popupHosp, setPopupHosp] = useState(null);
  const mapRef = useRef(null);
  const abortRef = useRef(null);
  const cacheRef = useRef({});

  useEffect(() => {
    if (userCoords && mapRef.current) {
      mapRef.current.flyTo({ center: [userCoords.lng, userCoords.lat], zoom: 13, duration: 1200 });
    }
  }, [userCoords]);

  const doFetch = async (lat, lng, radiusM) => {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)},${radiusM}`;
    if (cacheRef.current[key]) return cacheRef.current[key];
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const result = await fetchNearbyHospitals(lat, lng, radiusM, controller.signal);
    cacheRef.current[key] = result;
    return result;
  };

  const handleLocate = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported by your browser.'); setPhase('error'); return; }
    setPhase('locating');
    setError('');
    setHospitals([]);
    setPopupHosp(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });
        setPhase('fetching');
        try {
          const list = await doFetch(lat, lng, radius);
          setHospitals(list);
          setPhase('ready');
        } catch (err) {
          if (err.name === 'AbortError') return;
          setError(err.message === 'rate_limit'
            ? 'Too many requests. Wait a moment and try again.'
            : 'Failed to fetch hospitals. Please try again.');
          setPhase('error');
        }
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access denied. Enable it in browser settings and try again.'
            : 'Unable to get your location. Please try again.'
        );
        setPhase('error');
      },
      { timeout: 12000 }
    );
  };

  const handleRadiusChange = async (newRadius) => {
    if (newRadius === radius) return;
    setRadius(newRadius);
    if (!userCoords || (phase !== 'ready' && phase !== 'fetching')) return;
    setUpdating(true);
    setPopupHosp(null);
    try {
      const list = await doFetch(userCoords.lat, userCoords.lng, newRadius);
      setHospitals(list);
      setPhase('ready');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message === 'rate_limit'
        ? 'Too many requests. Wait a moment and try again.'
        : 'Failed to fetch hospitals. Please try again.');
      setPhase('error');
    } finally {
      setUpdating(false);
    }
  };

  const showMap = userCoords && (phase === 'fetching' || phase === 'ready' || updating);

  return (
    <section className="py-16 md:py-24 bg-gray-50 overflow-hidden" id="nearby-map">
      <div className="mx-auto max-w-7xl px-4 md:px-8 w-full">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="text-sm font-semibold text-[#1a8efd] uppercase tracking-wide">Live map</span>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Hospitals near you
          </h2>
          <p className="mt-3 text-base text-gray-500 max-w-md">
            See real-time hospitals and clinics around your location, ranked by distance.
          </p>
        </div>

        {/* Idle */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-5 py-14">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-700 font-medium">Find hospitals wherever you are</p>
              <p className="text-gray-400 text-sm mt-1">Uses OpenStreetMap data. Your location is never stored.</p>
            </div>
            <div className="flex items-center gap-2">
              {RADII.map(r => (
                <button key={r.value} onClick={() => setRadius(r.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${radius === r.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={handleLocate}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" clipRule="evenodd" />
              </svg>
              Show hospitals near me
            </button>
          </div>
        )}

        {/* Locating / initial fetching */}
        {(phase === 'locating' || (phase === 'fetching' && !userCoords)) && (
          <div className="flex flex-col items-center gap-3 py-14">
            <div className="w-9 h-9 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">
              {phase === 'locating' ? 'Getting your location…' : 'Finding nearby hospitals…'}
            </p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="flex flex-col items-center gap-4 py-14">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm font-medium text-center max-w-xs">{error}</p>
            <button onClick={handleLocate} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
              Try again
            </button>
          </div>
        )}

        {/* Map + List */}
        {showMap && (() => {
          const mapLimit = Math.min(
            hospitals.length,
            Math.max(Math.min(hospitals.length, 100), Math.round(hospitals.length * 0.4 / 100) * 100)
          );
          return (
            <div className="flex flex-col lg:flex-row gap-5 items-start w-full min-w-0" style={{ '--panel-h': 'clamp(430px, 50vw, 560px)' }}>
              {/* Map */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 w-full min-w-0 lg:w-[70%]" style={{ height: 'var(--panel-h)' }}>
                <Map
                  ref={mapRef}
                  initialViewState={{ longitude: userCoords.lng, latitude: userCoords.lat, zoom: 13 }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle={MAP_STYLE}
                  attributionControl={false}
                >
                  <NavigationControl position="top-left" />

                  {/* User location — red drop pin */}
                  <Marker longitude={userCoords.lng} latitude={userCoords.lat} anchor="bottom">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#e53e3e" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="5" fill="#fff" />
                    </svg>
                  </Marker>

                  {/* Hospital markers */}
                  {hospitals.slice(0, mapLimit).map((h, idx) => (
                    <Marker
                      key={h.id}
                      longitude={h.lng}
                      latitude={h.lat}
                      anchor="center"
                      onClick={(e) => { e.originalEvent.stopPropagation(); setPopupHosp(h); }}
                    >
                      <div style={{
                        width: 26, height: 26, background: '#1a8efd', borderRadius: '50%',
                        border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
                        fontFamily: 'system-ui,sans-serif',
                      }}>
                        {idx + 1}
                      </div>
                    </Marker>
                  ))}

                  {/* Popup */}
                  {popupHosp && (
                    <Popup
                      longitude={popupHosp.lng}
                      latitude={popupHosp.lat}
                      anchor="bottom"
                      onClose={() => setPopupHosp(null)}
                      closeOnClick={false}
                      offset={10}
                    >
                      <div style={{ fontSize: 13, lineHeight: 1.5, minWidth: 140 }}>
                        <strong style={{ display: 'block', marginBottom: 2 }}>{popupHosp.name}</strong>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>{popupHosp.type}</span><br />
                        <span style={{ color: '#1a8efd', fontWeight: 600 }}>{popupHosp.distance.toFixed(1)} km away</span>
                        {popupHosp.phone && <><br /><span style={{ fontSize: 12, color: '#374151' }}>{popupHosp.phone}</span></>}
                      </div>
                    </Popup>
                  )}
                </Map>

                {/* Marker cap notice */}
                {mapLimit < hospitals.length && (
                  <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
                    className="bg-white/90 backdrop-blur-sm text-xs text-gray-500 px-3 py-1 rounded-full border border-gray-200 shadow-sm whitespace-nowrap pointer-events-none">
                    Showing nearest {mapLimit} of {hospitals.length} on map
                  </div>
                )}

                {/* Re-center button */}
                <button
                  onClick={() => mapRef.current?.flyTo({ center: [userCoords.lng, userCoords.lat], zoom: 13, duration: 1000 })}
                  title="Re-center to my location"
                  style={{ position: 'absolute', bottom: 24, right: 12, zIndex: 10 }}
                  className="w-10 h-10 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.083 3.875-5.1 3.875-9.077a8 8 0 10-16 0c0 3.978 1.93 6.994 3.875 9.077a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* List */}
              <div className="flex flex-col gap-3 lg:flex-1 min-w-0 w-full overflow-hidden" style={{ height: 'var(--panel-h)' }}>
                <div className="flex items-center justify-between gap-x-2 gap-y-1 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      {updating && <span className="w-3 h-3 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin inline-block" />}
                      {phase === 'fetching' && !updating ? 'Searching…' : `${hospitals.length} ${hospitals.length === 1 ? 'result' : 'results'} found`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Sorted by distance</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {RADII.map(r => (
                      <button key={r.value} onClick={() => handleRadiusChange(r.value)} disabled={updating}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition disabled:opacity-50 ${radius === r.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {phase === 'fetching' && !updating ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-400 rounded-full animate-spin" />
                  </div>
                ) : hospitals.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No hospitals or clinics found within {radius / 1000} km. Try a larger radius.
                  </div>
                ) : (
                  <div className={`space-y-2 overflow-y-auto pr-1 transition-opacity flex-1 min-h-0 ${updating ? 'opacity-50' : 'opacity-100'}`}>
                    {hospitals.map((h, idx) => (
                      <div key={h.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-blue-100 hover:bg-blue-50/30 transition">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{h.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${h.type === 'Hospital' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                              {h.type}
                            </span>
                            {h.phone && <span className="text-xs text-gray-400 truncate">{h.phone}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-sm font-semibold text-blue-500">
                            {h.distance.toFixed(1)}<span className="text-xs font-normal text-gray-400 ml-0.5">km</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
