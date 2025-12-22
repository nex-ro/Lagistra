<?php

namespace App\Jobs;

use App\Models\GeoJsonLayer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessGeoJsonLayer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $layer;
    public $timeout = 300; // 5 minutes
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(GeoJsonLayer $layer)
    {
        $this->layer = $layer;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Processing GeoJSON layer {$this->layer->id}");

            // Baca file GeoJSON
            $geoJsonContent = $this->layer->getGeoJsonContent();
            
            if (!$geoJsonContent) {
                throw new \Exception('File tidak ditemukan');
            }

            // Parse GeoJSON
            $geoJson = json_decode($geoJsonContent, true);
            
            if (!$geoJson || !isset($geoJson['type'])) {
                throw new \Exception('Format GeoJSON tidak valid');
            }

            // Extract data
            $this->extractMetadata($geoJson);
            $this->calculateBounds($geoJson);
            $this->extractPropertiesSchema($geoJson);
            
            // Mark as ready
            $this->layer->markAsReady();
            
            Log::info("GeoJSON layer {$this->layer->id} processed successfully");

        } catch (\Exception $e) {
            Log::error("Error processing GeoJSON layer {$this->layer->id}: " . $e->getMessage());
            $this->layer->markAsError($e->getMessage());
            throw $e;
        }
    }

    /**
     * Extract metadata dari GeoJSON
     */
    protected function extractMetadata($geoJson)
    {
        $geometryType = 'Unknown';
        $featuresCount = 0;

        if ($geoJson['type'] === 'FeatureCollection') {
            $featuresCount = isset($geoJson['features']) ? count($geoJson['features']) : 0;
            
            // Deteksi tipe geometri
            if ($featuresCount > 0 && isset($geoJson['features'][0]['geometry']['type'])) {
                $geometryType = $geoJson['features'][0]['geometry']['type'];
            }
        } elseif ($geoJson['type'] === 'Feature') {
            $featuresCount = 1;
            $geometryType = $geoJson['geometry']['type'] ?? 'Unknown';
        } else {
            $geometryType = $geoJson['type'];
            $featuresCount = 1;
        }

        $this->layer->update([
            'geometry_type' => $geometryType,
            'features_count' => $featuresCount,
            'crs' => $geoJson['crs']['properties']['name'] ?? 'EPSG:4326',
        ]);
    }

    /**
     * Calculate bounding box dan center
     */
    protected function calculateBounds($geoJson)
    {
        $coordinates = $this->extractAllCoordinates($geoJson);
        
        if (empty($coordinates)) {
            return;
        }

        $lats = array_column($coordinates, 0);
        $lngs = array_column($coordinates, 1);

        $minLat = min($lats);
        $maxLat = max($lats);
        $minLng = min($lngs);
        $maxLng = max($lngs);

        $centerLat = ($minLat + $maxLat) / 2;
        $centerLng = ($minLng + $maxLng) / 2;

        $this->layer->update([
            'bbox_min_lat' => $minLat,
            'bbox_min_lng' => $minLng,
            'bbox_max_lat' => $maxLat,
            'bbox_max_lng' => $maxLng,
            'center_lat' => $centerLat,
            'center_lng' => $centerLng,
        ]);
    }

    /**
     * Extract semua koordinat dari GeoJSON
     */
    protected function extractAllCoordinates($geoJson, &$coords = [])
    {
        if (isset($geoJson['type'])) {
            switch ($geoJson['type']) {
                case 'FeatureCollection':
                    foreach ($geoJson['features'] ?? [] as $feature) {
                        $this->extractAllCoordinates($feature, $coords);
                    }
                    break;
                    
                case 'Feature':
                    if (isset($geoJson['geometry'])) {
                        $this->extractAllCoordinates($geoJson['geometry'], $coords);
                    }
                    break;
                    
                case 'Point':
                    if (isset($geoJson['coordinates'])) {
                        // Point: [lng, lat] -> convert to [lat, lng]
                        $coords[] = [$geoJson['coordinates'][1], $geoJson['coordinates'][0]];
                    }
                    break;
                    
                case 'MultiPoint':
                case 'LineString':
                    foreach ($geoJson['coordinates'] ?? [] as $coord) {
                        $coords[] = [$coord[1], $coord[0]]; // [lng, lat] -> [lat, lng]
                    }
                    break;
                    
                case 'MultiLineString':
                case 'Polygon':
                    foreach ($geoJson['coordinates'] ?? [] as $ring) {
                        foreach ($ring as $coord) {
                            $coords[] = [$coord[1], $coord[0]];
                        }
                    }
                    break;
                    
                case 'MultiPolygon':
                    foreach ($geoJson['coordinates'] ?? [] as $polygon) {
                        foreach ($polygon as $ring) {
                            foreach ($ring as $coord) {
                                $coords[] = [$coord[1], $coord[0]];
                            }
                        }
                    }
                    break;
                    
                case 'GeometryCollection':
                    foreach ($geoJson['geometries'] ?? [] as $geometry) {
                        $this->extractAllCoordinates($geometry, $coords);
                    }
                    break;
            }
        }
        
        return $coords;
    }

    /**
     * Extract schema properties dari features
     */
    protected function extractPropertiesSchema($geoJson)
    {
        $schema = [];
        
        if ($geoJson['type'] === 'FeatureCollection' && !empty($geoJson['features'])) {
            // Ambil properties dari beberapa feature pertama
            $sampleSize = min(10, count($geoJson['features']));
            
            for ($i = 0; $i < $sampleSize; $i++) {
                $properties = $geoJson['features'][$i]['properties'] ?? [];
                
                foreach ($properties as $key => $value) {
                    if (!isset($schema[$key])) {
                        $schema[$key] = [
                            'type' => gettype($value),
                            'sample' => $value,
                        ];
                    }
                }
            }
        } elseif ($geoJson['type'] === 'Feature') {
            $properties = $geoJson['properties'] ?? [];
            
            foreach ($properties as $key => $value) {
                $schema[$key] = [
                    'type' => gettype($value),
                    'sample' => $value,
                ];
            }
        }
        
        if (!empty($schema)) {
            $this->layer->update([
                'properties_schema' => $schema,
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Failed to process GeoJSON layer {$this->layer->id}: " . $exception->getMessage());
        $this->layer->markAsError($exception->getMessage());
    }
}