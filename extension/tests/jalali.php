<?php

require __DIR__ . '/../files/custom/Espo/Modules/JalaliCalendar/Core/Jalali.php';

use Espo\Modules\JalaliCalendar\Core\Jalali;

$pairs = [
    [[2021, 3, 21], [1400, 1, 1]],
    [[2024, 3, 20], [1403, 1, 1]],
    [[2025, 3, 21], [1404, 1, 1]],
    [[2026, 3, 21], [1405, 1, 1]],
    [[2026, 10, 21], [1405, 7, 29]],
    [[2021, 3, 20], [1399, 12, 30]],
];

$failed = false;

foreach ($pairs as [$gregorian, $jalali]) {
    $converted = Jalali::toJalali($gregorian[0], $gregorian[1], $gregorian[2]);
    $got = [$converted['jy'], $converted['jm'], $converted['jd']];

    if ($got !== $jalali) {
        fwrite(STDERR, 'toJalali ' . json_encode($gregorian) . ' => ' . json_encode($got) . PHP_EOL);
        $failed = true;
    }

    $back = Jalali::toGregorian($jalali[0], $jalali[1], $jalali[2]);
    $backGot = [$back['gy'], $back['gm'], $back['gd']];

    if ($backGot !== $gregorian) {
        fwrite(STDERR, 'toGregorian ' . json_encode($jalali) . ' => ' . json_encode($backGot) . PHP_EOL);
        $failed = true;
    }

    $left = (new DateTimeImmutable(sprintf('%04d-%02d-%02d UTC', $gregorian[0], $gregorian[1], $gregorian[2])))->format('w');
    $right = (new DateTimeImmutable(sprintf('%04d-%02d-%02d UTC', $back['gy'], $back['gm'], $back['gd'])))->format('w');

    if ($left !== $right) {
        fwrite(STDERR, "weekday mismatch {$left} {$right}" . PHP_EOL);
        $failed = true;
    }
}

$wednesday = (new DateTimeImmutable('2026-10-21 UTC'))->format('w');

if ($wednesday !== '3') {
    fwrite(STDERR, "2026-10-21 weekday is {$wednesday}" . PHP_EOL);
    $failed = true;
}

if (!Jalali::isLeap(1403) || Jalali::isLeap(1404)) {
    fwrite(STDERR, "leap year check failed" . PHP_EOL);
    $failed = true;
}

if (Jalali::daysInMonth(1403, 12) !== 30 || Jalali::daysInMonth(1404, 12) !== 29) {
    fwrite(STDERR, "month length check failed" . PHP_EOL);
    $failed = true;
}

if (!Jalali::isValid(1403, 12, 30) || Jalali::isValid(1404, 12, 30)) {
    fwrite(STDERR, "validity check failed" . PHP_EOL);
    $failed = true;
}

if (Jalali::format(2026, 10, 21) !== '1405/07/29') {
    fwrite(STDERR, 'format failed: ' . Jalali::format(2026, 10, 21) . PHP_EOL);
    $failed = true;
}

if ($failed) {
    exit(1);
}

echo "jalali php ok\n";
