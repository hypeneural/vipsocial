<?php

namespace App\Providers;

use App\Modules\Analytics\Clients\AnalyticsClientInterface;
use App\Modules\Analytics\Clients\Ga4AnalyticsClient;
use App\Modules\Analytics\Clients\NullAnalyticsClient;
use App\Modules\Social\Clients\ApifyClient;
use App\Modules\Social\Clients\ApifyClientInterface;
use App\Modules\Social\Clients\NullApifyClient;
use App\Modules\WhatsApp\Clients\NullWhatsAppClient;
use App\Modules\WhatsApp\Clients\WhatsAppProviderInterface;
use App\Modules\WhatsApp\Clients\ZApiClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AnalyticsClientInterface::class, function () {
            $propertyId = (string) config('analytics.property_id', '');
            $credentialsPath = (string) config('analytics.service_account_credentials_json', '');

            if ($propertyId === '' || $credentialsPath === '' || ! is_file($credentialsPath)) {
                return new NullAnalyticsClient;
            }

            return new Ga4AnalyticsClient($propertyId, $credentialsPath);
        });

        $this->app->bind(WhatsAppProviderInterface::class, function () {
            $baseUrl = trim((string) config('whatsapp.zapi.base_url', ''));
            $instance = trim((string) config('whatsapp.zapi.instance', ''));
            $token = trim((string) config('whatsapp.zapi.token', ''));
            $clientToken = trim((string) config('whatsapp.zapi.client_token', ''));

            if ($baseUrl === '' || $instance === '' || $token === '' || $clientToken === '') {
                return new NullWhatsAppClient;
            }

            return new ZApiClient;
        });

        $this->app->bind(ApifyClientInterface::class, function () {
            $provider = trim((string) config('social.provider', ''));
            $baseUrl = trim((string) config('social.apify.base_url', ''));
            $token = trim((string) config('social.apify.token', ''));

            if ($provider !== 'apify' || $baseUrl === '' || $token === '') {
                return new NullApifyClient;
            }

            return new ApifyClient;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(function ($user): ?bool {
            if (($user->role ?? null) === 'admin') {
                return true;
            }

            if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
                return true;
            }

            return null;
        });

        RateLimiter::for('vip-gallery-view', function (Request $request) {
            return Limit::perMinute(5)->by((string) $request->ip());
        });

        RateLimiter::for('vip-gallery-download', function (Request $request) {
            $photo = $request->route('photo');
            $suffix = is_object($photo) ? (string) $photo->id : (string) $photo;

            return Limit::perMinute(5)->by((string) $request->ip().'|'.$suffix);
        });

        RateLimiter::for('raffle', function (Request $request) {
            $userId = $request->user()?->getAuthIdentifier() ?? 'guest';

            return Limit::perMinute(6)->by((string) $userId.'|'.(string) $request->ip());
        });

        RateLimiter::for('raffle-reveal', function (Request $request) {
            $userId = $request->user()?->getAuthIdentifier() ?? 'guest';

            return Limit::perMinute(12)->by((string) $userId.'|'.(string) $request->ip());
        });
    }
}
