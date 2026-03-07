<?php

namespace App\Modules\Enquetes\Http\Requests\Public;

class TrackWidgetEventRequest extends BasePublicEnquetesRequest
{
    public function rules(): array
    {
        return [
            'placement_public_id' => ['required', 'string', 'max:26'],
            'session_token' => ['nullable', 'string', 'max:191'],
            'option_public_id' => ['nullable', 'string', 'max:26'],
            'event_type' => ['required', 'string', 'in:widget_loaded,widget_visible,option_selected,vote_clicked,vote_submitted,vote_accepted,vote_blocked,results_viewed,share_clicked'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
