define('jalali-calendar:format', ['jalali-calendar:jalaali'], function (jalaali) {
    var MONTHS = [
        'فروردین',
        'اردیبهشت',
        'خرداد',
        'تیر',
        'مرداد',
        'شهریور',
        'مهر',
        'آبان',
        'آذر',
        'دی',
        'بهمن',
        'اسفند',
    ];

    /** Index matches Date.getDay(): 0 Sunday … 6 Saturday. */
    var WEEKDAY_FULL = [
        'یکشنبه',
        'دوشنبه',
        'سه‌شنبه',
        'چهارشنبه',
        'پنجشنبه',
        'جمعه',
        'شنبه',
    ];

    var WEEKDAY_SHORT = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
    var WEEKDAY_SATURDAY_FIRST = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function formatJalali(jy, jm, jd) {
        return jy + '/' + pad(jm) + '/' + pad(jd);
    }

    function parseDisplayDate(value) {
        var match = String(value || '').trim().match(/^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})$/);

        if (!match) {
            return null;
        }

        var a = +match[1];
        var b = +match[2];
        var c = +match[3];

        if (a > 31) {
            return {y: a, mo: b, d: c};
        }

        if (c > 31) {
            return {y: c, mo: b, d: a};
        }

        return null;
    }

    function gregorianIsoFromDisplay(value) {
        var parsed = parseDisplayDate(value);

        if (!parsed || parsed.y >= 1700) {
            return null;
        }

        if (!jalaali.isValidJalaliDate(parsed.y, parsed.mo, parsed.d)) {
            return false;
        }

        var gregorian = jalaali.toGregorian(parsed.y, parsed.mo, parsed.d);

        return gregorian.gy + '-' + pad(gregorian.gm) + '-' + pad(gregorian.gd);
    }

    function anchorIso(value) {
        var parsed = parseDisplayDate(value);

        if (!parsed) {
            return null;
        }

        if (parsed.y >= 1700) {
            if (parsed.mo < 1 || parsed.mo > 12 || parsed.d < 1 || parsed.d > 31) {
                return null;
            }

            return parsed.y + '-' + pad(parsed.mo) + '-' + pad(parsed.d);
        }

        return gregorianIsoFromDisplay(value) || null;
    }

    function splitDisplayParts(value, timeFormat) {
        var text = String(value || '').trim();
        var hasMeridian = /a/i.test(timeFormat || '');
        var parts = text.split(/\s+/);

        if (hasMeridian && parts.length >= 3) {
            return {
                date: parts.slice(0, -2).join(' '),
                time: parts.slice(-2).join(' '),
            };
        }

        if (parts.length >= 2) {
            return {
                date: parts.slice(0, -1).join(' '),
                time: parts[parts.length - 1],
            };
        }

        return {date: text, time: ''};
    }

    function splitJalaliDatetime(view, value) {
        var parts = splitDisplayParts(value, view.getDateTime().timeFormat);

        return [parts.date, parts.time];
    }

    function dayRanges(anchor) {
        var temp = anchor.clone();

        return {
            today: [temp.unix(), temp.add(1, 'days').unix()],
            tomorrow: [temp.unix(), temp.add(1, 'days').unix()],
            yesterday: [temp.add(-3, 'days').unix(), temp.add(1, 'days').unix()],
        };
    }

    function jalaliDetailDate(view, systemDate) {
        var dateTime = view.getDateTime();
        var value = String(systemDate).substring(0, 10);
        var moment = window.moment;
        var today = moment.tz(dateTime.getTimeZone()).startOf('day');
        var stamp = moment.tz(value + ' 00:00:00', dateTime.internalDateTimeFormat, dateTime.getTimeZone());
        var ranges = dayRanges(today);

        if (stamp.unix() >= ranges.today[0] && stamp.unix() < ranges.today[1]) {
            return view.translate('Today');
        }

        if (stamp.unix() >= ranges.tomorrow[0] && stamp.unix() < ranges.tomorrow[1]) {
            return view.translate('Tomorrow');
        }

        if (stamp.unix() >= ranges.yesterday[0] && stamp.unix() < ranges.yesterday[1]) {
            return view.translate('Yesterday');
        }

        return dateTime.toDisplayDate(value);
    }

    function jalaliDetailDateTime(view, systemDateTime) {
        var dateTime = view.getDateTime();
        var timeFormat = dateTime.timeFormat;

        if (view.params && view.params.hasSeconds) {
            timeFormat = timeFormat.replace(/:mm/, ':mm:ss');
        }

        var stamp = dateTime.toMoment(systemDateTime);
        var moment = window.moment;
        var now = moment().tz(dateTime.timeZone || 'UTC');
        var ranges = dayRanges(now.clone().startOf('day'));
        var time = stamp.format(timeFormat);

        if (stamp.unix() >= ranges.today[0] && stamp.unix() < ranges.today[1]) {
            return view.translate('Today') + ' ' + time;
        }

        if (stamp.unix() > ranges.tomorrow[0] && stamp.unix() < ranges.tomorrow[1]) {
            return view.translate('Tomorrow') + ' ' + time;
        }

        if (stamp.unix() > ranges.yesterday[0] && stamp.unix() < ranges.yesterday[1]) {
            return view.translate('Yesterday') + ' ' + time;
        }

        return dateTime.toDisplayDate(stamp.format('YYYY-MM-DD')) + ' ' + time;
    }

    function dateTimeStringValue(view) {
        if (view.mode === view.MODE_DETAIL && !view.model.has(view.name)) {
            return -1;
        }

        var value = view.model.get(view.name);

        if (!value) {
            if (
                view.mode === view.MODE_EDIT ||
                view.mode === view.MODE_SEARCH ||
                view.mode === view.MODE_LIST ||
                view.mode === view.MODE_LIST_LINK
            ) {
                return '';
            }

            return null;
        }

        if (
            view.mode === view.MODE_LIST ||
            view.mode === view.MODE_DETAIL ||
            view.mode === view.MODE_LIST_LINK
        ) {
            if (view.getConfig().get('readableDateFormatDisabled') || view.params.useNumericFormat) {
                return view.getDateTime().toDisplay(value);
            }

            return jalaliDetailDateTime(view, value);
        }

        return view.getDateTime().toDisplay(value);
    }

    function jalaliFromGregorianIso(iso) {
        var match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);

        if (!match) {
            return null;
        }

        return jalaali.toJalali(+match[1], +match[2], +match[3]);
    }

    return {
        MONTHS: MONTHS,
        WEEKDAY_FULL: WEEKDAY_FULL,
        WEEKDAY_SHORT: WEEKDAY_SHORT,
        WEEKDAY_SATURDAY_FIRST: WEEKDAY_SATURDAY_FIRST,
        pad: pad,
        formatJalali: formatJalali,
        parseDisplayDate: parseDisplayDate,
        gregorianIsoFromDisplay: gregorianIsoFromDisplay,
        anchorIso: anchorIso,
        splitDisplayParts: splitDisplayParts,
        splitJalaliDatetime: splitJalaliDatetime,
        jalaliDetailDate: jalaliDetailDate,
        jalaliDetailDateTime: jalaliDetailDateTime,
        dateTimeStringValue: dateTimeStringValue,
        jalaliFromGregorianIso: jalaliFromGregorianIso,
    };
});
