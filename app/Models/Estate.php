<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Estate extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_estate',
        'nama_pt',
        'penanggung_jawab',
        'legalitas',
        'luas_area',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_mulai_hgu' => 'date',
        'tanggal_berakhir_hgu' => 'date',
        'luas_area' => 'decimal:2',
    ];

    /**
     * Relasi ke GeoJsonLayer
     */
    public function geoJsonLayers()
    {
        return $this->hasMany(GeoJsonLayer::class);
    }

    /**
     * Relasi ke DataPerkebunan
     */
    public function dataPerkebunan()
    {
        return $this->hasMany(DataPerkebunan::class);
    }

    /**
     * Get data perkebunan untuk tahun tertentu
     */
    public function dataPerkebunanByTahun(int $tahun)
    {
        return $this->dataPerkebunan()->where('tahun', $tahun);
    }

    /**
     * Get data perkebunan untuk periode tertentu
     */
    public function dataPerkebunanByPeriode(int $tahun, string $bulan)
    {
        return $this->dataPerkebunan()
            ->where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->first();
    }

    /**
     * Scope untuk filter berdasarkan PT
     */
    public function scopeByPt($query, string $namaPt)
    {
        return $query->where('nama_pt', 'like', "%{$namaPt}%");
    }
}