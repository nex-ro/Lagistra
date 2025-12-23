<?php

namespace App\Services;

use proj4php\Proj4php;
use proj4php\Proj;
use proj4php\Point;
use Illuminate\Support\Facades\Log;

class CoordinateTransformService
{
    protected $proj4;
    
    /**
     * Daftar definisi CRS yang umum digunakan
     * Tambahkan definisi lain sesuai kebutuhan
     */
    protected $crsDefinitions = [
        'EPSG:4326' => '+proj=longlat +datum=WGS84 +no_defs',
        'EPSG:3857' => '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs',
        
        // UTM Zone 48S (Indonesia Timur)
        'EPSG:32748' => '+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 47S (Indonesia Tengah)
        'EPSG:32747' => '+proj=utm +zone=47 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 46S (Indonesia Barat)
        'EPSG:32746' => '+proj=utm +zone=46 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 49S
        'EPSG:32749' => '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 50S
        'EPSG:32750' => '+proj=utm +zone=50 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 51S
        'EPSG:32751' => '+proj=utm +zone=51 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 52S
        'EPSG:32752' => '+proj=utm +zone=52 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 53S
        'EPSG:32753' => '+proj=utm +zone=53 +south +datum=WGS84 +units=m +no_defs',
        
        // UTM Zone 54S
        'EPSG:32754' => '+proj=utm +zone=54 +south +datum=WGS84 +units=m +no_defs',
    ];
    
    public function __construct()
    {
        $this->proj4 = new Proj4php();
        
        // Register custom CRS definitions
        foreach ($this->crsDefinitions as $code => $definition) {
            $this->proj4->addDef($code, $definition);
        }
    }
    
    /**
     * Transform coordinates from source CRS to target CRS
     *
     * @param float $x X coordinate (easting/longitude)
     * @param float $y Y coordinate (northing/latitude)
     * @param string $sourceCRS Source CRS code (e.g., 'EPSG:32748')
     * @param string $targetCRS Target CRS code (default: 'EPSG:4326')
     * @return array [x, y] in target CRS
     */
    public function transform($x, $y, $sourceCRS, $targetCRS = 'EPSG:4326')
    {
        try {
            // Normalize CRS codes
            $sourceCRS = $this->normalizeCRSCode($sourceCRS);
            $targetCRS = $this->normalizeCRSCode($targetCRS);
            
            // Jika sama, tidak perlu transform
            if ($sourceCRS === $targetCRS) {
                return [$x, $y];
            }
            
            // Define projections
            $projSource = new Proj($sourceCRS, $this->proj4);
            $projTarget = new Proj($targetCRS, $this->proj4);
            
            // Create point
            $pointSrc = new Point($x, $y, $projSource);
            
            // Transform
            $pointDest = $this->proj4->transform($projSource, $projTarget, $pointSrc);
            
            return [$pointDest->x, $pointDest->y];
            
        } catch (\Exception $e) {
            Log::error("Coordinate transformation failed: {$e->getMessage()}", [
                'x' => $x,
                'y' => $y,
                'source' => $sourceCRS,
                'target' => $targetCRS,
            ]);
            
            throw new \Exception("Gagal transform koordinat dari {$sourceCRS} ke {$targetCRS}: " . $e->getMessage());
        }
    }
    
    /**
     * Transform batch coordinates
     *
     * @param array $coordinates Array of [x, y] coordinates
     * @param string $sourceCRS
     * @param string $targetCRS
     * @return array Transformed coordinates
     */
    public function transformBatch(array $coordinates, $sourceCRS, $targetCRS = 'EPSG:4326')
    {
        $transformed = [];
        
        foreach ($coordinates as $coord) {
            if (is_array($coord) && count($coord) >= 2) {
                $transformed[] = $this->transform($coord[0], $coord[1], $sourceCRS, $targetCRS);
            }
        }
        
        return $transformed;
    }
    
    /**
     * Detect CRS from GeoJSON
     *
     * @param array $geoJson GeoJSON data
     * @return string CRS code (e.g., 'EPSG:4326')
     */
    public function detectCRS($geoJson)
    {
        // Cek di root level
        if (isset($geoJson['crs']['properties']['name'])) {
            return $this->parseCRSName($geoJson['crs']['properties']['name']);
        }
        
        // Cek format OGC URN
        if (isset($geoJson['crs']['type']) && $geoJson['crs']['type'] === 'name') {
            if (isset($geoJson['crs']['properties']['name'])) {
                return $this->parseCRSName($geoJson['crs']['properties']['name']);
            }
        }
        
        // Default ke WGS84
        return 'EPSG:4326';
    }
    
    /**
     * Parse CRS name dari berbagai format
     *
     * @param string $crsName
     * @return string Normalized CRS code
     */
    protected function parseCRSName($crsName)
    {
        // Format: "urn:ogc:def:crs:EPSG::32748"
        if (preg_match('/urn:ogc:def:crs:EPSG::(\d+)/i', $crsName, $matches)) {
            return 'EPSG:' . $matches[1];
        }
        
        // Format: "EPSG:32748"
        if (preg_match('/EPSG[:\s]*(\d+)/i', $crsName, $matches)) {
            return 'EPSG:' . $matches[1];
        }
        
        // Format: "urn:ogc:def:crs:OGC:1.3:CRS84" atau "CRS84"
        if (preg_match('/CRS84/i', $crsName)) {
            return 'EPSG:4326';
        }
        
        // Return as-is jika tidak match pattern
        return $crsName;
    }
    
