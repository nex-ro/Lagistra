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

    
    public function geoJsonLayers()
    {
        return $this->hasMany(GeoJsonLayer::class);
    }

    /**
     * Scope untuk filter berdasarkan PT
     */
    public function scopeByPt($query, string $namaPt)
    {
        return $query->where('nama_pt', 'like', "%{$namaPt}%");
    }
}