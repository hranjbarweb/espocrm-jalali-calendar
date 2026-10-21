define('jalali-calendar:patch', ['jalali-calendar:jalaali', 'jalali-calendar:format'], function (jalaali, format) {
    function install(DateTime) {
        if (DateTime && DateTime.default && !DateTime.prototype) {
            DateTime = DateTime.default;
        }

        if (!DateTime || !DateTime.prototype || DateTime.prototype.__jalaliPatched) {
            return;
        }

        var originalFromDisplayDate = DateTime.prototype.fromDisplayDate;
        var originalFromDisplay = DateTime.prototype.fromDisplay;
        var moment = window.moment;

        DateTime.prototype.toDisplayDate = function (string) {
            if (!string || typeof string !== 'string') {
                return '';
            }

            var match = string.match(/^(\d{4})-(\d{2})-(\d{2})/);

            if (!match) {
                return '';
            }

            var converted = jalaali.toJalali(+match[1], +match[2], +match[3]);

            return format.formatJalali(converted.jy, converted.jm, converted.jd);
        };

        DateTime.prototype.fromDisplayDate = function (string) {
            if (!string || typeof string !== 'string') {
                return -1;
            }

            var iso = format.gregorianIsoFromDisplay(string);

            if (iso === false) {
                return -1;
            }

            if (!iso) {
                return originalFromDisplayDate.call(this, string);
            }

            var parsed = moment.utc(iso, 'YYYY-MM-DD');

            if (!parsed.isValid()) {
                return -1;
            }

            return parsed.format(this.internalDateFormat);
        };

        DateTime.prototype.toDisplay = function (string) {
            if (!string) {
                return '';
            }

            var stamp = this.toMoment(string);

            if (!stamp || !stamp.isValid()) {
                return '';
            }

            var converted = jalaali.toJalali(stamp.year(), stamp.month() + 1, stamp.date());

            return format.formatJalali(converted.jy, converted.jm, converted.jd) + ' ' + stamp.format(this.timeFormat);
        };

        DateTime.prototype.fromDisplay = function (string) {
            if (!string || typeof string !== 'string') {
                return -1;
            }

            var parts = format.splitDisplayParts(string, this.timeFormat);
            var iso = format.gregorianIsoFromDisplay(parts.date);

            if (iso === false) {
                return -1;
            }

            if (!iso) {
                return originalFromDisplay.call(this, string);
            }

            var pattern = 'YYYY-MM-DD ' + this.timeFormat;
            var combined = iso + ' ' + (parts.time || '00:00');
            var parsed = this.timeZone
                ? moment.tz(combined, pattern, this.timeZone).utc()
                : moment.utc(combined, pattern);

            if (!parsed.isValid()) {
                return -1;
            }

            return parsed.format(this.internalDateTimeFormat) + ':00';
        };

        DateTime.prototype.__jalaliPatched = true;
    }

    return {install: install};
});
