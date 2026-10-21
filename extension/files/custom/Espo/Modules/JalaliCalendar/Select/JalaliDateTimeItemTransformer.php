<?php

namespace Espo\Modules\JalaliCalendar\Select;

use DateTime;
use DateTimeZone;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Select\Where\DefaultDateTimeItemTransformer;
use Espo\Core\Select\Where\Item;
use Espo\Core\Select\Where\Item\Type;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\DateTime as DateTimeUtil;
use Espo\Modules\JalaliCalendar\Core\Jalali;
use Exception;

class JalaliDateTimeItemTransformer extends DefaultDateTimeItemTransformer
{
    public function __construct(
        private Config $config,
        private Config\ApplicationConfig $applicationConfig,
    ) {
        parent::__construct($config, $applicationConfig);
    }

    public function transform(Item $item): Item
    {
        $type = $item->getType();

        if (!in_array($type, $this->jalaliTypes(), true)) {
            return parent::transform($item);
        }

        $attribute = $item->getAttribute();
        $data = $item->getData();

        if (!$data instanceof Item\Data\DateTime) {
            throw new BadRequest('Bad where item.');
        }

        if (!$attribute) {
            throw new BadRequest("Bad datetime where item. Empty 'attribute'.");
        }

        $timeZone = $data->getTimeZone() ?? $this->applicationConfig->getTimeZone();

        try {
            $zone = new DateTimeZone($timeZone);
            $now = new DateTime('now', $zone);
        } catch (Exception) {
            throw new BadRequest('Bad timezone');
        }

        $jalali = Jalali::toJalali(
            (int) $now->format('Y'),
            (int) $now->format('n'),
            (int) $now->format('j')
        );

        $value = $this->period($type, $jalali['jy'], $jalali['jm'], $zone);

        return Item::fromRaw([
            'type' => Type::BETWEEN,
            'attribute' => $attribute,
            'value' => $value,
        ]);
    }

    /**
     * @return string[]
     */
    private function jalaliTypes(): array
    {
        return [
            Type::CURRENT_MONTH,
            Type::LAST_MONTH,
            Type::NEXT_MONTH,
            Type::CURRENT_QUARTER,
            Type::LAST_QUARTER,
            Type::CURRENT_YEAR,
            Type::LAST_YEAR,
            Type::CURRENT_FISCAL_YEAR,
            Type::LAST_FISCAL_YEAR,
            Type::CURRENT_FISCAL_QUARTER,
            Type::LAST_FISCAL_QUARTER,
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function period(string $type, int $jy, int $jm, DateTimeZone $zone): array
    {
        if ($type === Type::LAST_MONTH || $type === Type::NEXT_MONTH || $type === Type::CURRENT_MONTH) {
            $delta = 0;

            if ($type === Type::LAST_MONTH) {
                $delta = -1;
            } elseif ($type === Type::NEXT_MONTH) {
                $delta = 1;
            }

            [$year, $month] = $this->shiftMonth($jy, $jm, $delta);
            [$endYear, $endMonth] = $this->shiftMonth($year, $month, 1);

            return $this->bounds($year, $month, 1, $endYear, $endMonth, 1, $zone);
        }

        if ($type === Type::CURRENT_QUARTER || $type === Type::LAST_QUARTER) {
            $quarter = (int) ceil($jm / 3);

            if ($type === Type::LAST_QUARTER) {
                $quarter--;

                if ($quarter < 1) {
                    $quarter = 4;
                    $jy--;
                }
            }

            $startMonth = ($quarter - 1) * 3 + 1;
            [$endYear, $endMonth] = $this->shiftMonth($jy, $startMonth, 3);

            return $this->bounds($jy, $startMonth, 1, $endYear, $endMonth, 1, $zone);
        }

        if ($type === Type::CURRENT_YEAR || $type === Type::LAST_YEAR) {
            $year = $type === Type::LAST_YEAR ? $jy - 1 : $jy;

            return $this->bounds($year, 1, 1, $year + 1, 1, 1, $zone);
        }

        [$fiscalYear, $fiscalMonth] = $this->fiscalStart($jy, $jm);

        if ($type === Type::LAST_FISCAL_YEAR) {
            $fiscalYear--;
        }

        if ($type === Type::CURRENT_FISCAL_YEAR || $type === Type::LAST_FISCAL_YEAR) {
            return $this->bounds($fiscalYear, $fiscalMonth, 1, $fiscalYear + 1, $fiscalMonth, 1, $zone);
        }

        $index = $jm - $fiscalMonth;

        if ($index < 0) {
            $index += 12;
        }

        $quarter = intdiv($index, 3);

        if ($type === Type::LAST_FISCAL_QUARTER) {
            $quarter--;

            if ($quarter < 0) {
                $quarter = 3;
                $fiscalYear--;
            }
        }

        $startMonth = $fiscalMonth + $quarter * 3;
        $startYear = $fiscalYear;

        if ($startMonth > 12) {
            $startMonth -= 12;
            $startYear++;
        }

        [$endYear, $endMonth] = $this->shiftMonth($startYear, $startMonth, 3);

        return $this->bounds($startYear, $startMonth, 1, $endYear, $endMonth, 1, $zone);
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function fiscalStart(int $jy, int $jm): array
    {
        $shift = (int) $this->config->get('fiscalYearShift', 0);
        $startMonth = $shift + 1;

        if ($startMonth < 1) {
            $startMonth = 1;
        }

        if ($startMonth > 12) {
            $startMonth = (($startMonth - 1) % 12) + 1;
        }

        $startYear = $jm < $startMonth ? $jy - 1 : $jy;

        return [$startYear, $startMonth];
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function shiftMonth(int $year, int $month, int $delta): array
    {
        $month += $delta;

        while ($month > 12) {
            $month -= 12;
            $year++;
        }

        while ($month < 1) {
            $month += 12;
            $year--;
        }

        return [$year, $month];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function bounds(
        int $year,
        int $month,
        int $day,
        int $endYear,
        int $endMonth,
        int $endDay,
        DateTimeZone $zone
    ): array {
        $from = new DateTime(Jalali::gregorianIso($year, $month, $day) . ' 00:00:00', $zone);
        $to = new DateTime(Jalali::gregorianIso($endYear, $endMonth, $endDay) . ' 00:00:00', $zone);

        $to->modify('-1 second');
        $from->setTimezone(new DateTimeZone('UTC'));
        $to->setTimezone(new DateTimeZone('UTC'));

        $format = DateTimeUtil::SYSTEM_DATE_TIME_FORMAT;

        return [$from->format($format), $to->format($format)];
    }
}
