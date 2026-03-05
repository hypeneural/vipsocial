<?php

namespace App\Modules\Analytics\Clients;

interface AnalyticsClientInterface
{
    public function fetchKpis(array $query): array;

    public function fetchTopPages(array $query): array;

    public function fetchCities(array $query): array;

    public function fetchAcquisition(array $query): array;

    public function fetchRealtime(array $query = []): array;

    public function fetchTimeseries(array $query): array;
}
