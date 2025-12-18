import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { Maximize2, Minimize2, Map } from "lucide-react";

export default function MapView() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMap, setSelectedMap] = useState("osm");
  const [showMapSelector, setShowMapSelector] = useState(false);

  const mapOptions = [
    {
      id: "osm",
      name: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
      id: "esri",
      name: "ESRI World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: 'Tiles &copy; Esri'
    },
    {
      id: "google-satellite",
      name: "Google Satellite",
      url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attribution: '&copy; Google'
    },
    {
      id: "google-hybrid",
      name: "Google Hybrid",
      url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: '&copy; Google'
    }
  ];

  const currentMap = mapOptions.find(map => map.id === selectedMap);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-full"}`}>
      {/* Kontrol Panel */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        {/* Map Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMapSelector(!showMapSelector)}
            className="bg-white hover:bg-gray-100 px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
          >
            <Map className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium">{currentMap.name}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showMapSelector ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMapSelector && (
            <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] overflow-hidden">
              {mapOptions.map((map) => (
                <button
                  key={map.id}
                  onClick={() => {
                    setSelectedMap(map.id);
                    setShowMapSelector(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                    selectedMap === map.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {map.name}
                  {selectedMap === map.id && (
                    <span className="float-right">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tombol Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-gray-700" />
          ) : (
            <Maximize2 className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>

      <MapContainer
        center={[-6.200000, 106.816666]}
        zoom={10}
        style={{ 
          height: isFullscreen ? "100vh" : "100%", 
          width: "100%" 
        }}
      >
        <TileLayer
          key={selectedMap}
          attribution={currentMap.attribution}
          url={currentMap.url}
        />

        <Marker position={[-6.2, 106.81]}>
          <Popup>Lokasi Jakarta</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}