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
                'provider_resource_id' => 'clean_quicksand~vipsocial-instagram',
                'task_input_override' => json_encode([
                    'usernames' => ['vipsocial'],
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'network' => 'instagram',
                'handle' => 'vipsocial',
                'display_name' => 'VipSocial',
                'external_profile_id' => null,
                'url' => 'https://www.instagram.com/vipsocial',
                'avatar_url' => null,
                'primary_metric_code' => 'followers_total',
                'normalizer_type' => 'path_map',
                'normalizer_config' => json_encode([
                    'item_index' => 0,
                    'identity_paths' => [
                        'external_id' => 'userId',
                        'handle' => 'userName',
                        'display_name' => 'userFullName',
                        'profile_url' => 'userUrl',
                        'avatar_url' => 'profilePic',
                    ],
                    'metric_paths' => [
                        'followers_total' => 'followersCount',
                        'following_total' => 'followsCount',
                    ],
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'sort_order' => 10,
                'is_active' => true,
                'last_synced_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::ulid(),
                'provider' => 'apify',
                'provider_resource_type' => 'task',
                'provider_resource_id' => 'clean_quicksand~vipsocial-facebook',
                'task_input_override' => json_encode([
                    'startUrls' => [
                        ['url' => 'https://www.facebook.com/vipsocial'],
                    ],
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'network' => 'facebook',
                'handle' => 'vipsocial',
                'display_name' => 'VipSocial Radio, Jornal e Tv na Internet',
                'external_profile_id' => null,
                'url' => 'https://www.facebook.com/vipsocial',
                'avatar_url' => null,
                'primary_metric_code' => 'followers_total',
                'normalizer_type' => 'path_map',
                'normalizer_config' => json_encode([
                    'item_index' => 0,
                    'identity_paths' => [
                        'external_id' => ['pageId', 'facebookId'],
                        'handle' => 'pageName',
                        'display_name' => ['title', 'pageName'],
                        'profile_url' => 'pageUrl',
                        'avatar_url' => 'profilePictureUrl',
                    ],
                    'metric_paths' => [
                        'followers_total' => 'followers',
                        'likes_total' => 'likes',
                        'following_total' => 'followings',
                        'rating_overall' => 'ratingOverall',
                        'rating_count' => 'ratingCount',
                    ],
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'sort_order' => 20,
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
            ->whereIn('network', ['instagram', 'facebook'])
            ->where('handle', 'vipsocial')
            ->delete();
    }
};

