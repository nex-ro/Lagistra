<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataPerkebunan extends Model
{
    use HasFactory;

    protected $table = 'data_perkebunan';

    protected $fillable = [
        'estate_id',
        'tahun',
        'bulan',
        'luas_hgu',
        'luas_areal_dikuasai',
        'total_planted_all',
        'service_jalan_m',
        'budget_service_jalan',
        'persen_service_jalan',
        'penimbunan_jalan_m',
        'budget_penimbunan_jalan',
        'persen_penimbunan_jalan',
        'pengerasan_jalan',
        'budget_pengerasan_jalan',
        'persen_pengerasan_jalan',
        'tanam_baru_inti_pokok',
        'tanam_baru_inti_ha',
        'tanam_sisip_inti_pokok',
        'tanam_baru_plasma_pokok',
        'tanam_baru_plasma_ha',
        'tanam_sisip_plasma_pokok',
        'sph_aktual_inti',
        'total_pokok_inti',
        'sph_aktual_plasma',
        'total_pokok_plasma',
        'areal_produktif_inti',
        'areal_belum_produktif_inti',
        'areal_tidak_produktif_inti',
        'areal_produktif_plasma',
        'areal_belum_produktif_plasma',
        'areal_tidak_produktif_plasma',
        'land_clearing_inti',
        'land_clearing_plasma',
        'ganti_rugi_lahan_total',
    ];

    protected $casts = [
        'tahun' => 'integer',
        'luas_hgu' => 'decimal:2',
        'luas_areal_dikuasai' => 'decimal:2',
        'total_planted_all' => 'decimal:2',
        'service_jalan_m' => 'decimal:2',
        'budget_service_jalan' => 'decimal:2',
        'persen_service_jalan' => 'decimal:2',
        'penimbunan_jalan_m' => 'decimal:2',
        'budget_penimbunan_jalan' => 'decimal:2',
        'persen_penimbunan_jalan' => 'decimal:2',
        'pengerasan_jalan' => 'decimal:2',
        'budget_pengerasan_jalan' => 'decimal:2',
        'persen_pengerasan_jalan' => 'decimal:2',
        'tanam_baru_inti_ha' => 'decimal:2',
        'tanam_baru_plasma_ha' => 'decimal:2',
        'areal_produktif_inti' => 'decimal:2',
        'areal_belum_produktif_inti' => 'decimal:2',
        'areal_tidak_produktif_inti' => 'decimal:2',
        'areal_produktif_plasma' => 'decimal:2',
        'areal_belum_produktif_plasma' => 'decimal:2',
        'areal_tidak_produktif_plasma' => 'decimal:2',
        'land_clearing_inti' => 'decimal:2',
        'land_clearing_plasma' => 'decimal:2',
        'ganti_rugi_lahan_total' => 'decimal:2',
    ];

    /**
     * Relasi ke Estate
     */
    public function estate()
    {
        return $this->belongsTo(Estate::class);
    }

    /**
     * Scope untuk filter berdasarkan tahun
     */
    public function scopeByTahun($query, int $tahun)
    {
        return $query->where('tahun', $tahun);
    }

    /**
     * Scope untuk filter berdasarkan bulan
     */
    public function scopeByBulan($query, string $bulan)
    {
        return $query->where('bulan', $bulan);
    }

    /**
     * Scope untuk filter berdasarkan estate
     */
    public function scopeByEstate($query, int $estateId)
    {
        return $query->where('estate_id', $estateId);
    }

    /**
     * Scope untuk periode tertentu
     */
    public function scopeByPeriode($query, int $tahun, string $bulan)
    {
        return $query->where('tahun', $tahun)->where('bulan', $bulan);
    }

    /**
     * Accessor untuk format bulan tahun
     */
    public function getPeriodeAttribute()
    {
        return "{$this->bulan} {$this->tahun}";
    }
}