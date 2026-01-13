<?php
// app/Http/Controllers/DataKebunController.php

namespace App\Http\Controllers;

use App\Models\DataPerkebunan;
use App\Models\Estate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DataKebunController extends Controller
{
    public function index(Request $request)
    {
        $query = DataPerkebunan::with('estate')
            ->orderBy('tahun', 'desc')
            ->orderByRaw("FIELD(bulan, 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember') DESC");

        // Filter berdasarkan estate
        if ($request->estate_id) {
            $query->where('estate_id', $request->estate_id);
        }

        // Filter berdasarkan tahun
        if ($request->tahun) {
            $query->where('tahun', $request->tahun);
        }

        // Filter berdasarkan bulan
        if ($request->bulan) {
            $query->where('bulan', $request->bulan);
        }

        $dataKebun = $query->paginate(10)->withQueryString();
        $estates = Estate::orderBy('nama_estate')->get();

        return Inertia::render('admin/Data_Kebun', [
            'dataKebun' => $dataKebun,
            'estates' => $estates,
            'filters' => $request->only(['estate_id', 'tahun', 'bulan']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'estate_id' => 'required|exists:estates,id',
            'tahun' => 'required|integer|min:2000|max:2100',
            'bulan' => 'required|in:Januari,Februari,Maret,April,Mei,Juni,Juli,Agustus,September,Oktober,November,Desember',
            'luas_hgu' => 'nullable|numeric|min:0',
            'luas_areal_dikuasai' => 'nullable|numeric|min:0',
            'total_planted_all' => 'nullable|numeric|min:0',
            'service_jalan_m' => 'nullable|numeric|min:0',
            'budget_service_jalan' => 'nullable|numeric|min:0',
            'persen_service_jalan' => 'nullable|numeric|min:0|max:100',
            'penimbunan_jalan_m' => 'nullable|numeric|min:0',
            'budget_penimbunan_jalan' => 'nullable|numeric|min:0',
            'persen_penimbunan_jalan' => 'nullable|numeric|min:0|max:100',
            'pengerasan_jalan' => 'nullable|numeric|min:0',
            'budget_pengerasan_jalan' => 'nullable|numeric|min:0',
            'persen_pengerasan_jalan' => 'nullable|numeric|min:0|max:100',
            'tanam_baru_inti_pokok' => 'nullable|integer|min:0',
            'tanam_baru_inti_ha' => 'nullable|numeric|min:0',
            'tanam_sisip_inti_pokok' => 'nullable|integer|min:0',
            'tanam_baru_plasma_pokok' => 'nullable|integer|min:0',
            'tanam_baru_plasma_ha' => 'nullable|numeric|min:0',
            'tanam_sisip_plasma_pokok' => 'nullable|integer|min:0',
            'sph_aktual_inti' => 'nullable|integer|min:0',
            'total_pokok_inti' => 'nullable|integer|min:0',
            'sph_aktual_plasma' => 'nullable|integer|min:0',
            'total_pokok_plasma' => 'nullable|integer|min:0',
            'areal_produktif_inti' => 'nullable|numeric|min:0',
            'areal_belum_produktif_inti' => 'nullable|numeric|min:0',
            'areal_tidak_produktif_inti' => 'nullable|numeric|min:0',
            'areal_produktif_plasma' => 'nullable|numeric|min:0',
            'areal_belum_produktif_plasma' => 'nullable|numeric|min:0',
            'areal_tidak_produktif_plasma' => 'nullable|numeric|min:0',
            'land_clearing_inti' => 'nullable|numeric|min:0',
            'land_clearing_plasma' => 'nullable|numeric|min:0',
            'ganti_rugi_lahan_total' => 'nullable|numeric|min:0',
        ], [
            'estate_id.required' => 'Estate harus dipilih',
            'estate_id.exists' => 'Estate tidak valid',
            'tahun.required' => 'Tahun harus diisi',
            'tahun.integer' => 'Tahun harus berupa angka',
            'tahun.min' => 'Tahun minimal 2000',
            'tahun.max' => 'Tahun maksimal 2100',
            'bulan.required' => 'Bulan harus dipilih',
            'bulan.in' => 'Bulan tidak valid',
        ]);

        DataPerkebunan::create($validated);

        return redirect()->route('data-kebun.index')
            ->with('success', 'Data kebun berhasil ditambahkan.');
    }

    public function update(Request $request, DataPerkebunan $dataKebun)
    {
        $validated = $request->validate([
            'estate_id' => 'required|exists:estates,id',
            'tahun' => 'required|integer|min:2000|max:2100',
            'bulan' => 'required|in:Januari,Februari,Maret,April,Mei,Juni,Juli,Agustus,September,Oktober,November,Desember',
            'luas_hgu' => 'nullable|numeric|min:0',
            'luas_areal_dikuasai' => 'nullable|numeric|min:0',
            'total_planted_all' => 'nullable|numeric|min:0',
            'service_jalan_m' => 'nullable|numeric|min:0',
            'budget_service_jalan' => 'nullable|numeric|min:0',
            'persen_service_jalan' => 'nullable|numeric|min:0|max:100',
            'penimbunan_jalan_m' => 'nullable|numeric|min:0',
            'budget_penimbunan_jalan' => 'nullable|numeric|min:0',
            'persen_penimbunan_jalan' => 'nullable|numeric|min:0|max:100',
            'pengerasan_jalan' => 'nullable|numeric|min:0',
            'budget_pengerasan_jalan' => 'nullable|numeric|min:0',
            'persen_pengerasan_jalan' => 'nullable|numeric|min:0|max:100',
            'tanam_baru_inti_pokok' => 'nullable|integer|min:0',
            'tanam_baru_inti_ha' => 'nullable|numeric|min:0',
            'tanam_sisip_inti_pokok' => 'nullable|integer|min:0',
            'tanam_baru_plasma_pokok' => 'nullable|integer|min:0',
            'tanam_baru_plasma_ha' => 'nullable|numeric|min:0',
            'tanam_sisip_plasma_pokok' => 'nullable|integer|min:0',
            'sph_aktual_inti' => 'nullable|integer|min:0',
            'total_pokok_inti' => 'nullable|integer|min:0',
            'sph_aktual_plasma' => 'nullable|integer|min:0',
            'total_pokok_plasma' => 'nullable|integer|min:0',
            'areal_produktif_inti' => 'nullable|numeric|min:0',
            'areal_belum_produktif_inti' => 'nullable|numeric|min:0',
            'areal_tidak_produktif_inti' => 'nullable|numeric|min:0',
            'areal_produktif_plasma' => 'nullable|numeric|min:0',
            'areal_belum_produktif_plasma' => 'nullable|numeric|min:0',
            'areal_tidak_produktif_plasma' => 'nullable|numeric|min:0',
            'land_clearing_inti' => 'nullable|numeric|min:0',
            'land_clearing_plasma' => 'nullable|numeric|min:0',
            'ganti_rugi_lahan_total' => 'nullable|numeric|min:0',
        ], [
            'estate_id.required' => 'Estate harus dipilih',
            'estate_id.exists' => 'Estate tidak valid',
            'tahun.required' => 'Tahun harus diisi',
            'tahun.integer' => 'Tahun harus berupa angka',
            'tahun.min' => 'Tahun minimal 2000',
            'tahun.max' => 'Tahun maksimal 2100',
            'bulan.required' => 'Bulan harus dipilih',
            'bulan.in' => 'Bulan tidak valid',
        ]);

        $dataKebun->update($validated);

        return redirect()->route('data-kebun.index')
            ->with('success', 'Data kebun berhasil diperbarui.');
    }

    public function destroy(DataPerkebunan $dataKebun)
    {
        $dataKebun->delete();

        return redirect()->route('data-kebun.index')
            ->with('success', 'Data kebun berhasil dihapus.');
    }
}