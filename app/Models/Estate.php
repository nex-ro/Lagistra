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
        'tanggal_mulai_hgu',
        'tanggal_berakhir_hgu',
        'luas_area',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_mulai_hgu' => 'date',
        'tanggal_berakhir_hgu' => 'date',
        'luas_area' => 'decimal:2',
    ];

    /**
     * Get status HGU berdasarkan tanggal berakhir
     */
    public function getStatusHguAttribute(): string
    {
        if (!$this->tanggal_berakhir_hgu) {
            return 'Tidak ada data';
        }

        $now = Carbon::now();
        $berakhir = Carbon::parse($this->tanggal_berakhir_hgu);
        
        if ($berakhir->isPast()) {
            return 'Kadaluarsa';
        }
        
        $sisaBulan = $now->diffInMonths($berakhir);
        
        if ($sisaBulan <= 12) {
            return 'Segera Berakhir';
        }
        
        if ($sisaBulan <= 24) {
            return 'Perlu Perpanjangan';
        }
        
        return 'Aktif';
    }

    /**
     * Get sisa hari HGU
     */
    public function getSisaHariHguAttribute(): ?int
    {
        if (!$this->tanggal_berakhir_hgu) {
            return null;
        }

        $now = Carbon::now();
        $berakhir = Carbon::parse($this->tanggal_berakhir_hgu);
        
        if ($berakhir->isPast()) {
            return 0;
        }
        
        return $now->diffInDays($berakhir);
    }

    /**
     * Get masa berlaku HGU dalam tahun
     */
    public function getMasaBerlakuTahunAttribute(): ?int
    {
        if (!$this->tanggal_mulai_hgu || !$this->tanggal_berakhir_hgu) {
            return null;
        }

        $mulai = Carbon::parse($this->tanggal_mulai_hgu);
        $berakhir = Carbon::parse($this->tanggal_berakhir_hgu);
        
        return $mulai->diffInYears($berakhir);
    }

    /**
     * Scope untuk estate dengan HGU aktif
     */
    public function scopeHguAktif($query)
    {
        return $query->where('tanggal_berakhir_hgu', '>', Carbon::now());
    }

    /**
     * Scope untuk estate dengan HGU segera berakhir (dalam 12 bulan)
     */
    public function scopeHguSegaBerakhir($query)
    {
        return $query->whereBetween('tanggal_berakhir_hgu', [
            Carbon::now(),
            Carbon::now()->addMonths(12)
        ]);
    }

    /**
     * Scope untuk estate dengan HGU kadaluarsa
     */
    public function scopeHguKadaluarsa($query)
    {
        return $query->where('tanggal_berakhir_hgu', '<', Carbon::now());
    }

    /**
     * Scope untuk filter berdasarkan legalitas
     */
    public function scopeByLegalitas($query, string $legalitas)
    {
        return $query->where('legalitas', $legalitas);
    }

    /**
     * Scope untuk filter berdasarkan PT
     */
    public function scopeByPt($query, string $namaPt)
    {
        return $query->where('nama_pt', 'like', "%{$namaPt}%");
    }
}