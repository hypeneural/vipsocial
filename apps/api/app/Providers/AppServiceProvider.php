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

            if ($propertyId === '' || $credentialsPath === '' || !is_file($credentialsPath)) {
                return new NullAnalyticsClient();
            }

            return new Ga4AnalyticsClient($propertyId, $credentialsPath);
        });

        $this->app->bind(WhatsAppProviderInterface::class, function () {
            $baseUrl = trim((string) config('whatsapp.zapi.base_url', ''));
            $instance = trim((string) config('whatsapp.zapi.instance', ''));
            $token = trim((string) config('whatsapp.zapi.token', ''));
            $clientToken = trim((string) config('whatsapp.zapi.client_token', ''));

            if ($baseUrl === '' || $instance === '' || $token === '' || $clientToken === '') {
                return new NullWhatsAppClient();
            }

            return new ZApiClient();
        });

        $this->app->bind(ApifyClientInterface::class, function () {
            $provider = trim((string) config('social.provider', ''));
            $baseUrl = trim((string) config('social.apify.base_url', ''));
            $token = trim((string) config('social.apify.token', ''));

            if ($provider !== 'apify' || $baseUrl === '' || $token === '') {
                return new NullApifyClient();
            }

            return new ApifyClient();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
