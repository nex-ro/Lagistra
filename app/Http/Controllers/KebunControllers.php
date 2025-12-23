<?php

namespace App\Http\Controllers;

use App\Models\Estate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KebunControllers extends Controller
{
    /**
     * Display a listing of estates
     */
    public function index(Request $request)
    {
        $query = Estate::query();

        // Filter berdasarkan PT jika ada
        if ($request->filled('pt')) {
            $query->byPt($request->pt);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_estate', 'like', "%{$search}%")
                  ->orWhere('nama_pt', 'like', "%{$search}%")
                  ->orWhere('penanggung_jawab', 'like', "%{$search}%");
            });
        }

        $estates = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('admin/Kebun', [
            'estates' => $estates,
            'filters' => $request->only(['search', 'pt'])
        ]);
    }

    /**
     * Store a newly created estate
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_estate' => 'required|string|max:255',
            'nama_pt' => 'required|string|max:255',
            'penanggung_jawab' => 'required|string|max:255',
            'legalitas' => 'nullable|string|max:255',
            'luas_area' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
        ]);

        Estate::create($validated);

        return redirect()->back()->with('success', 'Estate berhasil ditambahkan');
    }

    /**
     * Update the specified estate
     */
    public function update(Request $request, Estate $estate)
    {
        $validated = $request->validate([
            'nama_estate' => 'required|string|max:255',
            'nama_pt' => 'required|string|max:255',
            'penanggung_jawab' => 'required|string|max:255',
            'legalitas' => 'nullable|string|max:255',
            'luas_area' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
        ]);

        $estate->update($validated);

        return redirect()->back()->with('success', 'Estate berhasil diupdate');
    }

    /**
     * Remove the specified estate
     */
    public function destroy(Estate $estate)
    {
        $estate->delete();

        return redirect()->back()->with('success', 'Estate berhasil dihapus');
    }
}