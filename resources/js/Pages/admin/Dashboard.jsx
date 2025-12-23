import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { 
  Leaf,
  Package,
  Shield,
  AlertTriangle,
  BarChart3,
  FileText
} from 'lucide-react';
import L from 'leaflet';
import MapView from '@/Layouts/MapView';
import Sidebar from '@/Components/Sidebar';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          {/* Top Cards - 3 Cards Horizontal */}
          <div className="absolute top-6 left-8 right-8 z-[1000] pointer-events-none">
            <div className="grid grid-cols-3 gap-6 max-w-7xl pointer-events-auto">
              {/* Luas Kebun Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-2xl text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">Luas Kebun</span>
                </div>
                <div className="text-4xl font-bold mb-1">105,567 Ha</div>
                <div className="text-sm opacity-75">Total area perkebunan</div>
              </div>

              {/* Produksi TBS Card */}
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 shadow-2xl text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">Produksi TBS</span>
                </div>
                <div className="text-4xl font-bold mb-1">11,052 Ton</div>
                <div className="text-sm opacity-75">Bulan ini</div>
              </div>

              {/* Legalitas Card */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl text-white transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-xl p-2">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold opacity-90 uppercase tracking-wide">Legalitas & HGU</span>
                </div>
                <div className="text-4xl font-bold mb-1">AMAN</div>
                <div className="text-sm opacity-75">Status terkini</div>
              </div>
            </div>
          </div>

          {/* Bottom Left Cards - Stacked Vertically */}
          <div className="absolute bottom-8 left-8 z-[999] space-y-4 pointer-events-none">
            <div className="space-y-4 pointer-events-auto">
              {/* Sustainability Card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl w-80 border border-emerald-100 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-gray-800 text-base">Sustainability</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <span className="text-gray-700">KL Area Lindung</span>
                    </div>
                    <strong className="text-emerald-700">789 Ha</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      <span className="text-gray-700">ISPO/RSPO</span>
                    </div>
                    <strong className="text-emerald-700">97%</strong>
                  </div>
                </div>
              </div>

              {/* Legalitas & HGU Card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl w-80 border border-blue-100 transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-gray-800 text-base">Legalitas & HGU</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">HGU Aktif</span>
                    <strong className="text-blue-700">105,442 Ha</strong>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Masa Berlaku</span>
                    <strong className="text-green-700">Valid</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Card - Status HGU Warning */}
          <div className="absolute bottom-8 right-8 z-[999] pointer-events-none">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-5 shadow-2xl text-white w-80 pointer-events-auto transform hover:scale-105 transition-transform duration-200 border-2 border-orange-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="font-bold text-base">STATUS & HGU</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90 mb-1">Overlap Area</div>
                  <div className="text-3xl font-bold">125 Ha</div>
                  <div className="text-xs opacity-80 mt-1">Perlu perhatian</div>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <MapView />
        </div>
      </div>
    </div>
  );
}