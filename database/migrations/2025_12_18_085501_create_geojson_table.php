<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabel untuk menyimpan layer GeoJSON
        Schema::create('geo_json_layers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // File info
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_hash', 64)->index();
            $table->bigInteger('file_size')->default(0);
            
            // GeoJSON metadata
            $table->string('geometry_type')->nullable();
            $table->integer('features_count')->default(0);
            $table->json('properties_schema')->nullable();
            $table->string('crs')->default('EPSG:4326');
            $table->json('metadata')->nullable();
            
            // Bounding box
            $table->decimal('bbox_min_lat', 10, 7)->nullable();
            $table->decimal('bbox_min_lng', 10, 7)->nullable();
            $table->decimal('bbox_max_lat', 10, 7)->nullable();
            $table->decimal('bbox_max_lng', 10, 7)->nullable();
            $table->decimal('center_lat', 10, 7)->nullable();
            $table->decimal('center_lng', 10, 7)->nullable();
            
            // Styling
            $table->string('color', 7)->default('#3388ff');
            $table->integer('opacity')->default(70);
            $table->string('stroke_color', 7)->default('#3388ff');
            $table->integer('stroke_width')->default(2);
            
            // Display settings
            $table->boolean('is_visible')->default(true);
            $table->integer('z_index')->default(0);
            
            // Processing status
            $table->enum('status', ['processing', 'ready', 'error'])->default('processing');
            $table->text('error_message')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'is_visible']);
            $table->index('z_index');
        });

        // Tabel untuk cache GeoJSON
        Schema::create('geojson_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('layer_id')->constrained('geo_json_layers')->onDelete('cascade');
            $table->string('cache_key')->index();
            $table->longText('cached_data');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            // Composite index untuk query cache
            $table->unique(['layer_id', 'cache_key']);
            $table->index('expires_at');
        });

        // Tabel untuk features individual (opsional, untuk layer besar)
        Schema::create('geo_json_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('layer_id')->constrained('geo_json_layers')->onDelete('cascade');
            
            $table->string('feature_id')->nullable();
            $table->string('geometry_type');
            $table->json('geometry');
            $table->json('properties')->nullable();
            
            // Untuk spatial index (jika perlu)
            $table->decimal('center_lat', 10, 7)->nullable();
            $table->decimal('center_lng', 10, 7)->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('layer_id');
            $table->index('geometry_type');
            $table->index(['center_lat', 'center_lng']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('geo_json_features');
        Schema::dropIfExists('geojson_cache');
        Schema::dropIfExists('geo_json_layers');
    }
};