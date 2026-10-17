import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap
} from "react-leaflet";
import L from "leaflet";
import {
    Bus,
    Search,
    Navigation,
    Clock,
    Users,
    Radio,
    RefreshCw
} from "lucide-react";

import "leaflet/dist/leaflet.css";

const initialBuses = [
    {
        id: "BUS-001",
        route: "Mathura - Campus",
        driver: "Amit Kumar",
        status: "On Time",
        eta: 12,
        passengers: 32,
        position: [27.4924, 77.6737],
        destination: [27.6054, 77.5947],
        color: "#2563eb"
    },
    {
        id: "BUS-002",
        route: "Vrindavan - Campus",
        driver: "Rahul Sharma",
        status: "Delayed",
        eta: 20,
        passengers: 28,
        position: [27.565, 77.685],
        destination: [27.6054, 77.5947],
        color: "#f59e0b"
    },
    {
        id: "BUS-003",
        route: "Agra - Campus",
        driver: "Vikas Singh",
        status: "On Route",
        eta: 25,
        passengers: 35,
        position: [27.485, 77.72],
        destination: [27.6054, 77.5947],
        color: "#16a34a"
    },
    {
        id: "BUS-004",
        route: "Hathras - Campus",
        driver: "Rohit Verma",
        status: "On Time",
        eta: 18,
        passengers: 30,
        position: [27.61, 77.75],
        destination: [27.6054, 77.5947],
        color: "#9333ea"
    }
];

const campus = [27.6054, 77.5947];

