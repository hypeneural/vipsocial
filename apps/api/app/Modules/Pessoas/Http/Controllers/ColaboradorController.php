<?php

namespace App\Modules\Pessoas\Http\Controllers;

use App\Models\User;
use App\Modules\Pessoas\Http\Resources\ColaboradorResource;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ColaboradorController extends BaseController
{
    /**
     * Lista colaboradores com filtros e campos computados.
     */
    public function index(Request $request): JsonResponse
    {
        $users = QueryBuilder::for(User::class)
            ->allowedFilters([
                AllowedFilter::exact('active'),
                AllowedFilter::exact('department'),
                AllowedFilter::partial('search', 'name'),
                AllowedFilter::callback('profile', function ($query, $value) {
                    $query->whereHas('roles', fn($q) => $q->where('name', $value));
                }),
            ])
            ->allowedSorts(['name', 'created_at', 'admission_date', 'department'])
            ->defaultSort('name')
            ->paginate($request->get('per_page', 15));

        return $this->jsonPaginated($users, ColaboradorResource::class);
    }

    /**
     * Stats: total, ativos, aniversários do mês, marcos próximos.
     */
    public function stats(): JsonResponse
    {
        $now = Carbon::now();
        $total = User::count();
        $active = User::where('active', true)->count();

        // Aniversariantes este mês
        $birthdaysThisMonth = User::whereMonth('birth_date', $now->month)->count();

        // Marcos nos próximos 30 dias (1, 2, 3, 5, 10, 15, 20, 25, 30 anos)
        $milestones = [1, 2, 3, 5, 10, 15, 20, 25, 30];
        $upcomingMilestones = 0;

        $usersWithAdmission = User::whereNotNull('admission_date')->get(['id', 'admission_date']);
        foreach ($usersWithAdmission as $user) {
            $admission = Carbon::parse($user->admission_date);
            $yearsWorked = $admission->diffInYears($now);

            foreach ($milestones as $m) {
                if ($m > $yearsWorked) {
                    $milestoneDate = $admission->copy()->addYears($m);
                    $daysUntil = $now->diffInDays($milestoneDate, false);
                    if ($daysUntil >= 0 && $daysUntil <= 30) {
                        $upcomingMilestones++;
                    }
                    break;
                }
            }
        }

        return $this->jsonSuccess([
            'total' => $total,
            'active' => $active,
            'birthdays_this_month' => $birthdaysThisMonth,
            'upcoming_milestones' => $upcomingMilestones,
        ]);
    }

    /**
     * Aniversariantes próximos (30 dias).
     */
    public function aniversarios(Request $request): JsonResponse
    {
        $days = max(1, (int) $request->get('days', 30));
        $limit = max(0, (int) $request->get('limit', 0));
        $includeMilestones = filter_var(
            $request->get('include_milestones', true),
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );
        $includeMilestones = $includeMilestones ?? true;

        $now = Carbon::now();

        $users = User::query()
            ->with('roles')
            ->where('active', true)
            ->where(function ($query) use ($includeMilestones) {
                $query->whereNotNull('birth_date');

                if ($includeMilestones) {
                    $query->orWhereNotNull('admission_date');
                }
            })
            ->get([
                'id',
                'name',
                'email',
                'phone',
                'avatar_url',
                'role',
                'department',
                'active',
                'birth_date',
                'admission_date',
                'last_login_at',
                'created_at',
                'updated_at',
            ]);

        $upcoming = $users->map(function ($user) use ($now) {
            $birthdayDaysUntil = null;
            if ($user->birth_date) {
                $birth = Carbon::parse($user->birth_date);
                $nextBirthday = $birth->copy()->year($now->year);

                if ($nextBirthday->isPast() && !$nextBirthday->isToday()) {
                    $nextBirthday->addYear();
                }

                $birthdayDaysUntil = $now->diffInDays($nextBirthday, false);
            }

            $milestoneDaysUntil = null;
            if ($user->admission_date) {
                $nextMilestone = $this->computeNextMilestone($user->admission_date, $now);
                if ($nextMilestone !== null) {
                    $milestoneDaysUntil = (int) ($nextMilestone['days_until'] ?? null);
                }
            }

            $candidates = array_values(array_filter([
                is_numeric($birthdayDaysUntil) ? (int) $birthdayDaysUntil : null,
                is_numeric($milestoneDaysUntil) ? (int) $milestoneDaysUntil : null,
            ], static fn($value) => $value !== null));

            $user->_days_until = !empty($candidates) ? min($candidates) : null;

            return $user;
        })
            ->filter(fn($u) => $u->_days_until !== null && $u->_days_until >= 0 && $u->_days_until <= $days)
            ->sortBy('_days_until')
            ->values()
            ->when($limit > 0, fn($collection) => $collection->take($limit)->values());

        return $this->jsonSuccess(ColaboradorResource::collection($upcoming));
    }

    private function computeNextMilestone(string|Carbon $admissionDate, Carbon $now): ?array
    {
        $admission = Carbon::parse($admissionDate);
        $yearsWorked = (int) $admission->diffInYears($now);
        $milestones = [1, 2, 3, 5, 10, 15, 20, 25, 30];

        foreach ($milestones as $milestone) {
            if ($milestone > $yearsWorked) {
                $milestoneDate = $admission->copy()->addYears($milestone);
                $daysUntil = (int) $now->diffInDays($milestoneDate, false);

                return [
                    'type' => 'anniversary',
                    'years' => $milestone,
                    'days_until' => max(0, $daysUntil),
                ];
            }
        }

        return null;
    }

    /**
     * Detalhe de um colaborador.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('roles', 'preferences')->findOrFail($id);
        return $this->jsonSuccess(new ColaboradorResource($user));
    }

    /**
     * Atualizar colaborador.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', "unique:users,email,{$id}"],
            'phone' => ['nullable', 'string', 'max:20'],
            'department' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date_format:Y-m-d'],
            'admission_date' => ['nullable', 'date_format:Y-m-d'],
            'active' => ['sometimes', 'boolean'],
            'profile' => ['sometimes', 'string', 'in:admin,editor,journalist,media,analyst'],
        ]);

        // Handle role change
        if (isset($data['profile'])) {
            $user->syncRoles([$data['profile']]);
            $user->role = $data['profile'];
            unset($data['profile']);
        }

        $user->update($data);
        $user->load('roles', 'preferences');

        return $this->jsonSuccess(new ColaboradorResource($user), 'Colaborador atualizado');
    }

    /**
     * Criar novo colaborador.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'department' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date_format:Y-m-d'],
            'admission_date' => ['nullable', 'date_format:Y-m-d'],
            'profile' => ['required', 'string', 'in:admin,editor,journalist,media,analyst'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $password = $data['password'] ?? 'VipSocial@' . rand(1000, 9999);
        $profile = $data['profile'];
        unset($data['profile'], $data['password']);

        $user = User::create([
            ...$data,
            'password' => bcrypt($password),
            'role' => $profile,
            'active' => true,
            'admission_date' => $data['admission_date'] ?? now()->format('Y-m-d'),
        ]);

        $user->assignRole($profile);
        $user->load('roles');

        return $this->jsonSuccess(
            new ColaboradorResource($user),
            'Colaborador criado com sucesso'
        );
    }

    /**
     * Deletar colaborador (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $userName = $user->name;
        $user->delete();

        return $this->jsonSuccess(null, "Colaborador '{$userName}' removido");
    }
}
