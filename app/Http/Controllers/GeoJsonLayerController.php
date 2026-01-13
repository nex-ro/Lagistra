<?php

namespace App\Http\Controllers;

use App\Models\GeoJsonLayer;
use App\Services\GeoJsonProcessorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\Estate;  
class GeoJsonLayerController extends Controller
{
    protected $processor;

    public function __construct(GeoJsonProcessorService $processor)
    {
        $this->processor = $processor;
    }

    /**
     * Halaman utama upload GeoJSON
     */
       public function index(Request $request)
    {
        $query = GeoJsonLayer::with(['user', 'estate'])
            ->where('user_id', auth()->id());

        // Filter berdasarkan estate
        if ($request->filled('estate_id')) {
            $query->where('estate_id', $request->estate_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('file_name', 'like', "%{$search}%");
            });
        }

        $layers = $query->orderedByZIndex()
            ->latest()
            ->get()
            ->map(function ($layer) {
                return [
                    'id' => $layer->id,
                    'name' => $layer->name,
                    'description' => $layer->description,
                    'estate' => $layer->estate ? [
                        'id' => $layer->estate->id,
                        'nama_estate' => $layer->estate->nama_estate,
                        'nama_pt' => $layer->estate->nama_pt,
                    ] : null,
                    'file_name' => $layer->file_name,
                    'file_size' => $layer->file_size_human,
                    'geometry_type' => $layer->geometry_type,
                    'features_count' => $layer->features_count,
                    'status' => $layer->status,
                    'error_message' => $layer->error_message,
                    'is_visible' => $layer->is_visible,
                    'color' => $layer->color,
                    'opacity' => $layer->opacity,
                    'bounds' => $layer->bounds,
                    'center' => $layer->center,
                    'created_at' => $layer->created_at->diffForHumans(),
                ];
            });

        // Get all estates untuk dropdown
        $estates = Estate::orderBy('nama_estate')->get()->map(function ($estate) {
            return [
                'id' => $estate->id,
                'nama_estate' => $estate->nama_estate,
                'nama_pt' => $estate->nama_pt,
                'label' => $estate->nama_estate . ' - ' . $estate->nama_pt, // Untuk display di dropdown
            ];
        });

        return Inertia::render('GeoJson/Index', [
            'layers' => $layers,
            'estates' => $estates,
            'filters' => $request->only(['search', 'estate_id'])
        ]);
    }

        public function getVisibleLayers()
    {
        $layers = GeoJsonLayer::with('estate')
            ->where('is_visible', true)
            ->where('status', 'ready')
            ->get()
            ->map(function ($layer) {
                return [
                    'id' => $layer->id,
                    'name' => $layer->name,
                    'color' => $layer->color,
                    'opacity' => $layer->opacity,
                    'geojson_data' => json_decode($layer->geojson_data),
                    'estate' => $layer->estate ? [
                        'id' => $layer->estate->id,
                        'nama_estate' => $layer->estate->nama_estate,
                        'nama_pt' => $layer->estate->nama_pt,
                    ] : null,
                ];
            });

        return response()->json($layers);
    }

    /**
     * Get single GeoJSON layer data
     */
    public function getLayer($id)
    {
        $layer = GeoJsonLayer::with('estate')->findOrFail($id);

        if ($layer->status !== 'ready') {
            return response()->json([
                'error' => 'Layer not ready'
            ], 400);
        }

        return response()->json([
            'id' => $layer->id,
            'name' => $layer->name,
            'description' => $layer->description,
            'color' => $layer->color,
            'opacity' => $layer->opacity,
            'geojson_data' => json_decode($layer->geojson_data),
            'features_count' => $layer->features_count,
            'geometry_type' => $layer->geometry_type,
            'is_visible' => $layer->is_visible,
            'estate' => $layer->estate ? [
                'id' => $layer->estate->id,
                'nama_estate' => $layer->estate->nama_estate,
                'nama_pt' => $layer->estate->nama_pt,
            ] : null,
        ]);
    }

    /**
     * Upload file GeoJSON
     */
  /**
 * Upload file GeoJSON
 */
