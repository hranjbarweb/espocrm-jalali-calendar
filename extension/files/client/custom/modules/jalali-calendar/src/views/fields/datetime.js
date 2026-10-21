define('jalali-calendar:views/fields/datetime', [
    'views/fields/datetime',
    'date-time',
    'jalali-calendar:patch',
    'jalali-calendar:format',
    'jalali-calendar:picker',
], function (Dep, DateTime, patch, format, picker) {
    patch.install(DateTime);

    return class extends Dep {
        getDateStringValue() {
            return format.dateTimeStringValue(this);
        }

        splitDatetime(value) {
            return format.splitJalaliDatetime(this, value);
        }

        afterRender() {
            super.afterRender();
            picker.replaceDatePickers(this);
        }
    };
});
