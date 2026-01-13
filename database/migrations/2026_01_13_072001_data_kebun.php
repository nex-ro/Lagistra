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
        Schema::create('data_perkebunan', function (Blueprint $table) {
            $table->id();
            
            // Foreign Key ke Estate
            $table->foreignId('estate_id')->constrained('estates')->onDelete('cascade');
            
            $table->year('tahun');
            $table->string('bulan', 20);
            
            // Luas Area
            $table->decimal('luas_hgu', 10, 2)->nullable();
            $table->decimal('luas_areal_dikuasai', 10, 2)->nullable();
            $table->decimal('total_planted_all', 10, 2)->nullable();
            
            // Service Jalan
            $table->decimal('service_jalan_m', 10, 2)->nullable();
            $table->decimal('budget_service_jalan', 15, 2)->nullable();
            $table->decimal('persen_service_jalan', 10, 2)->nullable();
            
            // Penimbunan Jalan
            $table->decimal('penimbunan_jalan_m', 10, 2)->nullable();
            $table->decimal('budget_penimbunan_jalan', 15, 2)->nullable();
            $table->decimal('persen_penimbunan_jalan', 10, 2)->nullable();
            
            // Pengerasan Jalan
            $table->decimal('pengerasan_jalan', 10, 2)->nullable();
            $table->decimal('budget_pengerasan_jalan', 15, 2)->nullable();
            $table->decimal('persen_pengerasan_jalan', 10, 2)->nullable();
            
            // Tanam Baru Inti
            $table->integer('tanam_baru_inti_pokok')->nullable();
            $table->decimal('tanam_baru_inti_ha', 10, 2)->nullable();
            $table->integer('tanam_sisip_inti_pokok')->nullable();
            
            // Tanam Baru Plasma
            $table->integer('tanam_baru_plasma_pokok')->nullable();
            $table->decimal('tanam_baru_plasma_ha', 10, 2)->nullable();
            $table->integer('tanam_sisip_plasma_pokok')->nullable();
            
            // SPH dan Total Pokok
            $table->integer('sph_aktual_inti')->nullable();
            $table->integer('total_pokok_inti')->nullable();
            $table->integer('sph_aktual_plasma')->nullable();
            $table->integer('total_pokok_plasma')->nullable();
            
            // Areal Produktif INTI
            $table->decimal('areal_produktif_inti', 10, 2)->nullable();
            $table->decimal('areal_belum_produktif_inti', 10, 2)->nullable();
            $table->decimal('areal_tidak_produktif_inti', 10, 2)->nullable();
            
            // Areal Produktif Plasma
            $table->decimal('areal_produktif_plasma', 10, 2)->nullable();
            $table->decimal('areal_belum_produktif_plasma', 10, 2)->nullable();
            $table->decimal('areal_tidak_produktif_plasma', 10, 2)->nullable();
            
            // Land Clearing
            $table->decimal('land_clearing_inti', 10, 2)->nullable();
            $table->decimal('land_clearing_plasma', 10, 2)->nullable();
            
            // Ganti Rugi
            $table->decimal('ganti_rugi_lahan_total', 10, 2)->nullable();
            
            $table->timestamps();
            
            // Index untuk performa query
            $table->index(['estate_id', 'tahun', 'bulan']);
            $table->unique(['estate_id', 'tahun', 'bulan']); // Mencegah duplikasi data per estate per bulan
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_perkebunan');
    }
};