<?php

namespace App\Jobs;

use App\Models\GeoJsonLayer;
use App\Services\GeoJsonProcessorService;
use App\Services\CoordinateTransformService;
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
    public function handle(
        GeoJsonProcessorService $processor,
        CoordinateTransformService $coordinateTransform
    ): void
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

            // Detect original CRS
            $originalCRS = $coordinateTransform->detectCRS($geoJson);
            Log::info("Detected CRS: {$originalCRS} for layer {$this->layer->id}");
            
            // Transform ke WGS84 jika bukan WGS84
            if ($coordinateTransform->needsTransformation($originalCRS)) {
                Log::info("Transforming layer {$this->layer->id} from {$originalCRS} to EPSG:4326");
                
                try {
                    // Transform GeoJSON
                    $geoJson = $processor->transformToWGS84($geoJson);
                    
                    // Simpan file yang sudah ditransform
                    $transformedPath = str_replace('/original/', '/transformed/', $this->layer->file_path);
                    
                    // Pastikan direktori exists
                    $directory = dirname($transformedPath);
                    if (!Storage::exists($directory)) {
                        Storage::makeDirectory($directory);
                    }
                    
                    Storage::put($transformedPath, json_encode($geoJson));
                    
                    Log::info("Transformed file saved to: {$transformedPath}");
                    
                    // Update layer dengan path baru dan metadata
                    $this->layer->update([
                        'file_path' => $transformedPath,
                        'metadata' => array_merge($this->layer->metadata ?? [], [
                            'original_crs' => $originalCRS,
                            'original_file_path' => $this->layer->file_path,
                            'transformed' => true,
                            'transformed_at' => now()->toIso8601String(),
                        ]),
                    ]);
                    
                } catch (\Exception $e) {
                    Log::error("Failed to transform coordinates for layer {$this->layer->id}: " . $e->getMessage());
                    throw new \Exception("Gagal mentransform koordinat: " . $e->getMessage());
                }
            } else {
                Log::info("Layer {$this->layer->id} is already in WGS84, no transformation needed");
            }

            // Extract metadata dari GeoJSON
            $this->extractMetadata($geoJson);
            
            // Calculate bounding box dan center
            $this->calculateBounds($geoJson);
            
            // Extract properties schema
            $this->extractPropertiesSchema($geoJson);
            
            // Mark as ready
            $this->layer->markAsReady();
            
            Log::info("GeoJSON layer {$this->layer->id} processed successfully");

        } catch (\Exception $e) {
            Log::error("Error processing GeoJSON layer {$this->layer->id}: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
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
            
            // Deteksi tipe geometri dari feature pertama
            if ($featuresCount > 0 && isset($geoJson['features'][0]['geometry']['type'])) {
                $geometryType = $geoJson['features'][0]['geometry']['type'];
                
                // Cek apakah semua feature punya tipe yang sama
                $allSameType = true;
                foreach ($geoJson['features'] as $feature) {
                    if (isset($feature['geometry']['type']) && $feature['geometry']['type'] !== $geometryType) {
                        $allSameType = false;
                        break;
                    }
                }
                
                if (!$allSameType) {
                    $geometryType = 'Mixed';
                }
            }
        } elseif ($geoJson['type'] === 'Feature') {
            $featuresCount = 1;
            $geometryType = $geoJson['geometry']['type'] ?? 'Unknown';
        } else {
            // Direct geometry type
            $geometryType = $geoJson['type'];
            $featuresCount = 1;
        }

        $this->layer->update([
            'geometry_type' => $geometryType,
            'features_count' => $featuresCount,
            'crs' => 'EPSG:4326', // Setelah transformasi, selalu WGS84
        ]);
        
        Log::info("Metadata extracted for layer {$this->layer->id}: type={$geometryType}, count={$featuresCount}");
    }

    /**
     * Calculate bounding box dan center
     */
    protected function calculateBounds($geoJson)
    {
        $coordinates = $this->extractAllCoordinates($geoJson);
        
        if (empty($coordinates)) {
            Log::warning("No coordinates found for layer {$this->layer->id}");
            return;
        }

        // Koordinat sekarang dalam format [lng, lat] (WGS84)
        $lngs = array_column($coordinates, 0);
        $lats = array_column($coordinates, 1);

        // Filter koordinat yang valid (lng: -180 to 180, lat: -90 to 90)
        $validCoords = array_filter($coordinates, function($coord) {
            return $coord[0] >= -180 && $coord[0] <= 180 && 
                   $coord[1] >= -90 && $coord[1] <= 90;
        });
        
        if (empty($validCoords)) {
            Log::warning("No valid coordinates found for layer {$this->layer->id}");
            return;
        }
        
        $lngs = array_column($validCoords, 0);
        $lats = array_column($validCoords, 1);

        $minLng = min($lngs);
        $maxLng = max($lngs);
        $minLat = min($lats);
        $maxLat = max($lats);

        $centerLng = ($minLng + $maxLng) / 2;
        $centerLat = ($minLat + $maxLat) / 2;

        $this->layer->update([
            'bbox_min_lng' => $minLng,
            'bbox_max_lng' => $maxLng,
            'bbox_min_lat' => $minLat,
            'bbox_max_lat' => $maxLat,
            'center_lng' => $centerLng,
            'center_lat' => $centerLat,
        ]);
        
        Log::info("Bounds calculated for layer {$this->layer->id}: [{$minLng},{$minLat}] to [{$maxLng},{$maxLat}]");
    }

    /**
     * Extract semua koordinat dari GeoJSON
     * Return koordinat dalam format [lng, lat] (WGS84)
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
                    if (isset($geoJson['coordinates']) && is_array($geoJson['coordinates'])) {
                        // Point: [lng, lat]
                        $coords[] = $geoJson['coordinates'];
                    }
                    break;
                    
                case 'MultiPoint':
                case 'LineString':
                    foreach ($geoJson['coordinates'] ?? [] as $coord) {
                        if (is_array($coord) && count($coord) >= 2) {
                            $coords[] = [$coord[0], $coord[1]]; // [lng, lat]
                        }
                    }
                    break;
                    
                case 'MultiLineString':
                case 'Polygon':
                    foreach ($geoJson['coordinates'] ?? [] as $ring) {
                        foreach ($ring as $coord) {
                            if (is_array($coord) && count($coord) >= 2) {
                                $coords[] = [$coord[0], $coord[1]];
                            }
                        }
                    }
                    break;
                    
                case 'MultiPolygon':
                    foreach ($geoJson['coordinates'] ?? [] as $polygon) {
                        foreach ($polygon as $ring) {
                            foreach ($ring as $coord) {
                                if (is_array($coord) && count($coord) >= 2) {
                                    $coords[] = [$coord[0], $coord[1]];
                                }
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
            // Ambil properties dari beberapa feature pertama untuk sampling
            $sampleSize = min(10, count($geoJson['features']));
            
            for ($i = 0; $i < $sampleSize; $i++) {
                $properties = $geoJson['features'][$i]['properties'] ?? [];
                
                foreach ($properties as $key => $value) {
                    if (!isset($schema[$key])) {
                        $schema[$key] = [
                            'type' => $this->getValueType($value),
                            'sample' => $value,
                            'nullable' => false,
                        ];
                    } elseif ($value === null) {
                        $schema[$key]['nullable'] = true;
                    }
                }
            }
        } elseif ($geoJson['type'] === 'Feature') {
            $properties = $geoJson['properties'] ?? [];
            
            foreach ($properties as $key => $value) {
                $schema[$key] = [
                    'type' => $this->getValueType($value),
                    'sample' => $value,
                    'nullable' => $value === null,
                ];
            }
        }
        
        if (!empty($schema)) {
            $this->layer->update([
                'properties_schema' => $schema,
            ]);
            
            Log::info("Properties schema extracted for layer {$this->layer->id}: " . count($schema) . " properties");
        }
    }

    /**
     * Get value type yang lebih detail
     */
    protected function getValueType($value)
    {
        if (is_null($value)) return 'null';
        if (is_bool($value)) return 'boolean';
        if (is_int($value)) return 'integer';
        if (is_float($value)) return 'float';
        if (is_string($value)) {
            // Cek apakah string adalah date/datetime
            if (preg_match('/^\d{4}-\d{2}-\d{2}/', $value)) {
                return 'date';
            }
            return 'string';
        }
        if (is_array($value)) return 'array';
        if (is_object($value)) return 'object';

        return 'unknown';
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Failed to process GeoJSON layer {$this->layer->id}");
        Log::error("Exception: " . $exception->getMessage());
        Log::error("Stack trace: " . $exception->getTraceAsString());
        
        $this->layer->markAsError($exception->getMessage());
    }
}