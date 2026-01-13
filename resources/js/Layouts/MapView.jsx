import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, Map, Eye, EyeOff, RefreshCw, MapPin, Leaf, Package, ChevronRight, ChevronDown, X, Database, Layers } from "lucide-react";
import L from "leaflet";
import axios from "axios";

export default function MapViewUser({ initialLayers = [] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMap, setSelectedMap] = useState("esri");
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showTreePanel, setShowTreePanel] = useState(true);
  // Set all layers to hidden by default
  const [layers, setLayers] = useState(initialLayers.map(layer => ({ ...layer, is_visible: false })));
  const [geojsonData, setGeojsonData] = useState({});
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-6.200000, 106.816666]);
  const [mapZoom, setMapZoom] = useState(10);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [hoveredLayerId, setHoveredLayerId] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedFeatureLayer, setSelectedFeatureLayer] = useState(null);
  const [treeData, setTreeData] = useState({});
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [highlightedFeatureId, setHighlightedFeatureId] = useState(null); 
  
  const mapRef = useRef(null);
  const selectedLayerRef = useRef(null);
  const geoJsonLayersRef = useRef({});

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
      name: "Google Satellite",
      url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: '&copy; Google'
    }
  ];

  const currentMap = mapOptions.find(map => map.id === selectedMap);

 

  useEffect(() => {
    const tree = {};
    
    Object.entries(geojsonData).forEach(([layerId, geoJsonData]) => {
      const layer = layers.find(l => l.id === parseInt(layerId));
      if (!layer || !geoJsonData || !geoJsonData.features) return;

      geoJsonData.features.forEach((feature, index) => {
        const props = feature.properties;
        const estate = props.ESTATE || 'Unknown Estate';
        const layerName = layer.name;
        const blok = props.BLOK || `Feature ${index + 1}`;
        
        // Initialize estate
        if (!tree[estate]) {
          tree[estate] = {};
        }
        
        // Initialize layer under estate
        if (!tree[estate][layerName]) {
          tree[estate][layerName] = {
            layerId: layer.id,
            blocks: []
          };
        }
        
        // Add block
        tree[estate][layerName].blocks.push({
          id: `${layerId}-${index}`,
          name: blok,
          feature: feature,
          layerId: layer.id,
          featureIndex: index
        });
      });
    });

    setTreeData(tree);
  }, [geojsonData, layers]);

  useEffect(() => {
  const loadGeoJSONLayers = async () => {
    if (layers.length === 0) return;
    
    setLoading(true);
    const newGeojsonData = {};
    const errors = [];

    for (const layer of layers) {
      // BARU: Load SEMUA layer (tidak peduli visibility)
      // BEFORE: if (layer.is_visible && !geojsonData[layer.id])
      if (!geojsonData[layer.id]) {
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

  loadGeoJSONLayers();
}, [layers.length])

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

  const refreshLayers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/layers');
      if (response.data.success) {
        // Set all refreshed layers to hidden by default
        setLayers(response.data.data.map(layer => ({ ...layer, is_visible: false })));
      }
    } catch (error) {
      console.error('Error refreshing layers:', error);
    } finally {
      setLoading(false);
    }
  };

const getLayerStyle = (layer, featureId = null) => {
      const isHighlighted = highlightedFeatureId && featureId && 
                            highlightedFeatureId === featureId;

      if (isHighlighted) {
        return {
          color: '#ef4444',
          weight: 4,
          opacity: 1,
          fillColor: '#fca5a5',
          fillOpacity: 0.7
        };
      }
    
      // Style default untuk layer yang tidak di-highlight
      return {
        color: layer.stroke_color || layer.color,
        weight: layer.stroke_width || 2,
        opacity: (layer.opacity || 70) / 100,
        fillColor: layer.color,
        fillOpacity: (layer.opacity || 70) / 100 * 0.5
      };
    };


const onEachFeature = (layerData, featureIndex) => (feature, leafletLayer) => {
    if (feature.properties) {
      const featureId = `${layerData.id}-${featureIndex}`;

      // Store layer reference
      geoJsonLayersRef.current[featureId] = leafletLayer;

      // Store original data
      leafletLayer._featureId = featureId;
      leafletLayer._layerData = layerData;
      leafletLayer._feature = feature;

      // Simpan style original (NON-highlighted)  // ← PERBAIKAN DI SINI
      leafletLayer._originalStyle = {
        color: layerData.stroke_color || layerData.color,
        weight: layerData.stroke_width || 2,
        opacity: (layerData.opacity || 70) / 100,
        fillColor: layerData.color,
        fillOpacity: (layerData.opacity || 70) / 100 * 0.5
      };

      // Add click event
      leafletLayer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        handleFeatureSelect(featureId, feature, layerData, leafletLayer);
      });

      // Hover events
      leafletLayer.on('mouseover', (e) => {
        // Hanya hover jika bukan feature yang sedang diselect
        if (highlightedFeatureId !== featureId) {
          e.target.setStyle({
            color: '#f59e0b',
            weight: 4,
            fillColor: '#fbbf24',
            fillOpacity: 0.7
          });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            e.target.bringToFront();
          }
        }
      });

      leafletLayer.on('mouseout', (e) => {
        // Kembalikan ke style original hanya jika bukan feature yang sedang diselect
        if (highlightedFeatureId !== featureId) {
          e.target.setStyle(leafletLayer._originalStyle);
        }
      });
    }
  };


  const handleFeatureSelect = (featureId, feature, layerData, leafletLayer = null) => {
        if (highlightedFeatureId && highlightedFeatureId !== featureId) {
          const prevLayerRef = geoJsonLayersRef.current[highlightedFeatureId];
          if (prevLayerRef && prevLayerRef._originalStyle) {
            prevLayerRef.setStyle(prevLayerRef._originalStyle);
          }
        }
      
        // Apply highlighted style to new selection
        if (!leafletLayer) {
          leafletLayer = geoJsonLayersRef.current[featureId];
        }
      
        if (leafletLayer) {
          const highlightedStyle = {
            color: '#ef4444',
            weight: 4,
            opacity: 1,
            fillColor: '#fca5a5',
            fillOpacity: 0.7
          };
          leafletLayer.setStyle(highlightedStyle);
        
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            leafletLayer.bringToFront();
          }
        
          // Zoom to feature with adjusted zoom level
          const map = mapRef.current;
          if (map) {
            try {
              const bounds = leafletLayer.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds, {
                  padding: [80, 80],
                  maxZoom: 15,
                  animate: true,
                  duration: 0.5
                });
              }
            } catch (error) {
              console.error('Error zooming to feature:', error);
            }
          }
        
          selectedLayerRef.current = leafletLayer;
        }
      
        // Update state
        setHighlightedFeatureId(featureId);
        setSelectedBlockId(featureId);
        setSelectedFeature(feature.properties);
        setSelectedFeatureLayer(layerData.id);
      };


  const closeDetailCard = () => {
  // Reset highlighted feature style
  if (highlightedFeatureId) {
    const prevLayerRef = geoJsonLayersRef.current[highlightedFeatureId];
    if (prevLayerRef && prevLayerRef._originalStyle) {
      prevLayerRef.setStyle(prevLayerRef._originalStyle);
    }
  }

  // Clear all selection states
  setSelectedFeature(null);
  setSelectedFeatureLayer(null);
  setSelectedBlockId(null);
  setHighlightedFeatureId(null);
  selectedLayerRef.current = null;
};



  const toggleNode = (path) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  const handleEstateClick = (estate) => {
    const estateFeatures = [];
    
    // Kumpulkan semua features yang termasuk dalam estate ini
    Object.entries(geojsonData).forEach(([layerId, geoJsonData]) => {
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature, index) => {
          if (feature.properties.ESTATE === estate) {
            estateFeatures.push({
              id: `${layerId}-${index}`,
              layerId: parseInt(layerId),
              feature
            });
          }
        });
      }
    });

    if (estateFeatures.length > 0 && mapRef.current) {
      // Make all related layers visible
      const layerIds = [...new Set(estateFeatures.map(f => f.layerId))];
      layerIds.forEach(layerId => {
        const layer = layers.find(l => l.id === layerId);
        if (layer && !layer.is_visible) {
          toggleLayerVisibility(layerId);
        }
      });

      // Calculate bounds of all features
      setTimeout(() => {
        const allBounds = estateFeatures.map(f => {
          const leafletLayer = geoJsonLayersRef.current[f.id];
          return leafletLayer ? leafletLayer.getBounds() : null;
        }).filter(b => b && b.isValid());

        if (allBounds.length > 0) {
          // Gabungkan semua bounds menjadi satu combined bounds
          const combinedBounds = allBounds[0];
          allBounds.slice(1).forEach(bounds => {
            combinedBounds.extend(bounds);
          });

          // Zoom ke combined bounds
          mapRef.current.fitBounds(combinedBounds, {
            padding: [50, 50],
            maxZoom: 14,
            animate: true,
            duration: 0.5
          });
        }
      }, 300); // Delay untuk memastikan layer sudah di-render
    }
  };

  const handleLayerClick = (estate, layerName, layerId) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    // Make layer visible jika belum
    if (!layer.is_visible) {
      toggleLayerVisibility(layerId);
    }

    // Get all features for this layer under the estate
    const layerFeatures = [];
    const geoJsonData_layer = geojsonData[layerId];

    if (geoJsonData_layer && geoJsonData_layer.features) {
      geoJsonData_layer.features.forEach((feature, index) => {
        if (feature.properties.ESTATE === estate) {
          layerFeatures.push({
            id: `${layerId}-${index}`,
            feature
          });
        }
      });
    }

    if (layerFeatures.length > 0 && mapRef.current) {
      setTimeout(() => {
        // Kumpulkan bounds dari semua features
        const allBounds = layerFeatures.map(f => {
          const leafletLayer = geoJsonLayersRef.current[f.id];
          return leafletLayer ? leafletLayer.getBounds() : null;
        }).filter(b => b && b.isValid());

        if (allBounds.length > 0) {
          // Gabungkan semua bounds
          const combinedBounds = allBounds[0];
          allBounds.slice(1).forEach(bounds => {
            combinedBounds.extend(bounds);
          });

          // Zoom ke combined bounds
          mapRef.current.fitBounds(combinedBounds, {
            padding: [50, 50],
            maxZoom: 14,
            animate: true,
            duration: 0.5
          });
        }
      }, layer.is_visible ? 0 : 300); // Delay jika layer baru di-visible-kan
    }
  };


  const handleBlockClick = (block) => {
    const layer = layers.find(l => l.id === block.layerId);
    if (layer) {
      // Make sure layer is visible
      if (!layer.is_visible) {
        toggleLayerVisibility(layer.id);
      }
      
      // Wait a bit for layer to render if it wasn't visible
      setTimeout(() => {
        handleFeatureSelect(block.id, block.feature, layer);
      }, layer.is_visible ? 0 : 300);
    }
  };

  function MapController() {
    const map = useMap();
    mapRef.current = map;

    useEffect(() => {
      const handleMapClick = () => {
        closeDetailCard();
      };
      
      map.on('click', handleMapClick);
      
      return () => {
        map.off('click', handleMapClick);
      };
    }, [map]);

    return null;
  }

  // Get selected block stats
  const getSelectedBlockStats = () => {
    if (!selectedFeature) {
      return {
        luasKebun: '--',
        produksiTBS: '--',
        tm: '--',
        tbm: '--',
        tahunTanam: '--',
        jmlPokok: '--'
      };
    }

    return {
      luasKebun: selectedFeature.LUAS_HA || '--',
      produksiTBS: selectedFeature.AREAL_PROD || '--',
      tm: selectedFeature.TM || '--',
      tbm: selectedFeature.TBM || '--',
      tahunTanam: selectedFeature.YOP || '--',
      jmlPokok: selectedFeature.JML_POKOK || '--'
    };
  };

  const stats = getSelectedBlockStats();

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-full"}`}>
      {/* Top Info Cards */}
      {/* Top Info Cards - Horizontal Layout */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          {/* Luas Kebun Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 shadow-xl text-white backdrop-blur-sm bg-opacity-95 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white/20 rounded-lg p-1.5">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold opacity-90 uppercase">Luas Kebun</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.luasKebun} {stats.luasKebun !== '--' ? 'Ha' : ''}</div>
            <div className="text-sm opacity-75">{selectedFeature ? `Blok ${selectedFeature.BLOK || '-'}` : 'Pilih blok di panel'}</div>
          </div>

          {/* Produksi TBS Card */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 shadow-xl text-white backdrop-blur-sm bg-opacity-95 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white/20 rounded-lg p-1.5">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold opacity-90 uppercase">Areal Produksi</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.produksiTBS} {stats.produksiTBS !== '--' ? 'Ha' : ''}</div>
            <div className="text-sm opacity-75">TM: {stats.tm} | TBM: {stats.tbm}</div>
          </div>

          {/* Info Tanaman Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 shadow-xl text-white backdrop-blur-sm bg-opacity-95 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white/20 rounded-lg p-1.5">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold opacity-90 uppercase">Info Tanaman</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.tahunTanam}</div>
            <div className="text-sm opacity-75">YOP | Pokok: {stats.jmlPokok}</div>
          </div>
        </div>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-lg shadow-xl border border-gray-200 w-72 max-h-[85vh] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4" />
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
                  className={`p-2.5 border-b border-gray-100 transition-all duration-200 cursor-pointer ${
                    selectedLayerId === layer.id 
                      ? 'bg-blue-100 border-l-4 border-l-blue-500' 
                      : hoveredLayerId === layer.id
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHoveredLayerId(layer.id)}
                  onMouseLeave={() => setHoveredLayerId(null)}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {layer.is_visible ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded border flex-shrink-0"
                          style={{
                            backgroundColor: layer.color,
                            borderColor: layer.stroke_color || layer.color
                          }}
                        />
                        <h4 className="font-medium text-gray-800 text-xs truncate">
                          {layer.name}
                        </h4>
                      </div>
                      {layer.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {layer.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="capitalize text-xs">{layer.geometry_type}</span>
                        <span>•</span>
                        <span className="text-xs">{layer.features_count} features</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tree Navigation Panel */}
      {showTreePanel && (
        <div className="absolute top-20 right-4 z-[1000] bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-[calc(100vh-25rem)] overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <Database className="w-4 h-4" />
              Navigasi Data
            </h3>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2">
            {Object.keys(treeData).length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data</p>
                <p className="text-xs mt-1">Data akan muncul setelah layer dimuat</p>
              </div>
            ) : (
              Object.entries(treeData).map(([estate, layersData]) => (
                <div key={estate} className="mb-2">
                  {/* Estate Level */}
                  <button
                    onClick={() => {
                      toggleNode(`estate-${estate}`);
                      handleEstateClick(estate); // BARU!
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg transition-colors text-left group"
                  >
                    {expandedNodes[`estate-${estate}`] ? (
                      <ChevronDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    )}
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-sm text-gray-800 truncate">{estate}</span>
                  </button>

                  {/* Layers under Estate */}
                  {expandedNodes[`estate-${estate}`] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {Object.entries(layersData).map(([layerName, layerInfo]) => (
                        <div key={`${estate}-${layerName}`}>
                          {/* Layer Level */}
                          <button
                            onClick={() => {
                              toggleNode(`layer-${estate}-${layerName}`);
                              handleLayerClick(estate, layerName, layerInfo.layerId); // BARU!
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-green-50 rounded-lg transition-colors text-left group"
                          >
                            {expandedNodes[`layer-${estate}-${layerName}`] ? (
                              <ChevronDown className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                            )}
                            <Layers className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="font-medium text-xs text-gray-700 truncate">
                              {layerName}
                            </span>
                            <span className="ml-auto text-xs text-gray-500 flex-shrink-0">
                              ({layerInfo.blocks.length})
                            </span>
                          </button>

                          {/* Blocks under Layer */}
                          {expandedNodes[`layer-${estate}-${layerName}`] && (
                            <div className="ml-4 mt-1 space-y-0.5">
                              {layerInfo.blocks.map((block) => (
                                <button
                                  key={block.id}
                                  onClick={() => handleBlockClick(block)}
                                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left group ${
                                    selectedBlockId === block.id
                                      ? 'bg-red-100 border-l-2 border-red-500'
                                      : 'hover:bg-orange-50'
                                  }`}
                                >
                                  <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 group-hover:scale-125 transition-transform" />
                                  <span className={`text-xs truncate ${
                                    selectedBlockId === block.id
                                      ? 'font-semibold text-red-700'
                                      : 'text-gray-600 group-hover:text-orange-700'
                                  }`}>
                                    {block.name}
                                  </span>
                                  {block.feature.properties.LUAS_HA && (
                                    <span className="ml-auto text-xs text-gray-500 flex-shrink-0">
                                      {block.feature.properties.LUAS_HA} Ha
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detail Feature Card - Left Side */}
      {selectedFeature && (
        <div className="absolute bottom-4 left-4 z-[999] bg-white rounded-lg shadow-2xl border-2 border-blue-500 w-95 max-h-[70vh] overflow-hidden flex flex-col pointer-events-auto">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4" />
              Detail Atribut
            </h3>
            <button
              onClick={closeDetailCard}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-3">
            <div className="space-y-3">
              {/* Primary Info - BLOK */}
              {selectedFeature.BLOK && (
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-2.5">
                  <div className="text-xs text-blue-600 font-semibold uppercase mb-0.5">Blok</div>
                  <div className="text-lg font-bold text-blue-900">{selectedFeature.BLOK}</div>
                </div>
              )}

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                {selectedFeature.DIVISI && (
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Divisi</div>
                    <div className="font-semibold text-gray-900 text-sm">{selectedFeature.DIVISI}</div>
                  </div>
                )}
                {selectedFeature.LUAS_HA && (
                  <div className="bg-emerald-50 rounded p-2">
                    <div className="text-xs text-emerald-600 mb-0.5">Luas (Ha)</div>
                    <div className="font-semibold text-emerald-900 text-sm">{selectedFeature.LUAS_HA}</div>
                  </div>
                )}
                {selectedFeature.YOP && (
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-0.5">YOP</div>
                    <div className="font-semibold text-gray-900 text-sm">{selectedFeature.YOP}</div>
                  </div>
                )}
                {selectedFeature.JML_POKOK && (
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-600 mb-0.5">Jumlah Pokok</div>
                    <div className="font-semibold text-gray-900 text-sm">{selectedFeature.JML_POKOK}</div>
                  </div>
                )}
              </div>

              {/* Company Info */}
              {(selectedFeature.NAMA_PT || selectedFeature.ESTATE || selectedFeature.KOPERASI) && (
                <div className="border-t pt-2.5">
                  <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">Informasi Perusahaan</div>
                  <div className="space-y-1.5 text-xs">
                    {selectedFeature.NAMA_PT && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nama PT:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.NAMA_PT}</span>
                      </div>
                    )}
                    {selectedFeature.ESTATE && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estate:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.ESTATE}</span>
                      </div>
                    )}
                    {selectedFeature.KOPERASI && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Koperasi:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.KOPERASI}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Production Info */}
              {(selectedFeature.TM || selectedFeature.TBM || selectedFeature.SPH_NET) && (
                <div className="border-t pt-2.5">
                  <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">Informasi Produksi</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFeature.TM && (
                      <div className="bg-green-50 rounded p-2 text-center">
                        <div className="text-xs text-green-600">TM</div>
                        <div className="font-bold text-green-900 text-sm">{selectedFeature.TM}</div>
                      </div>
                    )}
                    {selectedFeature.TBM && (
                      <div className="bg-yellow-50 rounded p-2 text-center">
                        <div className="text-xs text-yellow-600">TBM</div>
                        <div className="font-bold text-yellow-900 text-sm">{selectedFeature.TBM}</div>
                      </div>
                    )}
                    {selectedFeature.SPH_NET && (
                      <div className="bg-blue-50 rounded p-2 text-center">
                        <div className="text-xs text-blue-600">SPH Net</div>
                        <div className="font-bold text-blue-900 text-sm">{selectedFeature.SPH_NET}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Area Details */}
              {(selectedFeature.AREAL_PROD || selectedFeature.AREAL_KOSO || selectedFeature.AREAL_BELU || selectedFeature.EMPLACEMENT || selectedFeature.AREAL_TIDA) && (
                <div className="border-t pt-2.5">
                  <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">Detail Areal</div>
                  <div className="space-y-1.5 text-xs">
                    {selectedFeature.AREAL_PROD && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Areal Produksi:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.AREAL_PROD} Ha</span>
                      </div>
                    )}
                    {selectedFeature.AREAL_KOSO && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Areal Kosong:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.AREAL_KOSO} Ha</span>
                      </div>
                    )}
                    {selectedFeature.AREAL_BELU && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Areal Belum:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.AREAL_BELU} Ha</span>
                      </div>
                    )}
                    {selectedFeature.EMPLACEMENT && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Emplacement:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.EMPLACEMENT} Ha</span>
                      </div>
                    )}
                    {selectedFeature.AREAL_TIDA && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Areal Tidak:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.AREAL_TIDA} Ha</span>
                      </div>
                    )}
                    {selectedFeature.TOTAL_LUAS && (
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-700">Total Luas:</span>
                        <span className="text-blue-700">{selectedFeature.TOTAL_LUAS} Ha</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Infrastructure */}
              {(selectedFeature.JALAN || selectedFeature.PARIT || selectedFeature.TANGGUL) && (
                <div className="border-t pt-2.5">
                  <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">Infrastruktur</div>
                  <div className="space-y-1.5 text-xs">
                    {selectedFeature.JALAN && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jalan:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.JALAN}</span>
                      </div>
                    )}
                    {selectedFeature.PARIT && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parit:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.PARIT}</span>
                      </div>
                    )}
                    {selectedFeature.TANGGUL && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tanggul:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.TANGGUL}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Environmental */}
              {(selectedFeature.HCV || selectedFeature.HUTAN || selectedFeature.SUNGAI || selectedFeature.POND || selectedFeature.SEMAK) && (
                <div className="border-t pt-2.5">
                  <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">Lingkungan</div>
                  <div className="space-y-1.5 text-xs">
                    {selectedFeature.HCV && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">HCV:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.HCV}</span>
                      </div>
                    )}
                    {selectedFeature.HUTAN && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hutan:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.HUTAN}</span>
                      </div>
                    )}
                    {selectedFeature.SUNGAI && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sungai:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.SUNGAI}</span>
                      </div>
                    )}
                    {selectedFeature.POND && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pond:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.POND}</span>
                      </div>
                    )}
                    {selectedFeature.SEMAK && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Semak:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.SEMAK}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Info */}
              {(selectedFeature.JENIS_BIBI || selectedFeature.KET || selectedFeature.AREA || selectedFeature.RASIO_JALA || selectedFeature.AREAL_TERB || selectedFeature.LAND_CLEAR || selectedFeature.NURSERY || selectedFeature.RENCANA_JA) && (
                <div className="border-t pt-2.5">
                  <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">Informasi Lainnya</div>
                  <div className="space-y-1.5 text-xs">
                    {selectedFeature.JENIS_BIBI && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jenis Bibit:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.JENIS_BIBI}</span>
                      </div>
                    )}
                    {selectedFeature.AREA && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.AREA}</span>
                      </div>
                    )}
                    {selectedFeature.KET && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Keterangan:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.KET}</span>
                      </div>
                    )}
                    {selectedFeature.RASIO_JALA && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rasio Jala:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.RASIO_JALA}</span>
                      </div>
                    )}
                    {selectedFeature.AREAL_TERB && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Areal Terbuka:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.AREAL_TERB}</span>
                      </div>
                    )}
                    {selectedFeature.LAND_CLEAR && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Land Clear:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.LAND_CLEAR}</span>
                      </div>
                    )}
                    {selectedFeature.NURSERY && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nursery:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.NURSERY}</span>
                      </div>
                    )}
                    {selectedFeature.RENCANA_JA && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rencana JA:</span>
                        <span className="font-medium text-gray-900">{selectedFeature.RENCANA_JA}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Panel - TOP RIGHT */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <button
          onClick={refreshLayers}
          disabled={loading}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-colors disabled:opacity-50"
          title="Refresh Layers"
        >
          <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg transition-colors"
          title="Toggle Layer Panel"
        >
          <Layers className="w-5 h-5 text-gray-700" />
        </button>

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

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-20 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-700">Loading layers...</span>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
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
            return geojsonData[layer.id].features.map((feature, index) => {
              const featureId = `${layer.id}-${index}`;
              const style = getLayerStyle(layer, featureId);

              return (
                <GeoJSON
                  key={featureId}
                  data={{
                    type: "Feature",
                    geometry: feature.geometry,
                    properties: feature.properties
                  }}
                  style={style}
                  onEachFeature={onEachFeature(layer, index)}
                />
              );
            });
          }
          return null;
        })}

      </MapContainer>
    </div>
  );
}