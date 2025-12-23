<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\GeoJsonLayerController;
use App\Models\GeoJsonLayer;
use App\Http\Controllers\MapController;
use App\Http\Controllers\GeoJsonController;
use App\Http\Controllers\KebunControllers;
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/map', [MapController::class, 'index'])->name('map');

Route::get('/dashboard', function () {
    return Inertia::render('admin/Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/geojson/map', [GeoJsonLayerController::class, 'index'])
        ->name('geojson.index');

Route::middleware('admin')->group(function () {
   Route::get('/kebun', [KebunControllers::class, 'index'])->name('kebun'); 
    Route::post('/kebun', [KebunControllers::class, 'store'])->name('kebun.store');
    Route::put('/kebun/{estate}', [KebunControllers::class, 'update'])->name('kebun.update');
    Route::delete('/kebun/{estate}', [KebunControllers::class, 'destroy'])->name('kebun.destroy');

});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // GeoJSON Routes - dengan prefix konsisten
    Route::get('/geojson/map', [GeoJsonLayerController::class, 'index'])
        ->name('geojson.index');
    
    Route::post('/geojson/upload', [GeoJsonLayerController::class, 'upload'])
        ->name('geojson.upload');
    
    Route::get('/geojson/stats', [GeoJsonLayerController::class, 'stats'])
        ->name('geojson.stats');
    
    Route::get('/geojson/{id}', [GeoJsonLayerController::class, 'show'])
        ->name('geojson.show');
    
    Route::put('/geojson/{id}', [GeoJsonLayerController::class, 'update'])
        ->name('geojson.update');
    
    Route::post('/geojson/{id}/toggle-visibility', [GeoJsonLayerController::class, 'toggleVisibility'])
        ->name('geojson.toggle-visibility');
    
    Route::get('/geojson/{id}/download', [GeoJsonLayerController::class, 'download'])
        ->name('geojson.download');
    
    Route::delete('/geojson/{id}', [GeoJsonLayerController::class, 'destroy'])
        ->name('geojson.destroy');

    // API Routes for Map View
    Route::get('/api/layers', [GeoJsonController::class, 'index']);
    Route::get('/api/layers/{id}', [GeoJsonController::class, 'show']);
    Route::get('/api/layers/{id}/features', [GeoJsonController::class, 'getFeatures']);
}); 

require __DIR__.'/auth.php';