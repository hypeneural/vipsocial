<?php

namespace App\Providers;

use App\Modules\Analytics\Clients\AnalyticsClientInterface;
use App\Modules\Analytics\Clients\Ga4AnalyticsClient;
use App\Modules\Analytics\Clients\NullAnalyticsClient;
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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
