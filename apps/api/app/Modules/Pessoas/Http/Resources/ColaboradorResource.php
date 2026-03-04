<?php

namespace App\Modules\Pessoas\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ColaboradorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $now = Carbon::now();
        $yearsOfService = $this->admission_date
            ? (int) Carbon::parse($this->admission_date)->diffInYears($now)
            : null;

        $daysUntilBirthday = $this->birth_date
            ? $this->computeDaysUntilBirthday($this->birth_date, $now)
            : null;

        $nextMilestone = $this->admission_date
            ? $this->computeNextMilestone($this->admission_date, $now)
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'role' => $this->getRoleNames()->first() ?? $this->role,
            'department' => $this->department,
            'profile' => $this->getRoleNames()->first() ?? 'viewer',
            'status' => $this->active ? 'active' : 'inactive',
            'active' => $this->active,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'admission_date' => $this->admission_date?->format('Y-m-d'),
            'years_of_service' => $yearsOfService,
            'days_until_birthday' => $daysUntilBirthday,
            'upcoming_milestone' => $nextMilestone,
            'last_login_at' => $this->last_login_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function computeDaysUntilBirthday(string|Carbon $birthDate, Carbon $now): int
    {
        $birth = Carbon::parse($birthDate);
        $nextBirthday = $birth->copy()->year($now->year);

        if ($nextBirthday->isPast() && !$nextBirthday->isToday()) {
            $nextBirthday->addYear();
        }

        return (int) $now->diffInDays($nextBirthday, false);
    }

    protected function computeNextMilestone(string|Carbon $admissionDate, Carbon $now): ?array
    {
        $admission = Carbon::parse($admissionDate);
        $yearsWorked = (int) $admission->diffInYears($now);

        // Milestones: 1, 2, 3, 5, 10, 15, 20, 25, 30 anos
        $milestones = [1, 2, 3, 5, 10, 15, 20, 25, 30];

        foreach ($milestones as $milestone) {
            if ($milestone > $yearsWorked) {
                $milestoneDate = $admission->copy()->addYears($milestone);
                $daysUntil = $now->diffInDays($milestoneDate, false);

                return [
                    'type' => 'anniversary',
                    'years' => $milestone,
                    'days_until' => max(0, (int) $daysUntil),
                ];
            }
        }

        return null;
    }
}
