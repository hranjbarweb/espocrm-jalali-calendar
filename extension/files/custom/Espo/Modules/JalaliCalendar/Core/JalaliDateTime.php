<?php

namespace Espo\Modules\JalaliCalendar\Core;

use DateTimeImmutable;
use DateTimeZone;
use Espo\Core\Utils\DateTime as DateTimeService;
use Exception;
use RuntimeException;

class JalaliDateTime extends DateTimeService
{
    private string $zoneName;

    private string $storedTimeFormat;

    public function __construct(
        ?string $dateFormat = 'YYYY-MM-DD',
        ?string $timeFormat = 'HH:mm',
        ?string $timeZone = 'UTC',
        ?string $language = 'en_US'
    ) {
        parent::__construct($dateFormat, $timeFormat, $timeZone, $language);

        $this->zoneName = $timeZone ?: 'UTC';
        $this->storedTimeFormat = $timeFormat ?: 'HH:mm';
    }

    public function convertSystemDate(
        string $string,
        ?string $format = null,
        ?string $language = null
    ): string {
        $dateTime = DateTimeImmutable::createFromFormat('!Y-m-d', $string);

        if ($dateTime === false) {
            throw new RuntimeException("Could not parse date `{$string}`.");
        }

        return Jalali::format(
            (int) $dateTime->format('Y'),
            (int) $dateTime->format('n'),
            (int) $dateTime->format('j')
        );
    }

    public function convertSystemDateTime(
        string $string,
        ?string $timezone = null,
        ?string $format = null,
        ?string $language = null
    ): string {
        if (strlen($string) === 16) {
            $string .= ':00';
        }

        $dateTime = \DateTime::createFromFormat('Y-m-d H:i:s', $string);

        if ($dateTime === false) {
            throw new RuntimeException("Could not parse date-time `{$string}`.");
        }

        $dateTime->setTimezone($this->resolveZone($timezone));

        return Jalali::format(
            (int) $dateTime->format('Y'),
            (int) $dateTime->format('n'),
            (int) $dateTime->format('j')
        ) . ' ' . $dateTime->format($this->phpTimeFormat($format));
    }

    public function getTodayString(?string $timezone = null, ?string $format = null): string
    {
        $dateTime = new \DateTime('now', $this->resolveZone($timezone));

        return Jalali::format(
            (int) $dateTime->format('Y'),
            (int) $dateTime->format('n'),
            (int) $dateTime->format('j')
        );
    }

    public function getNowString(?string $timezone = null, ?string $format = null): string
    {
        $dateTime = new \DateTime('now', $this->resolveZone($timezone));

        return Jalali::format(
            (int) $dateTime->format('Y'),
            (int) $dateTime->format('n'),
            (int) $dateTime->format('j')
        ) . ' ' . $dateTime->format($this->phpTimeFormat($format));
    }

    private function resolveZone(?string $timezone): DateTimeZone
    {
        try {
            return new DateTimeZone($timezone ?: $this->zoneName);
        } catch (Exception $e) {
            throw new RuntimeException($e->getMessage());
        }
    }

    private function phpTimeFormat(?string $format): string
    {
        $source = $this->storedTimeFormat;

        if ($format && preg_match('/(HH:mm:ss|hh:mm:ss A|hh:mm A|hh:mm a|HH:mm)/', $format, $matches)) {
            $source = $matches[1];
        }

        return match ($source) {
            'HH:mm:ss' => 'H:i:s',
            'hh:mm A' => 'h:i A',
            'hh:mm a' => 'h:i a',
            'hh:mm:ss A' => 'h:i:s A',
            default => 'H:i',
        };
    }
}
