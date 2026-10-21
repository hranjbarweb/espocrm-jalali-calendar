define('jalali-calendar:views/fields/datetime-optional', [
    'views/fields/datetime-optional',
    'date-time',
    'jalali-calendar:patch',
    'jalali-calendar:format',
    'jalali-calendar:picker',
], function (Dep, DateTime, patch, format, picker) {
    patch.install(DateTime);

    return class extends Dep {
        getDateStringValue() {
            if (this.isDate()) {
                var dateValue = this.model.get(this.nameDate);

                if (
                    this.mode === this.MODE_LIST ||
                    this.mode === this.MODE_DETAIL ||
                    this.mode === this.MODE_LIST_LINK
                ) {
                    if (this.useNumericFormat || (this.params && this.params.useNumericFormat)) {
                        return this.getDateTime().toDisplayDate(dateValue);
                    }

                    return format.jalaliDetailDate(this, dateValue);
                }

                return this.getDateTime().toDisplayDate(dateValue);
            }

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