public function upload(Request $request)
{
    // Debug log
    \Log::info('Upload request received', [
        'has_file' => $request->hasFile('file'),
        'all_data' => $request->all(),
    ]);

    $request->validate([
        'file' => 'required|file|max:51200', // Max 50MB
        'name' => 'nullable|string|max:255',
        'description' => 'nullable|string|max:1000',
        'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        'estate_id' => 'required|exists:estates,id',
        'opacity' => 'nullable|integer|min:0|max:100',
    ]);

    try {
        $file = $request->file('file');
        
        \Log::info('File details', [
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
        ]);
        
        // Hitung hash untuk cek duplikasi
        $fileHash = hash_file('sha256', $file->getRealPath());
        
        // Cek apakah file sudah ada
        $existing = GeoJsonLayer::where('file_hash', $fileHash)
            ->where('user_id', auth()->id())
            ->first();
        
        if ($existing) {
            \Log::warning('Duplicate file detected', ['hash' => $fileHash]);
            return back()->with('error', 'File ini sudah pernah diupload sebelumnya.');
        }

        // Generate nama file unik
        $fileName = time() . '_' . uniqid() . '.geojson';
        $filePath = 'geojson/original/' . $fileName;
        
        // Simpan file ke storage
        $stored = Storage::put($filePath, file_get_contents($file->getRealPath()));
        
        \Log::info('File stored', [
            'path' => $filePath,
            'success' => $stored,
        ]);

        // Baca dan validasi GeoJSON
        $geoJsonContent = file_get_contents($file->getRealPath());
        $geoJsonData = json_decode($geoJsonContent, true);
        
        if (!$geoJsonData || !isset($geoJsonData['type'])) {
            Storage::delete($filePath);
            \Log::error('Invalid GeoJSON format');
            return back()->with('error', 'File bukan GeoJSON yang valid.');
        }

        \Log::info('GeoJSON validated', [
            'type' => $geoJsonData['type'],
        ]);

        // Buat record layer
        $layer = GeoJsonLayer::create([
            'name' => $request->name ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'description' => $request->description,
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_hash' => $fileHash,
            'file_size' => $file->getSize(),
            'estate_id' => $request->estate_id,
            'color' => $request->color ?? '#3388ff',
            'opacity' => $request->opacity ?? 70,
            'user_id' => auth()->id(),
            'status' => 'processing',
        ]);

        \Log::info('Layer created', [
            'id' => $layer->id,
            'name' => $layer->name,
        ]);

        // Proses GeoJSON secara asynchronous (dispatch job)
        \App\Jobs\ProcessGeoJsonLayer::dispatch($layer);

        return redirect()->route('geojson.index')
            ->with('success', 'File berhasil diupload dan sedang diproses.');

    } catch (\Exception $e) {
        \Log::error('Upload failed', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        
        return back()->with('error', 'Gagal mengupload file: ' . $e->getMessage());
    }
}

    /**
     * Get GeoJSON content untuk ditampilkan di peta
     */
    public function show($id)
    {
        $layer = GeoJsonLayer::findOrFail($id);
        
        // Cek authorization
        if ($layer->user_id !== auth()->id()) {
            abort(403);
        }

        if ($layer->status !== 'ready') {
            return response()->json([
                'error' => 'Layer masih dalam proses atau error',
                'status' => $layer->status,
                'message' => $layer->error_message,
            ], 422);
        }

        // Ambil GeoJSON dari storage
        $geoJsonContent = $layer->getGeoJsonContent();
        
        if (!$geoJsonContent) {
            return response()->json(['error' => 'File tidak ditemukan'], 404);
        }

        return response()->json([
            'layer' => [
                'id' => $layer->id,
                'name' => $layer->name,
                'color' => $layer->color,
                'opacity' => $layer->opacity,
                'stroke_color' => $layer->stroke_color,
                'stroke_width' => $layer->stroke_width,
            ],
            'geojson' => json_decode($geoJsonContent),
        ]);
    }

    /**
     * Update layer settings
     */
    public function update(Request $request, $id)
    {
        $layer = GeoJsonLayer::findOrFail($id);
        
        if ($layer->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'opacity' => 'nullable|integer|min:0|max:100',
            'stroke_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'stroke_width' => 'nullable|integer|min:1|max:10',
             'estate_id' => 'nullable|exists:estates,id',
            'is_visible' => 'nullable|boolean',
            'z_index' => 'nullable|integer',
        ]);

        $layer->update($request->only([
            'name',
            'description',
            'color',
            'opacity',
            'stroke_color',
            'estate_id',
            'stroke_width',
            'is_visible',
            'z_index',
        ]));

        return back()->with('success', 'Layer berhasil diupdate.');
    }

    /**
     * Toggle visibility
     */
    public function toggleVisibility($id)
    {
        $layer = GeoJsonLayer::findOrFail($id);
        
        if ($layer->user_id !== auth()->id()) {
            abort(403);
        }

        $layer->update([
            'is_visible' => !$layer->is_visible,
        ]);

        return back()->with('success', 'Visibility berhasil diubah.');
    }

    /**
     * Delete layer
     */
    public function destroy($id)
    {
        $layer = GeoJsonLayer::findOrFail($id);
        
        if ($layer->user_id !== auth()->id()) {
            abort(403);
        }

        $layer->delete(); // Akan trigger event untuk hapus file

        return back()->with('success', 'Layer berhasil dihapus.');
    }

    /**
     * Download original file
     */
    public function download($id)
    {
        $layer = GeoJsonLayer::findOrFail($id);
        
        if ($layer->user_id !== auth()->id()) {
            abort(403);
        }

        if (!Storage::exists($layer->file_path)) {
            return back()->with('error', 'File tidak ditemukan.');
        }

        return Storage::download($layer->file_path, $layer->file_name);
    }

    /**
     * Get layer statistics
     */
    public function stats()
    {
        $stats = [
            'total_layers' => GeoJsonLayer::where('user_id', auth()->id())->count(),
            'total_features' => GeoJsonLayer::where('user_id', auth()->id())->sum('features_count'),
            'total_size' => GeoJsonLayer::where('user_id', auth()->id())->sum('file_size'),
            'by_geometry' => GeoJsonLayer::where('user_id', auth()->id())
                ->selectRaw('geometry_type, COUNT(*) as count')
                ->groupBy('geometry_type')
                ->get(),
            'by_status' => GeoJsonLayer::where('user_id', auth()->id())
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->get(),
        ];

        return response()->json($stats);
    }
}