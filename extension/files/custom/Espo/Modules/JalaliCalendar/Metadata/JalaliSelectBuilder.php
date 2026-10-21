<?php

namespace Espo\Modules\JalaliCalendar\Metadata;

use Espo\Core\Select\Where\DefaultDateTimeItemTransformer;
use Espo\Core\Utils\Metadata\AdditionalBuilder;
use Espo\Modules\JalaliCalendar\Select\JalaliDateTimeItemTransformer;
use Espo\Modules\JalaliCalendar\Select\MeetingDateTimeItemTransformer;
use stdClass;

class JalaliSelectBuilder implements AdditionalBuilder
{
    public function build(stdClass $data): void
    {
        if (!isset($data->scopes) || !is_object($data->scopes)) {
            return;
        }

        if (!isset($data->selectDefs) || !is_object($data->selectDefs)) {
            $data->selectDefs = new stdClass();
        }

        $defaultClass = DefaultDateTimeItemTransformer::class;
        $meetingClass = 'Espo\\Modules\\Crm\\Classes\\Select\\Meeting\\Where\\DateTimeItemTransformer';

        foreach (get_object_vars($data->scopes) as $scope => $defs) {
            if (!is_object($defs) || (empty($defs->entity) && empty($defs->type))) {
                continue;
            }

            $item = $data->selectDefs->$scope ?? new stdClass();

            if (!is_object($item)) {
                $item = new stdClass();
            }

            $class = $item->whereDateTimeItemTransformerClassName ?? null;

            if ($class === null || $class === $defaultClass) {
                $item->whereDateTimeItemTransformerClassName = JalaliDateTimeItemTransformer::class;
            } elseif ($class === $meetingClass) {
                $item->whereDateTimeItemTransformerClassName = MeetingDateTimeItemTransformer::class;
            }

            $data->selectDefs->$scope = $item;
        }
    }
}
