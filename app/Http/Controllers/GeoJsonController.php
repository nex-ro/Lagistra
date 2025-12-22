<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\GeoJsonLayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GeoJsonController extends Controller
{
    public function index()
    {
        try {
            $layers = GeoJsonLayer::ready()
                ->visible()
                ->orderedByZIndex()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $layers
            ])->header('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getFeatures($id)
    {
        try {
            $layer = GeoJsonLayer::findOrFail($id);
            
            // Cek file exists
            if (!Storage::exists($layer->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'GeoJSON file not found: ' . $layer->file_path
                ], 404);
            }

            // Ambil konten GeoJSON
            $content = $layer->getGeoJsonContent();
            
            if (empty($content)) {
                return response()->json([
                    'success' => false,
                    'message' => 'GeoJSON content is empty'
                ], 404);
            }

            $geojson = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid GeoJSON format: ' . json_last_error_msg()
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => $geojson
            ])->header('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            \Log::error('Error loading layer ' . $id . ': ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}