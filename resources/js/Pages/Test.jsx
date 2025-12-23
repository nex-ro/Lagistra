import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ChevronLeft, 
  ChevronRight, 
  Map, 
  Layers, 
  Database, 
  Settings, 
  BarChart3, 
  FileText, 
  User, 
  LogOut,
  Leaf,
  Package,
  Shield,
  AlertTriangle
} from 'lucide-react';
import L from 'leaflet';
import MapView from '@/Layouts/MapView';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: Map, color: 'emerald' },
    { name: 'Kebun', icon: Layers, color: 'teal' },
    { name: 'Legalitas & HGU', icon: FileText, color: 'blue' },
    { name: 'Produksi', icon: BarChart3, color: 'amber' },
    { name: 'Sustainability', icon: Database, color: 'green' },
    { name: 'Data & Citra', icon: Database, color: 'purple' },
  ];

  const bottomItems = [
    { name: 'Settings', icon: Settings, color: 'slate' },
    { name: 'Profile', icon: User, color: 'slate' },
  ];

  // Sample polygon coordinates for the plantation area
  const plantationPolygon = [
    [0.5, 102.0],
    [0.5, 102.2],
    [0.3, 102.2],
    [0.3, 102.0],
  ];

  // Sample markers
  const markers = [
    { position: [0.45, 102.05], label: 'Blok A' },
    { position: [0.35, 102.15], label: 'Blok B' },
    { position: [0.4, 102.1], label: 'Blok C' },
  ];

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out z-50 shadow-2xl ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/50">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg tracking-tight">S-LeGISTRA</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
              <Leaf className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-slate-800 hover:bg-slate-700 rounded-full p-1.5 shadow-lg border-2 border-slate-600 transition-colors duration-200 z-10"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100vh-8rem)] justify-between py-6">
          {/* Main Menu */}
          <div className="space-y-1 px-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = activeMenu === item.name;
              
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveMenu(item.name)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                    ${active 
                      ? 'bg-emerald-600 shadow-lg' 
                      : 'hover:bg-slate-700/50'
                    }
                  `}
                >
                  {active && (
                    <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                  
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                  
                  {sidebarOpen && (
                    <span className={`font-medium text-sm ${active ? 'text-white' : 'text-slate-300'} group-hover:text-white transition-colors`}>
                      {item.name}
                    </span>
                  )}

                  {!sidebarOpen && hoveredItem === item.name && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl whitespace-nowrap">
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Menu */}
          <div className="space-y-1 px-3 border-t border-slate-700/50 pt-4">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <button
                  key={item.name}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group relative"
                >
                  <Icon className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-white transition-colors" />
                  
                  {sidebarOpen && (
                    <span className="font-medium text-sm text-slate-300 group-hover:text-white transition-colors">
                      {item.name}
                    </span>
                  )}

                  {!sidebarOpen && hoveredItem === item.name && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl whitespace-nowrap">
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                    </div>
                  )}
                </button>
              );
            })}
            
            <button
              onMouseEnter={() => setHoveredItem('Logout')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-red-600/20 transition-all duration-200 group relative"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 group-hover:text-red-300 transition-colors" />
              
              {sidebarOpen && (
                <span className="font-medium text-sm text-red-300 group-hover:text-red-200 transition-colors">
                  Logout
                </span>
              )}

              {!sidebarOpen && hoveredItem === 'Logout' && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl whitespace-nowrap">
                  Logout
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                </div>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="relative h-full">
          {/* Top Cards */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-4">
            {/* Luas Kebun Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-xl flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Luas Kebun</span>
              </div>
              <div className="text-4xl font-bold">105,567 Ha</div>
            </div>

            {/* Produksi TBS Card */}
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 shadow-xl flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">Produksi TBS Bulan Ini</span>
              </div>
              <div className="text-4xl font-bold">11,052 Ton</div>
            </div>

            {/* Legalitas Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-xl flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6" />
                <span className="text-sm font-medium opacity-90">LEGALITAS & HGU</span>
              </div>
              <div className="text-4xl font-bold">AMAN</div>
            </div>
          </div>

          {/* Map Info Cards Overlay */}
          <div className="absolute top-32 left-4 z-[1000] space-y-4">
            {/* Sustainability Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg w-64">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold text-gray-800">Sustainability</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-700">KL Area Lindung: <strong>789 Ha</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-700">ISPO/RSPO Compliance: <strong>97%</strong></span>
                </div>
              </div>
            </div>

            {/* Legalitas Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg w-64">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">Legalitas & HGU</span>
              </div>
            </div>
          </div>

          {/* Status HGU Card */}
          <div className="absolute top-32 right-4 z-[1000]">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-4 shadow-lg text-white w-64">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="font-semibold">STATUTU & HGU</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Overlap Area:</div>
                  <div className="text-2xl font-bold">125 Ha</div>
                </div>
                <AlertTriangle className="w-12 h-12 opacity-80" />
              </div>
            </div>
          </div>

          {/* Map */}
          <MapView/>
        </div>
      </div>
    </div>
  );
}