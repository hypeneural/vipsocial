<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\DateParserService;
use Tests\TestCase;

class DateParserServiceTest extends TestCase
{
    public function test_parse_applies_preprocessors_and_configured_formats(): void
    {
        $service = new DateParserService();

        $result = $service->parse(
            rawDate: ' Publicado em 11/03/2026 08:30 ',
            dateFormats: ['d/m/Y H:i'],
            timezoneDefault: 'America/Sao_Paulo',
            preprocessors: [
                ['type' => 'trim'],
                ['type' => 'replace', 'search' => 'Publicado em ', 'replace' => ''],
            ],
            source: 'article_time_tag',
        );

        $this->assertTrue($result->wasSuccessful());
        $this->assertSame('article_time_tag', $result->source);
        $this->assertSame('America/Sao_Paulo', $result->timezone);
        $this->assertSame('2026-03-11T08:30:00-03:00', $result->parsed?->toIso8601String());
        $this->assertSame('2026-03-11T11:30:00+00:00', $result->utc?->toIso8601String());
    }

    public function test_parse_uses_regex_extract_and_carbon_fallback(): void
    {
        $service = new DateParserService();

        $result = $service->parse(
            rawDate: 'Data: 2026-03-11T14:05:00Z | atualizado',
            preprocessors: [
                ['type' => 'regex_extract', 'pattern' => '/(2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/'],
            ],
        );

        $this->assertTrue($result->wasSuccessful());
        $this->assertSame('carbon_autodetect', $result->source);
        $this->assertSame('2026-03-11T14:05:00+00:00', $result->utc?->toIso8601String());
    }

    public function test_parse_returns_unparseable_for_invalid_dates(): void
    {
        $service = new DateParserService();

        $result = $service->parse('sem data valida');

        $this->assertFalse($result->wasSuccessful());
        $this->assertNull($result->parsed);
        $this->assertNull($result->utc);
        $this->assertSame('unparseable', $result->source);
    }
}
