<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class GeoJsonLayer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'estate_id',
        'file_path',
        'file_name',
        'file_hash',
        'file_size',
        'geometry_type',
        'features_count',
        'bbox_min_lat',
        'bbox_min_lng',
        'bbox_max_lat',
        'bbox_max_lng',
        'center_lat',
        'center_lng',
        'properties_schema',
        'color',
        'opacity',
        'stroke_width',
        'stroke_color',
        'is_visible',
        'z_index',
        'crs',
        'metadata',
        'user_id',
        'status',
        'error_message',
    ];

    protected $casts = [
        'properties_schema' => 'array',
        'metadata' => 'array',
        'file_size' => 'integer',
        'features_count' => 'integer',
        'opacity' => 'integer',
        'stroke_width' => 'integer',
        'z_index' => 'integer',
        'is_visible' => 'boolean',
        'bbox_min_lat' => 'decimal:7',
        'bbox_min_lng' => 'decimal:7',
        'bbox_max_lat' => 'decimal:7',
        'bbox_max_lng' => 'decimal:7',
        'center_lat' => 'decimal:7',
        'center_lng' => 'decimal:7',
    ];

    protected $attributes = [
        'color' => '#3388ff',
        'opacity' => 70,
        'stroke_width' => 2,
        'stroke_color' => '#3388ff',
        'is_visible' => true,
        'z_index' => 0,
        'crs' => 'EPSG:4326',
        'status' => 'processing',
        'features_count' => 0,
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function estate()
{
    return $this->belongsTo(Estate::class);
}
  
    public function features()
    {
        return $this->hasMany(GeoJsonFeature::class, 'layer_id');
    }

    public function caches()
    {
        return $this->hasMany(GeoJsonCache::class, 'layer_id');
    }

    // Scopes
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeReady($query)
    {
        return $query->where('status', 'ready');
    }

    public function scopeByGeometryType($query, $type)
    {
        return $query->where('geometry_type', $type);
    }

    public function scopeOrderedByZIndex($query)
    {
        return $query->orderBy('z_index', 'asc');
    }

    // Accessors
    public function getFileUrlAttribute()
    {
        return Storage::url($this->file_path);
    }

    public function getFileSizeHumanAttribute()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getBoundsAttribute()
    {
        if (!$this->bbox_min_lat) return null;
        
        return [
            'southwest' => [$this->bbox_min_lat, $this->bbox_min_lng],
            'northeast' => [$this->bbox_max_lat, $this->bbox_max_lng],
        ];
    }

    public function getCenterAttribute()
    {
        if (!$this->center_lat) return null;
        
        return [$this->center_lat, $this->center_lng];
    }

    // Methods
    public function getGeoJsonContent()
    {
        if (!Storage::exists($this->file_path)) {
            return null;
        }
        
        return Storage::get($this->file_path);
    }

    public function getGeoJsonDecoded()
    {
        $content = $this->getGeoJsonContent();
        return $content ? json_decode($content, true) : null;
    }

    public function markAsReady()
    {
        $this->update([
            'status' => 'ready',
            'error_message' => null,
        ]);
    }

    public function markAsError($message)
    {
        $this->update([
            'status' => 'error',
            'error_message' => $message,
        ]);
    }

    public function isProcessing()
    {
        return $this->status === 'processing';
    }

    public function isReady()
    {
        return $this->status === 'ready';
    }

    public function isError()
    {
        return $this->status === 'error';
    }

    public function deleteFile()
    {
        if (Storage::exists($this->file_path)) {
            Storage::delete($this->file_path);
        }
    }

    // Boot method
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($layer) {
            // Hapus file dari storage saat soft delete
            $layer->deleteFile();
            
            // Hapus cache terkait
            $layer->caches()->delete();
        });

        static::forceDeleting(function ($layer) {
            // Hapus file dari storage saat force delete
            $layer->deleteFile();
        });
    }
    
}