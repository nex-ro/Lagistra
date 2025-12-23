<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{  
    public function up(): void
    {
        Schema::table('geo_json_layers', function (Blueprint $table) {
            $table->foreignId('estate_id')
                ->after('user_id')
                ->constrained('estates')
                ->onDelete('cascade');
            
            $table->index(['estate_id', 'status']);
        });
    }
    
    public function down(): void
    {
        Schema::table('geo_json_layers', function (Blueprint $table) {
            $table->dropForeign(['estate_id']);
            $table->dropColumn('estate_id');
        });
    }
    
};
