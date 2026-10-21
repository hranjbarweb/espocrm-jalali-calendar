define('jalali-calendar:views/fields/date', [
    'views/fields/date',
    'date-time',
    'jalali-calendar:patch',
    'jalali-calendar:format',
    'jalali-calendar:picker',
], function (Dep, DateTime, patch, format, picker) {
    patch.install(DateTime);

    return class extends Dep {
        convertDateValueForDetail(value) {
            if (this.useNumericFormat) {
                return this.getDateTime().toDisplayDate(value);
            }

            return format.jalaliDetailDate(this, value);
        }

        afterRender() {
            super.afterRender();
            picker.replaceDatePickers(this);
        }
    };
});
