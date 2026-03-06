<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('whatsapp_group_member_events', function (Blueprint $table) {
            $table->unique(
                ['group_fk', 'participant_fk', 'event_type', 'sync_batch_id'],
                'uniq_wpp_event_group_participant_type_batch'
            );
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_group_member_events', function (Blueprint $table) {
            $table->dropUnique('uniq_wpp_event_group_participant_type_batch');
        });
    }
};
