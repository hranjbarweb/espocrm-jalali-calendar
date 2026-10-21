<?php

namespace Espo\Modules\JalaliCalendar\Loaders;

use Espo\Core\Container\Loader;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\DateTime as DateTimeService;
use Espo\Modules\JalaliCalendar\Core\JalaliDateTime;

class DateTime implements Loader
{
    public function __construct(private Config $config)
    {}

    public function load(): DateTimeService
    {
        $dateFormat = $this->config->get('dateFormat');
        $timeFormat = $this->config->get('timeFormat');
        $timeZone = $this->config->get('timeZone');
        $language = $this->config->get('language');

        return new JalaliDateTime(
            is_string($dateFormat) ? $dateFormat : null,
            is_string($timeFormat) ? $timeFormat : null,
            is_string($timeZone) ? $timeZone : null,
            is_string($language) ? $language : null
        );
    }
}
