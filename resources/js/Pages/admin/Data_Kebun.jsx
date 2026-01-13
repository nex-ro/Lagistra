import { useState, useEffect } from 'react';
import { router, Link, useForm } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';

export default function DataKebun({ dataKebun, estates, filters, flash }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [filterData, setFilterData] = useState({
    estate_id: filters?.estate_id || '',
    tahun: filters?.tahun || '',
    bulan: filters?.bulan || '',
  });

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    id: '',
    estate_id: '',
    tahun: new Date().getFullYear(),
    bulan: '',
    luas_hgu: '',
    luas_areal_dikuasai: '',
    total_planted_all: '',
    service_jalan_m: '',
    budget_service_jalan: '',
    persen_service_jalan: '',
    penimbunan_jalan_m: '',
    budget_penimbunan_jalan: '',
    persen_penimbunan_jalan: '',
    pengerasan_jalan: '',
    budget_pengerasan_jalan: '',
    persen_pengerasan_jalan: '',
    tanam_baru_inti_pokok: '',
    tanam_baru_inti_ha: '',
    tanam_sisip_inti_pokok: '',
    tanam_baru_plasma_pokok: '',
    tanam_baru_plasma_ha: '',
    tanam_sisip_plasma_pokok: '',
    sph_aktual_inti: '',
    total_pokok_inti: '',
    sph_aktual_plasma: '',
    total_pokok_plasma: '',
    areal_produktif_inti: '',
    areal_belum_produktif_inti: '',
    areal_tidak_produktif_inti: '',
    areal_produktif_plasma: '',
    areal_belum_produktif_plasma: '',
    areal_tidak_produktif_plasma: '',
    land_clearing_inti: '',
    land_clearing_plasma: '',
    ganti_rugi_lahan_total: '',
  });

  const bulanOptions = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const openModalCreate = () => {
    setIsEdit(false);
    reset();
    clearErrors();
    setIsModalOpen(true);
  };

  const openModalEdit = (item) => {
    setIsEdit(true);
    clearErrors();
    setData({
      id: item.id,
      estate_id: item.estate_id || '',
      tahun: item.tahun || new Date().getFullYear(),
      bulan: item.bulan || '',
      luas_hgu: item.luas_hgu || '',
      luas_areal_dikuasai: item.luas_areal_dikuasai || '',
      total_planted_all: item.total_planted_all || '',
      service_jalan_m: item.service_jalan_m || '',
      budget_service_jalan: item.budget_service_jalan || '',
      persen_service_jalan: item.persen_service_jalan || '',
      penimbunan_jalan_m: item.penimbunan_jalan_m || '',
      budget_penimbunan_jalan: item.budget_penimbunan_jalan || '',
      persen_penimbunan_jalan: item.persen_penimbunan_jalan || '',
      pengerasan_jalan: item.pengerasan_jalan || '',
      budget_pengerasan_jalan: item.budget_pengerasan_jalan || '',
      persen_pengerasan_jalan: item.persen_pengerasan_jalan || '',
      tanam_baru_inti_pokok: item.tanam_baru_inti_pokok || '',
      tanam_baru_inti_ha: item.tanam_baru_inti_ha || '',
      tanam_sisip_inti_pokok: item.tanam_sisip_inti_pokok || '',
      tanam_baru_plasma_pokok: item.tanam_baru_plasma_pokok || '',
      tanam_baru_plasma_ha: item.tanam_baru_plasma_ha || '',
      tanam_sisip_plasma_pokok: item.tanam_sisip_plasma_pokok || '',
      sph_aktual_inti: item.sph_aktual_inti || '',
      total_pokok_inti: item.total_pokok_inti || '',
      sph_aktual_plasma: item.sph_aktual_plasma || '',
      total_pokok_plasma: item.total_pokok_plasma || '',
      areal_produktif_inti: item.areal_produktif_inti || '',
      areal_belum_produktif_inti: item.areal_belum_produktif_inti || '',
      areal_tidak_produktif_inti: item.areal_tidak_produktif_inti || '',
      areal_produktif_plasma: item.areal_produktif_plasma || '',
      areal_belum_produktif_plasma: item.areal_belum_produktif_plasma || '',
      areal_tidak_produktif_plasma: item.areal_tidak_produktif_plasma || '',
      land_clearing_inti: item.land_clearing_inti || '',
      land_clearing_plasma: item.land_clearing_plasma || '',
      ganti_rugi_lahan_total: item.ganti_rugi_lahan_total || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    clearErrors();
  };

  const handleSubmit = () => {
    if (isEdit) {
      put(route('data-kebun.update', data.id), {
        onSuccess: () => closeModal(),
      });
    } else {
      post(route('data-kebun.store'), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const handleFilter = () => {
    router.get(route('data-kebun.index'), filterData, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setFilterData({ estate_id: '', tahun: '', bulan: '' });
    router.get(route('data-kebun.index'));
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      router.delete(route('data-kebun.destroy', id));
    }
  };

  const FormSection = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-slate-700 mb-3 pb-2 border-b">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, name, type = "text", step = "0.01", required = false }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={data[name]}
        onChange={(e) => setData(name, e.target.value)}
        step={type === "number" ? step : undefined}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          errors[name] ? 'border-red-500' : 'border-slate-300'
        }`}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {/* Flash Message */}
          {flash?.success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {flash.success}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Data Kebun</h1>
              <p className="text-slate-600 mt-1">Kelola data perkebunan estate</p>
            </div>
            <button
              onClick={openModalCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Tambah Data
            </button>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Filter Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estate</label>
                <select
                  value={filterData.estate_id}
                  onChange={(e) => setFilterData({ ...filterData, estate_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Estate</option>
                  {estates?.map((estate) => (
                    <option key={estate.id} value={estate.id}>{estate.nama_estate}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                <input
                  type="number"
                  value={filterData.tahun}
                  onChange={(e) => setFilterData({ ...filterData, tahun: e.target.value })}
                  placeholder="2024"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                <select
                  value={filterData.bulan}
                  onChange={(e) => setFilterData({ ...filterData, bulan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Bulan</option>
                  {bulanOptions.map((bulan) => (
                    <option key={bulan} value={bulan}>{bulan}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleFilter}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Filter
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Luas HGU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Planted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {dataKebun?.data?.length > 0 ? (
                    dataKebun.data.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {dataKebun.from + index}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {item.estate?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {item.bulan} {item.tahun}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {item.luas_hgu ? `${parseFloat(item.luas_hgu).toFixed(2)} Ha` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {item.total_planted_all ? `${parseFloat(item.total_planted_all).toFixed(2)} Ha` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModalEdit(item)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {dataKebun?.last_page > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-slate-700">
                  Menampilkan {dataKebun.from} - {dataKebun.to} dari {dataKebun.total} data
                </div>
                <div className="flex gap-2">
                  {dataKebun.links.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => link.url && router.visit(link.url)}
                      disabled={!link.url}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className={`px-3 py-1 rounded ${
                        link.active
                          ? 'bg-blue-600 text-white'
                          : link.url
                          ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEdit ? 'Edit Data Kebun' : 'Tambah Data Kebun'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FormSection title="Informasi Dasar">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estate <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.estate_id}
                    onChange={(e) => setData('estate_id', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.estate_id ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Pilih Estate</option>
                    {estates?.map((estate) => (
                      <option key={estate.id} value={estate.id}>{estate.name}</option>
                    ))}
                  </select>
                  {errors.estate_id && <p className="text-red-500 text-xs mt-1">{errors.estate_id}</p>}
                </div>

                <InputField label="Tahun" name="tahun" type="number" step="1" required />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bulan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.bulan}
                    onChange={(e) => setData('bulan', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.bulan ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Pilih Bulan</option>
                    {bulanOptions.map((bulan) => (
                      <option key={bulan} value={bulan}>{bulan}</option>
                    ))}
                  </select>
                  {errors.bulan && <p className="text-red-500 text-xs mt-1">{errors.bulan}</p>}
                </div>
              </FormSection>

              <FormSection title="Luas Areal">
                <InputField label="Luas HGU (Ha)" name="luas_hgu" type="number" />
                <InputField label="Luas Areal Dikuasai (Ha)" name="luas_areal_dikuasai" type="number" />
                <InputField label="Total Planted All (Ha)" name="total_planted_all" type="number" />
              </FormSection>

              <FormSection title="Service Jalan">
                <InputField label="Service Jalan (M)" name="service_jalan_m" type="number" />
                <InputField label="Budget Service Jalan" name="budget_service_jalan" type="number" />
                <InputField label="Persen Service Jalan (%)" name="persen_service_jalan" type="number" />
              </FormSection>

              <FormSection title="Penimbunan Jalan">
                <InputField label="Penimbunan Jalan (M)" name="penimbunan_jalan_m" type="number" />
                <InputField label="Budget Penimbunan Jalan" name="budget_penimbunan_jalan" type="number" />
                <InputField label="Persen Penimbunan Jalan (%)" name="persen_penimbunan_jalan" type="number" />
              </FormSection>

              <FormSection title="Pengerasan Jalan">
                <InputField label="Pengerasan Jalan" name="pengerasan_jalan" type="number" />
                <InputField label="Budget Pengerasan Jalan" name="budget_pengerasan_jalan" type="number" />
                <InputField label="Persen Pengerasan Jalan (%)" name="persen_pengerasan_jalan" type="number" />
              </FormSection>

              <FormSection title="Tanam Baru & Sisip Inti">
                <InputField label="Tanam Baru Inti (Pokok)" name="tanam_baru_inti_pokok" type="number" step="1" />
                <InputField label="Tanam Baru Inti (Ha)" name="tanam_baru_inti_ha" type="number" />
                <InputField label="Tanam Sisip Inti (Pokok)" name="tanam_sisip_inti_pokok" type="number" step="1" />
              </FormSection>

              <FormSection title="Tanam Baru & Sisip Plasma">
                <InputField label="Tanam Baru Plasma (Pokok)" name="tanam_baru_plasma_pokok" type="number" step="1" />
                <InputField label="Tanam Baru Plasma (Ha)" name="tanam_baru_plasma_ha" type="number" />
                <InputField label="Tanam Sisip Plasma (Pokok)" name="tanam_sisip_plasma_pokok" type="number" step="1" />
              </FormSection>

              <FormSection title="Data Pokok Inti">
                <InputField label="SPH Aktual Inti" name="sph_aktual_inti" type="number" step="1" />
                <InputField label="Total Pokok Inti" name="total_pokok_inti" type="number" step="1" />
              </FormSection>

              <FormSection title="Data Pokok Plasma">
                <InputField label="SPH Aktual Plasma" name="sph_aktual_plasma" type="number" step="1" />
                <InputField label="Total Pokok Plasma" name="total_pokok_plasma" type="number" step="1" />
              </FormSection>

              <FormSection title="Areal Inti">
                <InputField label="Areal Produktif Inti (Ha)" name="areal_produktif_inti" type="number" />
                <InputField label="Areal Belum Produktif Inti (Ha)" name="areal_belum_produktif_inti" type="number" />
                <InputField label="Areal Tidak Produktif Inti (Ha)" name="areal_tidak_produktif_inti" type="number" />
              </FormSection>

              <FormSection title="Areal Plasma">
                <InputField label="Areal Produktif Plasma (Ha)" name="areal_produktif_plasma" type="number" />
                <InputField label="Areal Belum Produktif Plasma (Ha)" name="areal_belum_produktif_plasma" type="number" />
                <InputField label="Areal Tidak Produktif Plasma (Ha)" name="areal_tidak_produktif_plasma" type="number" />
              </FormSection>

              <FormSection title="Land Clearing & Ganti Rugi">
                <InputField label="Land Clearing Inti (Ha)" name="land_clearing_inti" type="number" />
                <InputField label="Land Clearing Plasma (Ha)" name="land_clearing_plasma" type="number" />
                <InputField label="Ganti Rugi Lahan Total" name="ganti_rugi_lahan_total" type="number" />
              </FormSection>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {processing ? 'Menyimpan...' : isEdit ? 'Update Data' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}