<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        $now = now();

        DB::table('social_profiles')->upsert([
            [
                'id' => (string) Str::ulid(),
                'provider' => 'apify',
                'provider_resource_type' => 'task',
                'provider_resource_id' => 'clean_quicksand~vipsocial-youtube',
                'task_input_override' => json_encode([
                    'maxResultStreams' => 0,
                    'maxResults' => 10,
                    'maxResultsShorts' => 0,
                    'startUrls' => [
                        ['url' => 'https://www.youtube.com/@tvvipsocial'],
                    ],
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'network' => 'youtube',
                'handle' => 'tvvipsocial',
                'display_name' => 'Tv Vip',
                'external_profile_id' => null,
                'url' => 'https://www.youtube.com/@tvvipsocial',
                'avatar_url' => null,
                'primary_metric_code' => 'subscribers_total',
                'normalizer_type' => 'path_map',
                'normalizer_config' => json_encode([
                    'item_index' => 0,
                    'identity_paths' => [
                        'external_id' => ['aboutChannelInfo.channelId', 'channelId'],
                        'handle' => ['aboutChannelInfo.channelUsername', 'channelUsername'],
                        'display_name' => ['aboutChannelInfo.channelName', 'channelName'],
                        'profile_url' => ['aboutChannelInfo.channelUrl', 'channelUrl'],
                        'avatar_url' => ['aboutChannelInfo.channelAvatarUrl', 'channelAvatarUrl'],
                    ],
                    'metric_paths' => [
                        'subscribers_total' => ['aboutChannelInfo.numberOfSubscribers', 'numberOfSubscribers'],
                        'videos_total' => ['aboutChannelInfo.channelTotalVideos', 'channelTotalVideos'],
                        'views_total' => ['aboutChannelInfo.channelTotalViews', 'channelTotalViews'],
                    ],
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'sort_order' => 30,
                'is_active' => true,
                'last_synced_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['network', 'handle'], [
            'provider',
            'provider_resource_type',
            'provider_resource_id',
            'task_input_override',
            'display_name',
            'url',
            'primary_metric_code',
            'normalizer_type',
            'normalizer_config',
            'sort_order',
            'is_active',
            'updated_at',
        ]);
    }

    public function down(): void
    {
        DB::table('social_profiles')
            ->where('network', 'youtube')
            ->where('handle', 'tvvipsocial')
            ->delete();
    }
};
