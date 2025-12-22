<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GeoJsonProcessorService
{
    /**
     * Validate GeoJSON format
     */
    public function validate($geoJson)
    {
        if (!is_array($geoJson)) {
            throw new \Exception('GeoJSON harus berupa array');
        }

        if (!isset($geoJson['type'])) {
            throw new \Exception('GeoJSON harus memiliki property "type"');
        }

        $validTypes = [
            'FeatureCollection',
            'Feature',
            'Point',
            'MultiPoint',
            'LineString',
            'MultiLineString',
            'Polygon',
            'MultiPolygon',
            'GeometryCollection'
        ];

        if (!in_array($geoJson['type'], $validTypes)) {
            throw new \Exception('Tipe GeoJSON tidak valid: ' . $geoJson['type']);
        }

        return true;
    }

    /**
     * Simplify GeoJSON untuk mengurangi ukuran
     * Menggunakan Douglas-Peucker algorithm
     */
    public function simplify($geoJson, $tolerance = 0.0001)
    {
        if ($geoJson['type'] === 'FeatureCollection') {
            $geoJson['features'] = array_map(function ($feature) use ($tolerance) {
                return $this->simplifyFeature($feature, $tolerance);
            }, $geoJson['features'] ?? []);
        } elseif ($geoJson['type'] === 'Feature') {
            $geoJson = $this->simplifyFeature($geoJson, $tolerance);
        }

        return $geoJson;
    }

    /**
     * Simplify single feature
     */
    protected function simplifyFeature($feature, $tolerance)
    {
        if (!isset($feature['geometry'])) {
            return $feature;
        }

        $feature['geometry'] = $this->simplifyGeometry($feature['geometry'], $tolerance);
        return $feature;
    }

    /**
     * Simplify geometry
     */
    protected function simplifyGeometry($geometry, $tolerance)
    {
        if (!isset($geometry['type']) || !isset($geometry['coordinates'])) {
            return $geometry;
        }

        switch ($geometry['type']) {
            case 'LineString':
                $geometry['coordinates'] = $this->douglasPeucker(
                    $geometry['coordinates'],
                    $tolerance
                );
                break;

            case 'Polygon':
                $geometry['coordinates'] = array_map(function ($ring) use ($tolerance) {
                    return $this->douglasPeucker($ring, $tolerance);
                }, $geometry['coordinates']);
                break;

            case 'MultiLineString':
                $geometry['coordinates'] = array_map(function ($line) use ($tolerance) {
                    return $this->douglasPeucker($line, $tolerance);
                }, $geometry['coordinates']);
                break;

            case 'MultiPolygon':
                $geometry['coordinates'] = array_map(function ($polygon) use ($tolerance) {
                    return array_map(function ($ring) use ($tolerance) {
                        return $this->douglasPeucker($ring, $tolerance);
                    }, $polygon);
                }, $geometry['coordinates']);
                break;
        }

        return $geometry;
    }

    /**
     * Douglas-Peucker algorithm untuk line simplification
     */
    protected function douglasPeucker($points, $tolerance)
    {
        if (count($points) < 3) {
            return $points;
        }

        $maxDistance = 0;
        $index = 0;
        $end = count($points) - 1;

        // Find point dengan perpendicular distance terbesar
        for ($i = 1; $i < $end; $i++) {
            $distance = $this->perpendicularDistance(
                $points[$i],
                $points[0],
                $points[$end]
            );

            if ($distance > $maxDistance) {
                $maxDistance = $distance;
                $index = $i;
            }
        }

        // Jika max distance lebih besar dari tolerance, split dan rekursi
        if ($maxDistance > $tolerance) {
            $left = $this->douglasPeucker(
                array_slice($points, 0, $index + 1),
                $tolerance
            );
            $right = $this->douglasPeucker(
                array_slice($points, $index),
                $tolerance
            );

            return array_merge(
                array_slice($left, 0, -1),
                $right
            );
        }

        // Jika tidak, return start dan end point
        return [$points[0], $points[$end]];
    }

    /**
     * Calculate perpendicular distance dari point ke line
     */
    protected function perpendicularDistance($point, $lineStart, $lineEnd)
    {
        $x = $point[0];
        $y = $point[1];
        $x1 = $lineStart[0];
        $y1 = $lineStart[1];
        $x2 = $lineEnd[0];
        $y2 = $lineEnd[1];

        $A = $x - $x1;
        $B = $y - $y1;
        $C = $x2 - $x1;
        $D = $y2 - $y1;

        $dot = $A * $C + $B * $D;
        $lenSq = $C * $C + $D * $D;
        $param = $lenSq != 0 ? $dot / $lenSq : -1;

        if ($param < 0) {
            $xx = $x1;
            $yy = $y1;
        } elseif ($param > 1) {
            $xx = $x2;
            $yy = $y2;
        } else {
            $xx = $x1 + $param * $C;
            $yy = $y1 + $param * $D;
        }

        $dx = $x - $xx;
        $dy = $y - $yy;

        return sqrt($dx * $dx + $dy * $dy);
    }

    /**
     * Calculate bounding box dari GeoJSON
     */
    public function calculateBounds($geoJson)
    {
        $coordinates = $this->extractAllCoordinates($geoJson);

        if (empty($coordinates)) {
            return null;
        }

        $lngs = array_column($coordinates, 0);
        $lats = array_column($coordinates, 1);

        return [
            'minLng' => min($lngs),
            'minLat' => min($lats),
            'maxLng' => max($lngs),
            'maxLat' => max($lats),
            'centerLng' => (min($lngs) + max($lngs)) / 2,
            'centerLat' => (min($lats) + max($lats)) / 2,
        ];
    }

    /**
     * Extract all coordinates dari GeoJSON
     */
    public function extractAllCoordinates($geoJson, &$coords = [])
    {
        if (!isset($geoJson['type'])) {
            return $coords;
        }

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
                    $coords[] = $geoJson['coordinates'];
                }
                break;

            case 'MultiPoint':
            case 'LineString':
                foreach ($geoJson['coordinates'] ?? [] as $coord) {
                    $coords[] = $coord;
                }
                break;

            case 'MultiLineString':
            case 'Polygon':
                foreach ($geoJson['coordinates'] ?? [] as $ring) {
                    foreach ($ring as $coord) {
                        $coords[] = $coord;
                    }
                }
                break;

            case 'MultiPolygon':
                foreach ($geoJson['coordinates'] ?? [] as $polygon) {
                    foreach ($polygon as $ring) {
                        foreach ($ring as $coord) {
                            $coords[] = $coord;
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

        return $coords;
    }

    /**
     * Get geometry type dari GeoJSON
     */
    public function getGeometryType($geoJson)
    {
        if ($geoJson['type'] === 'FeatureCollection') {
            if (!empty($geoJson['features']) && isset($geoJson['features'][0]['geometry']['type'])) {
                return $geoJson['features'][0]['geometry']['type'];
            }
        } elseif ($geoJson['type'] === 'Feature') {
            return $geoJson['geometry']['type'] ?? 'Unknown';
        } else {
            return $geoJson['type'];
        }

        return 'Unknown';
    }

    /**
     * Count features dalam GeoJSON
     */
    public function countFeatures($geoJson)
    {
        if ($geoJson['type'] === 'FeatureCollection') {
            return count($geoJson['features'] ?? []);
        } elseif ($geoJson['type'] === 'Feature') {
            return 1;
        }

        return 0;
    }

    /**
     * Extract properties schema dari features
     */
    public function extractPropertiesSchema($geoJson, $sampleSize = 10)
    {
        $schema = [];
        $features = [];

        if ($geoJson['type'] === 'FeatureCollection') {
            $features = array_slice($geoJson['features'] ?? [], 0, $sampleSize);
        } elseif ($geoJson['type'] === 'Feature') {
            $features = [$geoJson];
        }

        foreach ($features as $feature) {
            $properties = $feature['properties'] ?? [];

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

        return $schema;
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
            // Cek apakah string adalah date
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
     * Filter GeoJSON by bounds (spatial query)
     */
    public function filterByBounds($geoJson, $minLng, $minLat, $maxLng, $maxLat)
    {
        if ($geoJson['type'] !== 'FeatureCollection') {
            return $geoJson;
        }

        $filtered = $geoJson;
        $filtered['features'] = array_filter($geoJson['features'] ?? [], function ($feature) use ($minLng, $minLat, $maxLng, $maxLat) {
            return $this->featureIntersectsBounds($feature, $minLng, $minLat, $maxLng, $maxLat);
        });

        $filtered['features'] = array_values($filtered['features']);

        return $filtered;
    }

    /**
     * Check apakah feature intersects dengan bounds
     */
    protected function featureIntersectsBounds($feature, $minLng, $minLat, $maxLng, $maxLat)
    {
        if (!isset($feature['geometry'])) {
            return false;
        }

        $coords = [];
        $this->extractAllCoordinates($feature['geometry'], $coords);

        foreach ($coords as $coord) {
            if ($coord[0] >= $minLng && $coord[0] <= $maxLng &&
                $coord[1] >= $minLat && $coord[1] <= $maxLat) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convert CRS jika diperlukan
     */
    public function convertCRS($geoJson, $targetCRS = 'EPSG:4326')
    {
        // Implementasi basic - untuk full implementation perlu library seperti proj4php
        $sourceCRS = $geoJson['crs']['properties']['name'] ?? 'EPSG:4326';

        if ($sourceCRS === $targetCRS) {
            return $geoJson;
        }

        // Log warning karena konversi CRS kompleks
        Log::warning("CRS conversion from {$sourceCRS} to {$targetCRS} not fully implemented");

        return $geoJson;
    }

    /**
     * Optimize GeoJSON untuk web display
     */
    public function optimizeForWeb($geoJson, $options = [])
    {
        $defaults = [
            'simplify' => true,
            'tolerance' => 0.0001,
            'removeEmptyProperties' => true,
            'roundCoordinates' => 6, // decimal places
        ];

        $options = array_merge($defaults, $options);

        // Simplify geometry
        if ($options['simplify']) {
            $geoJson = $this->simplify($geoJson, $options['tolerance']);
        }

        // Round coordinates
        if ($options['roundCoordinates'] !== false) {
            $geoJson = $this->roundCoordinates($geoJson, $options['roundCoordinates']);
        }

        // Remove empty properties
        if ($options['removeEmptyProperties']) {
            $geoJson = $this->removeEmptyProperties($geoJson);
        }

        return $geoJson;
    }

    /**
     * Round coordinates untuk mengurangi ukuran file
     */
    protected function roundCoordinates($geoJson, $decimals = 6)
    {
        if (isset($geoJson['coordinates'])) {
            $geoJson['coordinates'] = $this->roundCoordinatesArray($geoJson['coordinates'], $decimals);
        }

        if ($geoJson['type'] === 'FeatureCollection') {
            $geoJson['features'] = array_map(function ($feature) use ($decimals) {
                return $this->roundCoordinates($feature, $decimals);
            }, $geoJson['features'] ?? []);
        } elseif ($geoJson['type'] === 'Feature' && isset($geoJson['geometry'])) {
            $geoJson['geometry'] = $this->roundCoordinates($geoJson['geometry'], $decimals);
        }

        return $geoJson;
    }

    /**
     * Round coordinates array recursively
     */
    protected function roundCoordinatesArray($coords, $decimals)
    {
        if (is_numeric($coords[0])) {
            // Base case: ini adalah coordinate pair [lng, lat]
            return array_map(function ($val) use ($decimals) {
                return round($val, $decimals);
            }, $coords);
        }

        // Recursive case: array of coordinates
        return array_map(function ($item) use ($decimals) {
            return $this->roundCoordinatesArray($item, $decimals);
        }, $coords);
    }

    /**
     * Remove empty properties
     */
    protected function removeEmptyProperties($geoJson)
    {
        if ($geoJson['type'] === 'FeatureCollection') {
            $geoJson['features'] = array_map(function ($feature) {
                if (isset($feature['properties'])) {
                    $feature['properties'] = array_filter($feature['properties'], function ($val) {
                        return $val !== null && $val !== '';
                    });
                }
                return $feature;
            }, $geoJson['features'] ?? []);
        } elseif ($geoJson['type'] === 'Feature' && isset($geoJson['properties'])) {
            $geoJson['properties'] = array_filter($geoJson['properties'], function ($val) {
                return $val !== null && $val !== '';
            });
        }

        return $geoJson;
    }

    /**
     * Split large GeoJSON into tiles (untuk MVT/vector tiles)
     */
    public function splitIntoTiles($geoJson, $zoom = 10)
    {
        // Implementasi basic tile splitting
        // Untuk production, gunakan library seperti geojson-vt
        
        $tiles = [];
        $features = $geoJson['type'] === 'FeatureCollection' 
            ? ($geoJson['features'] ?? []) 
            : [$geoJson];

        foreach ($features as $feature) {
            $bounds = $this->calculateBounds($feature);
            if (!$bounds) continue;

            // Calculate tile coordinates
            $tileX = $this->lngToTileX($bounds['centerLng'], $zoom);
            $tileY = $this->latToTileY($bounds['centerLat'], $zoom);
            $tileKey = "{$zoom}/{$tileX}/{$tileY}";

            if (!isset($tiles[$tileKey])) {
                $tiles[$tileKey] = [
                    'type' => 'FeatureCollection',
                    'features' => [],
                ];
            }

            $tiles[$tileKey]['features'][] = $feature;
        }

        return $tiles;
    }

    /**
     * Convert longitude to tile X
     */
    protected function lngToTileX($lng, $zoom)
    {
        return floor((($lng + 180) / 360) * pow(2, $zoom));
    }

    /**
     * Convert latitude to tile Y
     */
    protected function latToTileY($lat, $zoom)
    {
        $latRad = deg2rad($lat);
        return floor((1 - log(tan($latRad) + 1 / cos($latRad)) / M_PI) / 2 * pow(2, $zoom));
    }

    /**
     * Get statistics dari GeoJSON
     */
    public function getStatistics($geoJson)
    {
        $stats = [
            'type' => $geoJson['type'],
            'features_count' => $this->countFeatures($geoJson),
            'geometry_type' => $this->getGeometryType($geoJson),
            'bounds' => $this->calculateBounds($geoJson),
            'properties_schema' => $this->extractPropertiesSchema($geoJson),
            'total_coordinates' => count($this->extractAllCoordinates($geoJson)),
        ];

        // Calculate estimated size
        $stats['estimated_size'] = strlen(json_encode($geoJson));
        $stats['estimated_size_human'] = $this->formatBytes($stats['estimated_size']);

        return $stats;
    }

    /**
     * Format bytes ke human readable
     */
    protected function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}