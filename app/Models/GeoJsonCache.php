<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class GeoJsonCache extends Model
{
    use HasFactory;

    protected $table = 'geojson_cache';

    protected $fillable = [
        'layer_id',
        'cache_key',
        'cached_data',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    // Relationships
    public function layer()
    {
        return $this->belongsTo(GeoJsonLayer::class, 'layer_id');
    }

    // Scopes
    public function scopeNotExpired($query)
    {
        return $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')
                     ->where('expires_at', '<=', now());
    }

    public function scopeByCacheKey($query, $key)
    {
        return $query->where('cache_key', $key);
    }

    // Accessors
    public function getCachedDataDecodedAttribute()
    {
        return json_decode($this->cached_data, true);
    }

    public function getIsExpiredAttribute()
    {
        if (!$this->expires_at) {
            return false;
        }
        
        return $this->expires_at->isPast();
    }

    // Methods
    public function isValid()
    {
        return !$this->is_expired;
    }

    public function extend($minutes = 60)
    {
        $this->update([
            'expires_at' => now()->addMinutes($minutes),
        ]);
        
        return $this;
    }

    public function refreshCache($data, $expiresInMinutes = null)
    {
        $this->update([
            'cached_data' => is_string($data) ? $data : json_encode($data),
            'expires_at' => $expiresInMinutes ? now()->addMinutes($expiresInMinutes) : null,
        ]);
        
        return $this;
    }

    // Static methods untuk cache management
    public static function remember($layerId, $cacheKey, $expiresInMinutes, callable $callback)
    {
        // Cari cache yang valid
        $cache = static::where('layer_id', $layerId)
                      ->where('cache_key', $cacheKey)
                      ->notExpired()
                      ->first();
        
        if ($cache) {
            return json_decode($cache->cached_data, true);
        }
        
        // Generate data baru
        $data = $callback();
        
        // Simpan ke cache
        static::updateOrCreate(
            [
                'layer_id' => $layerId,
                'cache_key' => $cacheKey,
            ],
            [
                'cached_data' => is_string($data) ? $data : json_encode($data),
                'expires_at' => $expiresInMinutes ? now()->addMinutes($expiresInMinutes) : null,
            ]
        );
        
        return $data;
    }

    public static function forget($layerId, $cacheKey = null)
    {
        $query = static::where('layer_id', $layerId);
        
        if ($cacheKey) {
            $query->where('cache_key', $cacheKey);
        }
        
        return $query->delete();
    }

    public static function clearExpired()
    {
        return static::expired()->delete();
    }

    public static function clearAll()
    {
        return static::truncate();
    }

    // Helper methods untuk cache key generation
    public static function zoomCacheKey($zoomLevel)
    {
        return "zoom_{$zoomLevel}";
    }

    public static function simplificationCacheKey($tolerance)
    {
        return "simplified_{$tolerance}";
    }

    public static function boundsCacheKey($minLat, $minLng, $maxLat, $maxLng)
    {
        return "bounds_{$minLat}_{$minLng}_{$maxLat}_{$maxLng}";
    }

    public static function tileCacheKey($z, $x, $y)
    {
        return "tile_{$z}_{$x}_{$y}";
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        // Auto cleanup expired cache setiap kali create/update
        static::created(function () {
            // Clean expired cache secara periodik (bisa di-trigger lewat scheduled task)
            if (rand(1, 100) === 1) { // 1% chance
                static::clearExpired();
            }
        });
    }
}