function createBusIcon(color, selected) {
    return L.divIcon({
        className: "bus-marker-wrapper",
        html: `
            <div class="bus-marker ${selected ? "selected" : ""}"
                 style="--marker-color: ${color}">
                <span>🚌</span>
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
    });
}

function MapFocus({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 13, { duration: 0.8 });
        }
    }, [position, map]);

    return null;
}

function Tracking() {
    const [buses, setBuses] = useState(initialBuses);
    const [selectedBusId, setSelectedBusId] = useState("BUS-001");
    const [search, setSearch] = useState("");

    const selectedBus = buses.find(
        (bus) => bus.id === selectedBusId
    );

    // Demo-only movement simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setBuses((previousBuses) =>
                previousBuses.map((bus, index) => {
                    const step = 0.00015 + index * 0.00004;

                    return {
                        ...bus,
                        position: [
                            bus.position[0] + step,
                            bus.position[1] - step
                        ]
                    };
                })
            );
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const filteredBuses = buses.filter((bus) =>
        `${bus.id} ${bus.route} ${bus.driver}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const resetSimulation = () => {
        setBuses(initialBuses);
    };

    return (
        <div className="tracking-page">
            <div className="page-heading tracking-heading">
                <div>
                    <h1>Live Bus Tracking</h1>
                    <p>Monitor vehicle locations and route activity.</p>
                </div>

                <div className="tracking-live-tag">
                    <span className="tracking-pulse"></span>
                    Demo simulation
                </div>
            </div>

            <div className="tracking-stats">
                <div className="tracking-stat">
                    <div className="tracking-stat-icon blue">
                        <Bus size={20} />
                    </div>
                    <div>
                        <span>Total Buses</span>
                        <strong>{buses.length}</strong>
                    </div>
                </div>

                <div className="tracking-stat">
                    <div className="tracking-stat-icon green">
                        <Radio size={20} />
                    </div>
                    <div>
                        <span>Active</span>
                        <strong>{buses.length}</strong>
                    </div>
                </div>

                <div className="tracking-stat">
                    <div className="tracking-stat-icon purple">
                        <Users size={20} />
                    </div>
                    <div>
                        <span>Passengers</span>
                        <strong>
                            {buses.reduce((sum, bus) => sum + bus.passengers, 0)}
                        </strong>
                    </div>
                </div>

                <div className="tracking-stat">
                    <div className="tracking-stat-icon orange">
                        <Clock size={20} />
                    </div>
                    <div>
                        <span>Delayed</span>
                        <strong>
                            {buses.filter((bus) => bus.status === "Delayed").length}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="tracking-layout">
                <aside className="tracking-sidebar">
                    <div className="tracking-list-heading">
                        <div>
                            <h2>Active Vehicles</h2>
                            <span>{filteredBuses.length} vehicles shown</span>
                        </div>

                        <button
                            className="tracking-refresh"
                            onClick={resetSimulation}
                            title="Reset demo positions"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    <div className="tracking-search">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search bus or route..."
                        />
                    </div>

                    <div className="tracking-bus-list">
                        {filteredBuses.map((bus) => (
                            <button
                                key={bus.id}
                                className={`tracking-bus-item ${
                                    selectedBusId === bus.id ? "selected" : ""
                                }`}
                                onClick={() => setSelectedBusId(bus.id)}
                            >
                                <div
                                    className="tracking-bus-icon"
                                    style={{ color: bus.color }}
                                >
                                    <Bus size={21} />
                                </div>

                                <div className="tracking-bus-info">
                                    <strong>{bus.id}</strong>
                                    <span>{bus.route}</span>
                                    <small>{bus.driver}</small>
                                </div>

                                <span
                                    className={`tracking-status ${
                                        bus.status.toLowerCase().replace(" ", "-")
                                    }`}
                                >
                                    {bus.status}
                                </span>
                            </button>
                        ))}

                        {filteredBuses.length === 0 && (
                            <p className="tracking-empty">
                                No buses match your search.
                            </p>
                        )}
                    </div>
                </aside>

                <div className="tracking-map-panel">
                    <MapContainer
                        center={campus}
                        zoom={11}
                        scrollWheelZoom={true}
                        className="tracking-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapFocus
                            position={selectedBus?.position || campus}
                        />

                        {buses.map((bus) => (
                            <Marker
                                key={bus.id}
                                position={bus.position}
                                icon={createBusIcon(
                                    bus.color,
                                    selectedBusId === bus.id
                                )}
                                eventHandlers={{
                                    click: () => setSelectedBusId(bus.id)
                                }}
                            >
                                <Popup>
                                    <strong>{bus.id}</strong>
                                    <br />
                                    {bus.route}
                                    <br />
                                    ETA: {bus.eta} min
                                </Popup>
                            </Marker>
                        ))}

                        {selectedBus && (
                            <Polyline
                                positions={[
                                    selectedBus.position,
                                    selectedBus.destination
                                ]}
                                pathOptions={{
                                    color: selectedBus.color,
                                    weight: 4,
                                    dashArray: "8 8"
                                }}
                            />
                        )}
                    </MapContainer>

                    <div className="map-legend">
                        <span><i className="legend-blue"></i> Selected bus</span>
                        <span><i className="legend-gray"></i> Other buses</span>
                    </div>
                </div>
            </div>

            {selectedBus && (
                <div className="selected-bus-details panel">
                    <div className="selected-bus-title">
                        <div className="selected-bus-symbol">
                            <Bus size={23} />
                        </div>

                        <div>
                            <h2>{selectedBus.id}</h2>
                            <p>{selectedBus.route}</p>
                        </div>
                    </div>

                    <div className="selected-detail">
                        <span>Driver</span>
                        <strong>{selectedBus.driver}</strong>
                    </div>

                    <div className="selected-detail">
                        <span>Estimated arrival</span>
                        <strong>{selectedBus.eta} minutes</strong>
                    </div>

                    <div className="selected-detail">
                        <span>Passengers</span>
                        <strong>{selectedBus.passengers}</strong>
                    </div>

                    <div className="selected-detail">
                        <span>Status</span>
                        <strong>{selectedBus.status}</strong>
                    </div>

                    <button
                        className="focus-map-button"
                        onClick={() => setSelectedBusId(selectedBus.id)}
                    >
                        <Navigation size={16} />
                        Focus on map
                    </button>
                </div>
            )}
        </div>
    );
}

export default Tracking;