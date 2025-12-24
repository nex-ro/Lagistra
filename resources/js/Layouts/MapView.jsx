import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, Map, Layers, Eye, EyeOff, RefreshCw, MapPin } from "lucide-react";
import L from "leaflet";
import axios from "axios";

export default function MapView({ initialLayers = [] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMap, setSelectedMap] = useState("esri");
  
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [layers, setLayers] = useState(initialLayers);
  const [geojsonData, setGeojsonData] = useState({});
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-6.200000, 106.816666]);
  const [mapZoom, setMapZoom] = useState(10);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const mapRef = useRef(null);
const [hoveredLayerId, setHoveredLayerId] = useState(null);
const [selectedFeature, setSelectedFeature] = useState(null);
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
      id: "google-hybrid",
      name: "Google Saterlite",
      url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: '&copy; Google'
    }
  ];

  const currentMap = mapOptions.find(map => map.id === selectedMap);

  // Load GeoJSON data for visible layers
  useEffect(() => {
    const loadGeoJSONLayers = async () => {
      setLoading(true);
      const newGeojsonData = {};
      const errors = [];

      for (const layer of layers) {
        if (layer.is_visible && !geojsonData[layer.id]) {
          try {
            const response = await axios.get(`/api/layers/${layer.id}/features`);
            if (response.data.success && response.data.data) {
              newGeojsonData[layer.id] = response.data.data;
            } else {
              errors.push(`Layer ${layer.name}: ${response.data.message || 'Unknown error'}`);
            }
          } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error(`Error loading layer ${layer.id}:`, errorMsg);
            errors.push(`Layer ${layer.name}: ${errorMsg}`);
          }
        }
      }

      if (Object.keys(newGeojsonData).length > 0) {
        setGeojsonData(prev => ({ ...prev, ...newGeojsonData }));
      }
      
      if (errors.length > 0) {
        console.warn('Layer loading errors:', errors);
      }
      
      setLoading(false);
    };

    if (layers.length > 0) {
      loadGeoJSONLayers();
    }
  }, [layers.map(l => `${l.id}-${l.is_visible}`).join(',')]);

  // Auto center map to first layer bounds
  useEffect(() => {
    const visibleLayer = layers.find(l => l.is_visible && l.center);
    if (visibleLayer && visibleLayer.center) {
      setMapCenter(visibleLayer.center);
      setMapZoom(12);
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleLayerVisibility = (layerId) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, is_visible: !layer.is_visible }
        : layer
    ));
  };

  const zoomToLayer = (layerId) => {
    const geojson = geojsonData[layerId];
    const map = mapRef.current;
    
    if (geojson && map) {
      try {
        // Create a temporary GeoJSON layer to get bounds
        const tempLayer = L.geoJSON(geojson);
        const bounds = tempLayer.getBounds();
        
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 22,
            animate: true,
            duration: 1
          });
          setSelectedLayerId(layerId);
          
          // Reset selection after animation
          setTimeout(() => setSelectedLayerId(null), 2000);
        }
      } catch (error) {
        console.error('Error zooming to layer:', error);
      }
    }
  };

  const refreshLayers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/layers');
      if (response.data.success) {
        setLayers(response.data.data);
      }
    } catch (error) {
      console.error('Error refreshing layers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLayerStyle = (layer, isSelected = false, isHovered = false) => {
  const baseStyle = {
    color: layer.stroke_color || layer.color,
    weight: layer.stroke_width || 2,
    opacity: (layer.opacity || 70) / 100,
    fillColor: layer.color,
    fillOpacity: (layer.opacity || 70) / 100 * 0.5
  };

  if (isSelected) {
    return {
      ...baseStyle,
      color: '#3b82f6',
      weight: 4,
      fillColor: '#60a5fa',
      fillOpacity: 0.6
    };
  }

  if (isHovered) {
    return {
      ...baseStyle,
      weight: 3,
      fillOpacity: (layer.opacity || 70) / 100 * 0.7
    };
  }

  return baseStyle;
};

  const onEachFeature = (layerData) => (feature, leafletLayer) => {
  if (feature.properties) {
    const popupContent = Object.entries(feature.properties)
      .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
      .join('<br/>');
    leafletLayer.bindPopup(popupContent);

    // Store original style
    const originalStyle = getLayerStyle(layerData);
    
    // Add click event
    leafletLayer.on('click', () => {
      setSelectedFeature(feature.properties);
    });

    // Add hover events with color change
    leafletLayer.on('mouseover', (e) => {
      e.target.setStyle({
        color: '#f59e0b', // Orange color on hover
        weight: 4,
        fillColor: '#fbbf24', // Light orange fill
        fillOpacity: 0.7
      });
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        e.target.bringToFront();
      }
    });

    leafletLayer.on('mouseout', (e) => {
      // Reset to original style
      e.target.setStyle(originalStyle);
    });
  }
};


  // Map controller component
  function MapController() {
    const map = useMap();
    mapRef.current = map;
    return null;
  }

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-full"}`}>
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        {/* Refresh Button */}
        <button
          onClick={refreshLayers}
          disabled={loading}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-colors disabled:opacity-50"
          title="Refresh Layers"
        >
          <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Layer Panel Toggle */}
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-colors"
          title="Toggle Layer Panel"
        >
          <Layers className="w-5 h-5 text-gray-700" />
        </button>

        {/* Map Selector */}
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
          {showMapSelector && (
            <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] overflow-hidden">
             {mapOptions.map((map) => (
              <button
                key={map.id}
                onClick={() => {
                  setSelectedMap(map.id);
                  setShowMapSelector(false);
                }}
                className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                  selectedMap === map.id 
                    ? 'bg-blue-500 text-white font-semibold shadow-inner' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{map.name}</span>
                  {selectedMap === map.id && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}

            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
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

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-xl border border-gray-200 max-w-xs w-80 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Layers ({layers.length})
            </h3>
          </div>
          <div className="overflow-y-auto flex-1">
            {layers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No layers available
              </div>
            ) : (
              layers.map((layer) => (
                <div
                    key={layer.id}
                    className={`p-3 border-b border-gray-100 transition-all duration-200 cursor-pointer ${
                      selectedLayerId === layer.id 
                        ? 'bg-blue-100 border-l-4 border-l-blue-500' 
                        : hoveredLayerId === layer.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHoveredLayerId(layer.id)}
                    onMouseLeave={() => setHoveredLayerId(null)}
                  >

                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {layer.is_visible ? (
                        <Eye className="w-5 h-5 text-blue-600" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border-2 flex-shrink-0"
                          style={{
                            backgroundColor: layer.color,
                            borderColor: layer.stroke_color || layer.color
                          }}
                        />
                        <h4 className="font-medium text-gray-800 text-sm truncate">
                          {layer.name}
                        </h4>
                      </div>
                      {layer.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {layer.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="capitalize">{layer.geometry_type}</span>
                        <span>•</span>
                        <span>{layer.features_count} features</span>
                      </div>
                    </div>
                    {layer.is_visible && geojsonData[layer.id] && (
                      <button
                        onClick={() => zoomToLayer(layer.id)}
                        className="mt-1 flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors"
                        title="Zoom to layer"
                      >
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-20 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-700">Loading layers...</span>
          </div>
        </div>
      )}
      {/* Selected Feature Card */}
{selectedFeature && (
  <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-[70vh] overflow-hidden flex flex-col">
    {/* Header dengan tombol close */}
    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
      <h3 className="font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        Detail Atribut
      </h3>
      <button onClick={() => setSelectedFeature(null)}>
        {/* Close icon */}
      </button>
    </div>
    
    {/* Body dengan semua atribut yang diorganisir dalam sections */}
    <div className="overflow-y-auto flex-1 p-4">
      {/* Primary Info: BLOK */}
      {/* Key Info Grid: DIVISI, LUAS_HA, YOP, JML_POKOK */}
      {/* Company Info: NAMA_PT, ESTATE, KOPERASI */}
      {/* Production Info: TM, TBM, SPH_NET */}
      {/* Area Details: AREAL_PROD, AREAL_KOSO, dll */}
      {/* Infrastructure: JALAN, PARIT, TANGGUL */}
      {/* Environmental: HCV, HUTAN, SUNGAI, POND */}
      {/* Other Info: JENIS_BIBI, KET, AREA, dll */}
    </div>
  </div>
)}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ 
          height: isFullscreen ? "100vh" : "100%", 
          width: "100%" 
        }}
      >
        <MapController />
        <TileLayer
          key={selectedMap}
          attribution={currentMap.attribution}
          url={currentMap.url}
        />

        {/* Render GeoJSON Layers */}
{layers.map((layer) => {
  if (layer.is_visible && geojsonData[layer.id]) {
    return (
      <GeoJSON
        key={`${layer.id}-${layer.color}-${layer.opacity}`}
        data={geojsonData[layer.id]}
        style={getLayerStyle(layer)}
        onEachFeature={onEachFeature(layer)}
      />
    );
  }
  return null;
})}
      </MapContainer>
    </div>
  );
}
