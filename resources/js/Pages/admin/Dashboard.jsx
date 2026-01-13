import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapView from '@/Layouts/MapView';
import Sidebar from '@/Components/Sidebar';
import axios from 'axios';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const response = await axios.get('/api/layers');
        if (response.data.success) {
          setLayers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching layers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayers();
  }, []);

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="relative h-full">
          {/* Map */}
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-600">Loading map...</div>
            </div>
          ) : (
            <MapView initialLayers={layers} />
          )}
        </div>
      </div>
    </div>
  );
}