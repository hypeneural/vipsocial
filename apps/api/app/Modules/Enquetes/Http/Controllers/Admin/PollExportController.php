<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Services\PollExportService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PollExportController
{
    public function __construct(private readonly PollExportService $service)
    {
    }

    public function votesCsv(int $id)
    {
        return $this->service->votesCsv($this->findPoll($id));
    }

    public function voteAttemptsCsv(int $id)
    {
        return $this->service->voteAttemptsCsv($this->findPoll($id));
    }

    public function optionsSummaryCsv(int $id)
    {
        return $this->service->optionsSummaryCsv($this->findPoll($id));
    }

    public function placementsSummaryCsv(int $id)
    {
        return $this->service->placementsSummaryCsv($this->findPoll($id));
    }

    private function findPoll(int $id): Poll
    {
        $poll = Poll::query()->withTrashed()->find($id);

        if ($poll === null) {
            throw (new ModelNotFoundException())->setModel(Poll::class, [$id]);
        }

        return $poll;
    }
}
