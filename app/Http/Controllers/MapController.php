<?php

namespace App\Http\Controllers;

use App\Models\GeoJsonLayer;
use Inertia\Inertia;

class MapController extends Controller
{
    public function index()
    {
        $layers = GeoJsonLayer::ready()
            ->visible()
            ->orderedByZIndex()
            ->get()
            ->map(function($layer) {
                return [
                    'id' => $layer->id,
                    'name' => $layer->name,
                    'description' => $layer->description,
                    'geometry_type' => $layer->geometry_type,
                    'features_count' => $layer->features_count,
                    'color' => $layer->color,
                    'opacity' => $layer->opacity,
                    'stroke_width' => $layer->stroke_width,
                    'stroke_color' => $layer->stroke_color,
                    'is_visible' => $layer->is_visible,
                    'bounds' => $layer->bounds,
                    'center' => $layer->center,
                ];
            });

        return Inertia::render('Test', [
            'layers' => $layers
        ]);
    }
}