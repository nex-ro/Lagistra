import React, { useState, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Upload, File, MapPin, Trash2, Eye, EyeOff, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function GeoJsonIndex({ layers = [] }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        name: '',
        description: '',
        color: '#3388ff',
        opacity: 70,
    });

    // Handle file selection
    const handleFileSelect = (file) => {
        if (file && (file.name.endsWith('.json') || file.name.endsWith('.geojson'))) {
            setSelectedFile(file);
            setData('file', file);
            if (!data.name) {
                setData('name', file.name.replace(/\.(json|geojson)$/, ''));
            }
        }
    };

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Handle file input change
    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('geojson.upload'), {
            onSuccess: () => {
                reset();
                setSelectedFile(null);
            },
        });
    };

    // Toggle visibility
    const toggleVisibility = (layerId) => {
        router.post(route('geojson.toggle-visibility', layerId));
    };

    // Delete layer
    const deleteLayer = (layerId) => {
        if (confirm('Apakah Anda yakin ingin menghapus layer ini?')) {
            router.delete(route('geojson.destroy', layerId));
        }
    };

    // Download layer
    const downloadLayer = (layerId) => {
        window.location.href = route('geojson.download', layerId);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            processing: { icon: Loader, text: 'Processing', class: 'bg-yellow-100 text-yellow-800' },
            ready: { icon: CheckCircle, text: 'Ready', class: 'bg-green-100 text-green-800' },
            error: { icon: AlertCircle, text: 'Error', class: 'bg-red-100 text-red-800' },
        };
        const badge = badges[status] || badges.processing;
        const Icon = badge.icon;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                <Icon className="w-3 h-3 mr-1" />
                {badge.text}
            </span>
        );
    };

    return (
        <>
            <Head title="GeoJSON Layers" />
            
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">GeoJSON Layers</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Upload dan kelola file GeoJSON Anda
                        </p>
                    </div>

                    {/* Upload Form */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload GeoJSON</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* File Drop Zone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    File GeoJSON
                                </label>
                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                        dragActive 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json,.geojson"
                                        onChange={handleFileInputChange}
                                        className="hidden"
                                    />
                                    
                                    {selectedFile ? (
                                        <div className="flex items-center justify-center space-x-3">
                                            <File className="w-8 h-8 text-blue-500" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setData('file', null);
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded"
                                            >
                                                <Trash2 className="w-5 h-5 text-red-500" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                Drag & drop file GeoJSON atau{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    pilih file
                                                </button>
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Format: .json, .geojson (Max 50MB)
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {errors.file && (
                                    <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Layer
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Masukkan nama layer"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Warna
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                            className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Opacity ({data.opacity}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={data.opacity}
                                        onChange={(e) => setData('opacity', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Masukkan deskripsi layer (opsional)"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing || !selectedFile}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            <span>Upload</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Layers List */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Layers ({layers.length})</h2>
                        </div>
                        
                        {layers.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada layer</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Upload file GeoJSON untuk memulai
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {layers.map((layer) => (
                                    <div key={layer.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">
                                                        {layer.name}
                                                    </h3>
                                                    {getStatusBadge(layer.status)}
                                                </div>
                                                
                                                {layer.description && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {layer.description}
                                                    </p>
                                                )}
                                                
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center">
                                                        <File className="w-4 h-4 mr-1" />
                                                        {layer.file_name}
                                                    </span>
                                                    <span>{layer.file_size}</span>
                                                    <span>{layer.geometry_type}</span>
                                                    <span>{layer.features_count} features</span>
                                                    <span>{layer.created_at}</span>
                                                </div>
                                                
                                                {layer.error_message && (
                                                    <div className="mt-2 text-sm text-red-600 flex items-start">
                                                        <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                                                        <span>{layer.error_message}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="mt-3 flex items-center space-x-2">
                                                    <div
                                                        className="w-6 h-6 rounded border border-gray-300"
                                                        style={{ backgroundColor: layer.color }}
                                                    />
                                                    <span className="text-xs text-gray-500">
                                                        Opacity: {layer.opacity}%
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="ml-4 flex items-center space-x-2">
                                                <button
                                                    onClick={() => toggleVisibility(layer.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title={layer.is_visible ? 'Hide' : 'Show'}
                                                >
                                                    {layer.is_visible ? (
                                                        <Eye className="w-5 h-5 text-gray-600" />
                                                    ) : (
                                                        <EyeOff className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                                
                                                <button
                                                    onClick={() => downloadLayer(layer.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-5 h-5 text-gray-600" />
                                                </button>
                                                
                                                <button
                                                    onClick={() => deleteLayer(layer.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}