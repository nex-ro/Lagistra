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
        Schema::create('estates', function (Blueprint $table) {
            $table->id();
            $table->string('nama_estate');
            $table->string('nama_pt');
            $table->string('penanggung_jawab')->nullable();
            $table->string('legalitas');
            $table->decimal('luas_area', 10, 2)->nullable(); // dalam hektar
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estates');
    }
};