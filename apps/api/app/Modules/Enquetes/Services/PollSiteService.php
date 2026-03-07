<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\PollSite;
use App\Modules\Enquetes\Models\PollSiteDomain;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PollSiteService
{
    public function list(): Collection
    {
        return PollSite::query()
            ->with('domains')
            ->withCount(['domains', 'placements'])
            ->orderBy('name')
            ->get();
    }

    public function create(array $validated): PollSite
    {
        return DB::transaction(function () use ($validated): PollSite {
            $site = new PollSite();
            $this->fillSite($site, $validated);
            $site->save();

            return $site->fresh(['domains']);
        });
    }

    public function update(PollSite $site, array $validated): PollSite
    {
        return DB::transaction(function () use ($site, $validated): PollSite {
            $this->fillSite($site, $validated);
            $site->save();

            return $site->fresh(['domains']);
        });
    }

    public function createDomain(PollSite $site, array $validated): PollSiteDomain
    {
        return $site->domains()->create([
            'domain_pattern' => $validated['domain_pattern'],
            'is_active' => $validated['is_active'] ?? true,
        ]);
    }

    public function updateDomain(PollSiteDomain $domain, array $validated): PollSiteDomain
    {
        $domain->fill([
            'domain_pattern' => $validated['domain_pattern'],
            'is_active' => $validated['is_active'] ?? $domain->is_active,
        ]);
        $domain->save();

        return $domain->fresh();
    }

    public function deleteDomain(PollSiteDomain $domain): void
    {
        $domain->delete();
    }

    public function serializeSite(PollSite $site): array
    {
        $site->loadMissing('domains');

        return [
            'id' => $site->id,
            'name' => $site->name,
            'public_key' => $site->public_key,
            'has_secret_key' => filled($site->secret_key_hash),
            'is_active' => $site->is_active,
            'settings' => $site->settings ?? [],
            'domains_count' => $site->domains_count ?? $site->domains->count(),
            'placements_count' => $site->placements_count ?? 0,
            'domains' => $site->domains
                ->map(fn(PollSiteDomain $domain) => $this->serializeDomain($domain))
                ->values()
                ->all(),
            'created_at' => optional($site->created_at)?->toIso8601String(),
            'updated_at' => optional($site->updated_at)?->toIso8601String(),
        ];
    }

    public function serializeDomain(PollSiteDomain $domain): array
    {
        return [
            'id' => $domain->id,
            'poll_site_id' => $domain->poll_site_id,
            'domain_pattern' => $domain->domain_pattern,
            'is_active' => $domain->is_active,
            'created_at' => optional($domain->created_at)?->toIso8601String(),
            'updated_at' => optional($domain->updated_at)?->toIso8601String(),
        ];
    }

    private function fillSite(PollSite $site, array $validated): void
    {
        $site->fill([
            'name' => $validated['name'],
            'public_key' => $validated['public_key'] ?? $site->public_key ?? ('site_' . Str::lower((string) Str::ulid())),
            'is_active' => $validated['is_active'] ?? true,
            'settings' => $validated['settings'] ?? [],
        ]);

        if (filled($validated['secret_key'] ?? null)) {
            $site->secret_key_hash = Hash::make((string) $validated['secret_key']);
        }
    }
}