    /**
     * Normalize CRS code
     *
     * @param string $crsCode
     * @return string
     */
    protected function normalizeCRSCode($crsCode)
    {
        // Convert "WGS84" atau "wgs84" ke EPSG:4326
        if (strtoupper($crsCode) === 'WGS84') {
            return 'EPSG:4326';
        }
        
        // Ensure format is "EPSG:XXXX"
        if (preg_match('/^(\d+)$/', $crsCode)) {
            return 'EPSG:' . $crsCode;
        }
        
        return $crsCode;
    }
    
    /**
     * Check if CRS needs transformation to WGS84
     *
     * @param string $crs
     * @return bool
     */
    public function needsTransformation($crs)
    {
        $normalized = $this->normalizeCRSCode($crs);
        
        return $normalized !== 'EPSG:4326' && 
               strtoupper($normalized) !== 'WGS84' &&
               $normalized !== 'CRS84';
    }
    
    /**
     * Get CRS information
     *
     * @param string $crsCode
     * @return array|null
     */
    public function getCRSInfo($crsCode)
    {
        $normalized = $this->normalizeCRSCode($crsCode);
        
        // UTM zones
        if (preg_match('/EPSG:327(\d{2})/i', $normalized, $matches)) {
            $zone = $matches[1];
            return [
                'code' => $normalized,
                'name' => "WGS84 / UTM Zone {$zone}S",
                'type' => 'projected',
                'units' => 'meters',
                'zone' => $zone,
                'hemisphere' => 'south',
            ];
        }
        
        if (preg_match('/EPSG:326(\d{2})/i', $normalized, $matches)) {
            $zone = $matches[1];
            return [
                'code' => $normalized,
                'name' => "WGS84 / UTM Zone {$zone}N",
                'type' => 'projected',
                'units' => 'meters',
                'zone' => $zone,
                'hemisphere' => 'north',
            ];
        }
        
        // WGS84
        if ($normalized === 'EPSG:4326') {
            return [
                'code' => 'EPSG:4326',
                'name' => 'WGS84',
                'type' => 'geographic',
                'units' => 'degrees',
            ];
        }
        
        // Web Mercator
        if ($normalized === 'EPSG:3857') {
            return [
                'code' => 'EPSG:3857',
                'name' => 'Web Mercator',
                'type' => 'projected',
                'units' => 'meters',
            ];
        }
        
        return null;
    }
    
    /**
     * Validate if coordinates are within valid bounds for a given CRS
     *
     * @param float $x
     * @param float $y
     * @param string $crsCode
     * @return bool
     */
    public function validateCoordinates($x, $y, $crsCode)
    {
        $normalized = $this->normalizeCRSCode($crsCode);
        
        // WGS84 bounds
        if ($normalized === 'EPSG:4326') {
            return $x >= -180 && $x <= 180 && $y >= -90 && $y <= 90;
        }
        
        // UTM bounds (sangat besar, cukup cek apakah reasonable)
        if (preg_match('/EPSG:32[67]\d{2}/i', $normalized)) {
            // UTM coordinates biasanya dalam range 0-1,000,000 meters
            return abs($x) < 10000000 && abs($y) < 10000000;
        }
        
        return true; // Default: consider valid
    }
    
    /**
     * Get suggested CRS based on coordinates
     *
     * @param float $lng Longitude
     * @param float $lat Latitude
     * @return string Suggested EPSG code
     */
    public function suggestUTMZone($lng, $lat)
    {
        // Calculate UTM zone from longitude
        $zone = floor(($lng + 180) / 6) + 1;
        
        // Determine hemisphere
        $hemisphere = $lat >= 0 ? 'N' : 'S';
        $epsgBase = $lat >= 0 ? 32600 : 32700;
        
        $epsgCode = $epsgBase + $zone;
        
        return "EPSG:{$epsgCode}";
    }
    
    /**
     * Add custom CRS definition
     *
     * @param string $code CRS code (e.g., 'EPSG:12345')
     * @param string $definition Proj4 definition string
     */
    public function addCRSDefinition($code, $definition)
    {
        $this->crsDefinitions[$code] = $definition;
        $this->proj4->addDef($code, $definition);
    }
    
    /**
     * Check if CRS is supported
     *
     * @param string $crsCode
     * @return bool
     */
    public function isSupported($crsCode)
    {
        $normalized = $this->normalizeCRSCode($crsCode);
        
        return isset($this->crsDefinitions[$normalized]) ||
               $this->proj4->getDef($normalized) !== null;
    }
    
    /**
     * Get all supported CRS codes
     *
     * @return array
     */
    public function getSupportedCRS()
    {
        return array_keys($this->crsDefinitions);
    }
}