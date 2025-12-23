import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { Pencil, Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Kebun({ estates, filters }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');

    const { data, setData, post, put, reset, errors } = useForm({
        nama_estate: '',
        nama_pt: '',
        penanggung_jawab: '',
        legalitas: '',
        luas_area: '',
        keterangan: '',
    });

    const openCreateModal = () => {
        reset();
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (estate) => {
        setData({
            id: estate.id,
            nama_estate: estate.nama_estate,
            nama_pt: estate.nama_pt,
            penanggung_jawab: estate.penanggung_jawab,
            legalitas: estate.legalitas || '',
            luas_area: estate.luas_area,
            keterangan: estate.keterangan || '',
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            put(route('kebun.update', data.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post(route('kebun.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus estate ini?')) {
            router.delete(route('kebun.destroy', id));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('kebun.index'), { search }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Manajemen Estate" />
            
            <div className="h-screen flex bg-gray-50">
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} overflow-auto`}>
                    <div className="p-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Manajemen Estate</h1>
                            <p className="text-gray-600 mt-2">Kelola data estate dan kebun</p>
                        </div>

                        {/* Actions Bar */}
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="flex justify-between items-center gap-4">
                                {/* Search */}
                                <form onSubmit={handleSearch} className="flex-1 max-w-md">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari estate, PT, atau penanggung jawab..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                </form>

                                {/* Add Button */}
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Plus className="h-5 w-5" />
                                    Tambah Estate
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nama Estate
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nama PT
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Penanggung Jawab
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Legalitas
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Luas Area (Ha)
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {estates.data.length > 0 ? (
                                            estates.data.map((estate) => (
                                                <tr key={estate.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {estate.nama_estate}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{estate.nama_pt}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{estate.penanggung_jawab}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{estate.legalitas || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{estate.luas_area}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openEditModal(estate)}
                                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(estate.id)}
                                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                    Belum ada data estate
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {estates.data.length > 0 && (
                                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Menampilkan <span className="font-medium">{estates.from}</span> sampai{' '}
                                            <span className="font-medium">{estates.to}</span> dari{' '}
                                            <span className="font-medium">{estates.total}</span> hasil
                                        </div>
                                        <div className="flex gap-2">
                                            {estates.links.map((link, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => link.url && router.visit(link.url)}
                                                    disabled={!link.url}
                                                    className={`px-3 py-1 rounded flex items-center gap-1 ${
                                                        link.active
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {link.label.includes('Previous') && <ChevronLeft className="h-4 w-4" />}
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                    {link.label.includes('Next') && <ChevronRight className="h-4 w-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6">
                                {isEditing ? 'Edit Estate' : 'Tambah Estate Baru'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    {/* Nama Estate */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Estate *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nama_estate}
                                            onChange={(e) => setData('nama_estate', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        {errors.nama_estate && (
                                            <p className="text-red-500 text-sm mt-1">{errors.nama_estate}</p>
                                        )}
                                    </div>

                                    {/* Nama PT */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama PT *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nama_pt}
                                            onChange={(e) => setData('nama_pt', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        {errors.nama_pt && (
                                            <p className="text-red-500 text-sm mt-1">{errors.nama_pt}</p>
                                        )}
                                    </div>

                                    {/* Penanggung Jawab */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Penanggung Jawab *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.penanggung_jawab}
                                            onChange={(e) => setData('penanggung_jawab', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        {errors.penanggung_jawab && (
                                            <p className="text-red-500 text-sm mt-1">{errors.penanggung_jawab}</p>
                                        )}
                                    </div>

                                    {/* Legalitas */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Legalitas
                                        </label>
                                        <input
                                            type="text"
                                            value={data.legalitas}
                                            onChange={(e) => setData('legalitas', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Contoh: HGU, HGB, dll"
                                        />
                                        {errors.legalitas && (
                                            <p className="text-red-500 text-sm mt-1">{errors.legalitas}</p>
                                        )}
                                    </div>

                                    {/* Luas Area */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Luas Area (Hektar) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.luas_area}
                                            onChange={(e) => setData('luas_area', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                        {errors.luas_area && (
                                            <p className="text-red-500 text-sm mt-1">{errors.luas_area}</p>
                                        )}
                                    </div>

                                    {/* Keterangan */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Keterangan
                                        </label>
                                        <textarea
                                            value={data.keterangan}
                                            onChange={(e) => setData('keterangan', e.target.value)}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Informasi tambahan tentang estate..."
                                        />
                                        {errors.keterangan && (
                                            <p className="text-red-500 text-sm mt-1">{errors.keterangan}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        {isEditing ? 'Update' : 'Simpan'}
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