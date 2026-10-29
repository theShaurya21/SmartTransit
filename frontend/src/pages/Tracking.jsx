import { useEffect, useState } from "react";
import {
    MapContainer, Marker, Popup, TileLayer, useMap
} from "react-leaflet";
import L from "leaflet";
import { Bus, Clock, MapPin, Radio, RefreshCw } from "lucide-react";
import API from "../services/api";
import "leaflet/dist/leaflet.css";

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
}

function fetchActiveTrips() {
    return API.get("/trips/active").then(({ data }) => data);
}

function MapFocus({ position }) {
    const map = useMap();
    const latitude = position?.[0] ?? null;
    const longitude = position?.[1] ?? null;
    useEffect(() => {
        if (latitude !== null && longitude !== null) map.setView([latitude, longitude], 13);
    }, [map, latitude, longitude]);
    return null;
}

function busIcon(isFresh) {
    return L.divIcon({
        className: "bus-marker-wrapper",
        html: `<div class="bus-marker ${isFresh ? "selected" : ""}"><span>🚌</span></div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
    });
}

export default function Tracking() {
    const user = getStoredUser();
    const userId = String(user._id || user.id || "");
    const isDriver = user.role === "driver";
    const isAdmin = user.role === "admin";
    const [trips, setTrips] = useState([]);
    const [assignedBuses, setAssignedBuses] = useState([]);
    const [selectedBusId, setSelectedBusId] = useState("");
    const [selectedTripId, setSelectedTripId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [gpsStatus, setGpsStatus] = useState("No device location received yet.");
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const refresh = () => {
            fetchActiveTrips().then((data) => {
                if (!cancelled) {
                    setTrips(data);
                    setError("");
                    setLoading(false);
                }
            }).catch((requestError) => {
                if (!cancelled) {
                    setError(requestError.response?.data?.message || "Unable to load active trips.");
                    setLoading(false);
                }
            });
        };
        refresh();
        const interval = window.setInterval(refresh, 15000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!isDriver) return undefined;
        let cancelled = false;
        API.get("/trips/assigned").then(({ data }) => {
            if (!cancelled) {
                setAssignedBuses(data);
                setSelectedBusId((current) => current || data[0]?._id || "");
            }
        }).catch((requestError) => {
            if (!cancelled) setError(requestError.response?.data?.message || "Unable to load your assigned bus.");
        });
        return () => { cancelled = true; };
    }, [isDriver]);

    const myTrip = trips.find((trip) => String(trip.driver?._id || trip.driver) === userId);
    const activeTripId = myTrip?._id;

    useEffect(() => {
        if (!isDriver || !activeTripId || !navigator.geolocation) return undefined;
        let lastSentAt = 0;
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const now = Date.now();
                if (now - lastSentAt < 10000) return;
                lastSentAt = now;
                const { latitude, longitude, accuracy } = position.coords;
                if (accuracy > 10000) {
                    setGpsStatus("GPS fix accuracy is too low to share.");
                    return;
                }

                setGpsStatus("Sending device GPS update...");
                API.patch(`/trips/${activeTripId}/location`, { latitude, longitude, accuracy })
                    .then(() => setGpsStatus(`GPS update sent (±${Math.round(accuracy)} m).`))
                    .catch((requestError) => {
                        setGpsStatus(requestError.response?.data?.message || "GPS update failed; check the network.");
                    });
            },
            (geoError) => {
                const messages = {
                    1: "Location permission was denied. Allow location access in browser settings.",
                    2: "Device location is unavailable.",
                    3: "GPS request timed out. Waiting for another fix.",
                };
                setGpsStatus(messages[geoError.code] || "Device location could not be read.");
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isDriver, activeTripId]);

    const tripsWithLocation = trips.filter((trip) => trip.latestLocation);
    const selectedTrip = trips.find((trip) => trip._id === selectedTripId) || trips[0];
    const mapPosition = selectedTrip?.latestLocation
        ? [selectedTrip.latestLocation.latitude, selectedTrip.latestLocation.longitude]
        : null;

    async function startTrip(event) {
        event.preventDefault();
        if (!selectedBusId) return;
        setStarting(true);
        setError("");
        try {
            await API.post("/trips/start", { busId: selectedBusId });
            setGpsStatus(navigator.geolocation
                ? "Trip started. Waiting for device GPS permission and first fix."
                : "Trip started, but this browser does not support device geolocation.");
            setTrips(await fetchActiveTrips());
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to start trip.");
        } finally {
            setStarting(false);
        }
    }

    async function endTrip(tripId) {
        setError("");
        try {
            await API.patch(`/trips/${tripId}/end`);
            setGpsStatus("Trip ended. Location sharing has stopped.");
            setTrips(await fetchActiveTrips());
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to end trip.");
        }
    }

    return (
        <div className="tracking-page">
            <div className="page-heading tracking-heading">
                <div>
                    <h1>Live Bus Tracking</h1>
                    <p>Map markers come from active trips and device GPS updates. Locations refresh every 15 seconds.</p>
                </div>
                <div className="tracking-live-tag"><Radio size={16} /> {tripsWithLocation.length} reported locations</div>
            </div>

            {error && <div className="incident-message incident-error" role="alert">{error}</div>}

            {isDriver && (
                <section className="panel driver-trip-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Driver Trip Controls</h2>
                            <p>{myTrip ? `Active trip · ${myTrip.bus?.busNumber || "Assigned bus"} · ${myTrip.route}` : "Start a trip for your assigned bus to share device location."}</p>
                        </div>
                        <span className="tracking-gps-status" role="status">{gpsStatus}</span>
                    </div>
                    {myTrip ? (
                        <button className="incident-primary-btn" onClick={() => endTrip(myTrip._id)}>End Trip</button>
                    ) : (
                        <form className="driver-trip-form" onSubmit={startTrip}>
                            <label>
                                Assigned bus
                                <select value={selectedBusId} onChange={(event) => setSelectedBusId(event.target.value)} required>
                                    <option value="">Select a bus</option>
                                    {assignedBuses.map((bus) => <option key={bus._id} value={bus._id}>{bus.busNumber} · {bus.route}</option>)}
                                </select>
                            </label>
                            <button className="incident-primary-btn" disabled={starting || !assignedBuses.length}>
                                {starting ? "Starting..." : "Start Trip"}
                            </button>
                            {!assignedBuses.length && !loading && <p>No active bus is assigned to this driver account.</p>}
                        </form>
                    )}
                </section>
            )}

            <div className="tracking-stats">
                <div className="tracking-stat"><div className="tracking-stat-icon blue"><Bus size={20} /></div><div><span>Active trips</span><strong>{loading ? "…" : trips.length}</strong></div></div>
                <div className="tracking-stat"><div className="tracking-stat-icon green"><MapPin size={20} /></div><div><span>Locations received</span><strong>{tripsWithLocation.length}</strong></div></div>
                <div className="tracking-stat"><div className="tracking-stat-icon purple"><Clock size={20} /></div><div><span>ETA</span><strong>Unavailable</strong></div></div>
                <div className="tracking-stat"><div className="tracking-stat-icon orange"><RefreshCw size={20} /></div><div><span>Update method</span><strong>15s polling</strong></div></div>
            </div>

            <div className="tracking-layout">
                <aside className="tracking-sidebar">
                    <div className="tracking-list-heading">
                        <div><h2>Active Trips</h2><span>{trips.length} trips</span></div>
                    </div>
                    <div className="tracking-bus-list">
                        {trips.map((trip) => (
                            <button key={trip._id} className={`tracking-bus-item ${selectedTrip?._id === trip._id ? "selected" : ""}`} onClick={() => setSelectedTripId(trip._id)}>
                                <div className="tracking-bus-icon"><Bus size={21} /></div>
                                <div className="tracking-bus-info">
                                    <strong>{trip.bus?.busNumber || "Bus"}</strong>
                                    <span>{trip.route}</span>
                                    <small>{trip.driver?.name || "Driver"}</small>
                                </div>
                                <span className="tracking-status">{trip.latestLocation ? (trip.locationFresh ? "Fresh GPS" : "Stale GPS") : "No GPS"}</span>
                            </button>
                        ))}
                        {!loading && trips.length === 0 && <p className="tracking-empty">No active trips are being reported.</p>}
                    </div>
                </aside>

                <section className="tracking-map-panel" aria-label="Active trip map">
                    <MapContainer center={mapPosition || [0, 0]} zoom={mapPosition ? 13 : 2} scrollWheelZoom className="tracking-map">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapFocus position={mapPosition} />
                        {tripsWithLocation.map((trip) => (
                            <Marker
                                key={trip._id}
                                position={[trip.latestLocation.latitude, trip.latestLocation.longitude]}
                                icon={busIcon(trip.locationFresh)}
                                eventHandlers={{ click: () => setSelectedTripId(trip._id) }}
                            >
                                <Popup>
                                    <strong>{trip.bus?.busNumber || "Bus"} · {trip.locationFresh ? "Fresh GPS" : "Stale GPS"}</strong>
                                    <br />Coordinates: {trip.latestLocation.latitude.toFixed(5)}, {trip.latestLocation.longitude.toFixed(5)}
                                    <br />Route: {trip.route}
                                    {trip.latestLocation.accuracy !== undefined && <><br />Accuracy: ±{Math.round(trip.latestLocation.accuracy)} m</>}
                                    <br />Received: {new Date(trip.latestLocation.receivedAt).toLocaleString()}
                                    <br />Source: {trip.latestLocation.source}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                    {!tripsWithLocation.length && (
                        <div className="tracking-location-empty">
                            <MapPin size={34} />
                            <h2>No trip locations available</h2>
                            <p>Only active trips with a device GPS update appear on this map. Coordinates are never simulated. ETA remains unavailable because route geometry and traffic data are not configured.</p>
                        </div>
                    )}
                </section>
            </div>

            {selectedTrip && (
                <div className="selected-bus-details panel">
                    <div className="selected-bus-title">
                        <div className="selected-bus-symbol"><Bus size={23} /></div>
                        <div><h2>{selectedTrip.bus?.busNumber || "Active Bus"}</h2><p>{selectedTrip.route}</p></div>
                    </div>
                    <p>Driver: {selectedTrip.driver?.name || "Assigned driver"}</p>
                    <p>Location source: {selectedTrip.latestLocation?.source || "No GPS fix received"}</p>
                    <p>Last received: {selectedTrip.latestLocation ? new Date(selectedTrip.latestLocation.receivedAt).toLocaleString() : "Unavailable"}</p>
                    <p>GPS freshness: {!selectedTrip.latestLocation ? "No location" : selectedTrip.locationFresh ? "Fresh (within 2 minutes)" : "Stale (over 2 minutes)"}</p>
                    {isAdmin && <button className="secondary-button" onClick={() => endTrip(selectedTrip._id)}>End trip (admin)</button>}
                </div>
            )}
        </div>
    );
}
