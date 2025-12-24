import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { 
    Upload, 
    Search, 
    Eye, 
    EyeOff, 
    Pencil, 
    Trash2, 
    Download, 
    MapPin,
    Layers,
    Filter,
    X
} from 'lucide-react';

export default function GeoJsonIndex({ layers, estates, filters }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [search, setSearch] = useState(filters?.search || '');
    const [filterEstate, setFilterEstate] = useState(filters?.estate_id || '');
    console.log(estates);
    const { data, setData, post, put, reset, errors, processing } = useForm({
        file: null,
        name: '',
        description: '',
        estate_id: '',
        color: '#3388ff',
        opacity: 70,
    });

    const openUploadModal = () => {
        reset();
        setShowUploadModal(true);
    };

    const openEditModal = (layer) => {
        setSelectedLayer(layer);
        setData({
            name: layer.name,
            description: layer.description || '',
            estate_id: layer.estate?.id || '',
            color: layer.color,
            opacity: layer.opacity,
        });
        setShowEditModal(true);
    };

    const handleUpload = (e) => {
        e.preventDefault();
        post(route('geojson.upload'), {
            forceFormData: true,
            onSuccess: () => {
                setShowUploadModal(false);
                reset();
            }
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route('geojson.update', selectedLayer.id), {
            onSuccess: () => {
                setShowEditModal(false);
                reset();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus layer ini?')) {
            router.delete(route('geojson.destroy', id));
        }
    };

    const handleToggleVisibility = (id) => {
        router.post(route('geojson.toggle', id));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('geojson.index'), { search, estate_id: filterEstate }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setFilterEstate('');
        router.get(route('geojson.index'));
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            processing: { color: 'bg-yellow-100 text-yellow-800', text: 'Processing' },
            ready: { color: 'bg-green-100 text-green-800', text: 'Ready' },
            error: { color: 'bg-red-100 text-red-800', text: 'Error' },
        };
        
        const config = statusConfig[status] || statusConfig.processing;
        
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                {config.text}
            </span>
        );
    };

    return (
        <>
            <Head title="GeoJSON Layers" />
            
            <div className="min-h-screen flex bg-gray-50">
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-16 lg:pt-0`}>
                    <div className="p-4 sm:p-8">
                        {/* Header */}
                        <div className="mb-6 sm:mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Layers className="w-8 h-8 text-purple-600" />
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">GeoJSON Layers</h1>
                            </div>
                            <p className="text-gray-600 text-sm sm:text-base">Upload dan kelola layer GeoJSON untuk peta</p>
                        </div>

                        {/* Filters & Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Search */}
                                <form onSubmit={handleSearch} className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari layer..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                </form>

                                {/* Filter Estate */}
                                <div className="flex-1 lg:max-w-xs">
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <select
                                            value={filterEstate}
                                            onChange={(e) => setFilterEstate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                                        >
                                            <option value="">Semua Estate</option>
                                            {estates.map(estate => (
                                                <option key={estate.id} value={estate.id}>
                                                    {estate.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {(search || filterEstate) && (
                                        <button
                                            onClick={clearFilters}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="hidden sm:inline">Clear</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={openUploadModal}
                                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                                    >
                                        <Upload className="h-5 w-5" />
                                        <span className="hidden sm:inline">Upload GeoJSON</span>
                                        <span className="sm:hidden">Upload</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Layers Grid */}
                        {layers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {layers.map((layer) => (
                                    <div key={layer.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                        <div className="p-4 sm:p-6">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0 mr-2">
                                                    <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                                        {layer.name}
                                                    </h3>
                                                    {layer.estate && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                                            <MapPin className="h-3 w-3" />
                                                            <span className="truncate">{layer.estate.nama_estate}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {getStatusBadge(layer.status)}
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-2 mb-4 text-xs sm:text-sm text-gray-600">
                                                <div className="flex justify-between">
                                                    <span>File:</span>
                                                    <span className="font-medium truncate ml-2">{layer.file_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Size:</span>
                                                    <span className="font-medium">{layer.file_size}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Features:</span>
                                                    <span className="font-medium">{layer.features_count}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Type:</span>
                                                    <span className="font-medium">{layer.geometry_type || 'N/A'}</span>
                                                </div>
                                                {layer.estate && (
                                                    <div className="flex justify-between">
                                                        <span>PT:</span>
                                                        <span className="font-medium truncate ml-2">{layer.estate.nama_pt}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Color Preview */}
                                            <div className="mb-4">
                                                <div 
                                                    className="h-2 rounded-full"
                                                    style={{ 
                                                        backgroundColor: layer.color,
                                                        opacity: layer.opacity / 100
                                                    }}
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleVisibility(layer.id)}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                                                        layer.is_visible
                                                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                    title={layer.is_visible ? 'Hide' : 'Show'}
                                                >
                                                    {layer.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    <span className="hidden sm:inline">{layer.is_visible ? 'Visible' : 'Hidden'}</span>
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(layer)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <a
                                                    href={route('geojson.download', layer.id)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(layer.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada layer</h3>
                                <p className="text-gray-600 mb-6">Upload file GeoJSON untuk memulai</p>
                                <button
                                    onClick={openUploadModal}
                                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                                >
                                    <Upload className="h-5 w-5" />
                                    Upload GeoJSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">Upload GeoJSON Layer</h2>

                            <form onSubmit={handleUpload}>
                                <div className="space-y-4">
                                    {/* Estate Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estate *
                                        </label>
                                        <select
                                            value={data.estate_id}
                                            onChange={(e) => setData('estate_id', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Pilih Estate</option>
                                            {estates.map(estate => (
                                                <option key={estate.id} value={estate.id}>
                                                    {estate.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.estate_id && (
                                            <p className="text-red-500 text-sm mt-1">{errors.estate_id}</p>
                                        )}
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            File GeoJSON *
                                        </label>
                                        <input
                                            type="file"
                                            accept=".json,.geojson"
                                            onChange={(e) => setData('file', e.target.files[0])}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            required
                                        />
                                        {errors.file && (
                                            <p className="text-red-500 text-sm mt-1">{errors.file}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            Format: .json atau .geojson (Max 50MB)
                                        </p>
                                    </div>

                                    {/* Layer Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Layer
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Kosongkan untuk menggunakan nama file"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows="3"
                                            placeholder="Deskripsi layer (opsional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        {errors.description && (
                                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Color & Opacity */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Warna
                                            </label>
                                            <input
                                                type="color"
                                                value={data.color}
                                                onChange={(e) => setData('color', e.target.value)}
                                                className="w-full h-10 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Opacity ({data.opacity}%)
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={data.opacity}
                                                onChange={(e) => setData('opacity', e.target.value)}
                                                className="w-full mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        disabled={processing}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        disabled={processing}
                                    >
                                        {processing ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedLayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">Edit Layer</h2>

                            <form onSubmit={handleUpdate}>
                                <div className="space-y-4">
                                    {/* Estate Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estate
                                        </label>
                                        <select
                                            value={data.estate_id}
                                            onChange={(e) => setData('estate_id', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="">Pilih Estate</option>
                                            {estates.map(estate => (
                                                <option key={estate.id} value={estate.id}>
                                                    {estate.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.estate_id && (
                                            <p className="text-red-500 text-sm mt-1">{errors.estate_id}</p>
                                        )}
                                    </div>

                                    {/* Layer Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Layer
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        {errors.description && (
                                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Color & Opacity */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Warna
                                            </label>
                                            <input
                                                type="color"
                                                value={data.color}
                                                onChange={(e) => setData('color', e.target.value)}
                                                className="w-full h-10 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Opacity ({data.opacity}%)
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={data.opacity}
                                                onChange={(e) => setData('opacity', e.target.value)}
                                                className="w-full mt-2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        disabled={processing}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        disabled={processing}
                                    >
                                        {processing ? 'Updating...' : 'Update'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}