define('jalali-calendar:views/calendar/calendar', [
    'crm:views/calendar/calendar',
    'jalali-calendar:jalaali',
    'jalali-calendar:format',
], function (Dep, jalaali, format) {
    return class extends Dep {
        setup() {
            super.setup();

            this._requestedDate = this.options.date || this.getDateTime().getToday();
            this._jalaliCursor = null;

            this.on('remove', () => {
                if (this._jalaliTimer) {
                    clearInterval(this._jalaliTimer);
                }
            });
        }

        afterRender() {
            super.afterRender();

            var attempts = 0;

            this._jalaliTimer = setInterval(() => {
                attempts += 1;

                if (this.isRemoved && this.isRemoved()) {
                    clearInterval(this._jalaliTimer);
                    return;
                }

                if (!this.calendar) {
                    if (attempts > 100) {
                        clearInterval(this._jalaliTimer);
                    }

                    return;
                }

                clearInterval(this._jalaliTimer);
                this.installJalaliCalendar();
            }, 40);
        }

        installJalaliCalendar() {
            var views = typeof this.calendar.getOption === 'function'
                ? (this.calendar.getOption('views') || {})
                : {};

            this.modeViewMap.month = 'jalaliMonth';
            this.calendar.setOption('firstDay', 6);
            this.calendar.setOption('weekNumbers', false);
            this.calendar.setOption('views', Object.assign({}, views, {
                jalaliMonth: {
                    type: 'dayGrid',
                    duration: {weeks: 6},
                    dateAlignment: 'week',
                },
            }));
            this.calendar.setOption('dayCellContent', (arg) => this.jalaliDayCell(arg));
            this.calendar.setOption('dayCellClassNames', (arg) => this.jalaliDayClass(arg));
            this.calendar.setOption('dayHeaderContent', (arg) => this.jalaliDayHeader(arg));

            if (!this._jalaliCursor) {
                this.setCursorFromGregorian(this._requestedDate);
            }

            if (this.viewMode === 'month') {
                this.showJalaliMonth();
            } else {
                this.updateDate();
            }
        }

        setCursorFromGregorian(iso) {
            var match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
            var date;

            if (match) {
                date = {gy: +match[1], gm: +match[2], gd: +match[3]};
            } else {
                var parts = this.getDateTime().getToday().split('-');

                date = {gy: +parts[0], gm: +parts[1], gd: +parts[2]};
            }

            var converted = jalaali.toJalali(date.gy, date.gm, date.gd);

            this._jalaliCursor = {jy: converted.jy, jm: converted.jm};
        }

        moveJalaliMonth(delta) {
            if (!this._jalaliCursor) {
                this.setCursorFromGregorian(this._requestedDate);
            }

            this._jalaliCursor.jm += delta;

            while (this._jalaliCursor.jm > 12) {
                this._jalaliCursor.jm -= 12;
                this._jalaliCursor.jy += 1;
            }

            while (this._jalaliCursor.jm < 1) {
                this._jalaliCursor.jm += 12;
                this._jalaliCursor.jy -= 1;
            }
        }

        showJalaliMonth() {
            if (!this.calendar || !this._jalaliCursor) {
                return;
            }

            var gregorian = jalaali.toGregorian(this._jalaliCursor.jy, this._jalaliCursor.jm, 1);
            var iso = gregorian.gy + '-' + format.pad(gregorian.gm) + '-' + format.pad(gregorian.gd);

            if (this.calendar.view.type !== 'jalaliMonth') {
                this.calendar.changeView('jalaliMonth', iso);
            } else {
                this.calendar.gotoDate(iso);
            }

            this.updateDate();
        }

        jalaliParts(arg) {
            var stamp = this.dateToMoment(arg.date);

            return {
                stamp: stamp,
                jalali: jalaali.toJalali(stamp.year(), stamp.month() + 1, stamp.date()),
            };
        }

        jalaliDayCell(arg) {
            return {html: String(this.jalaliParts(arg).jalali.jd)};
        }

        jalaliDayClass(arg) {
            if (!this._jalaliCursor || this.calendar.view.type !== 'jalaliMonth') {
                return [];
            }

            var parts = this.jalaliParts(arg);

            if (parts.jalali.jy !== this._jalaliCursor.jy || parts.jalali.jm !== this._jalaliCursor.jm) {
                return ['jalali-outside'];
            }

            return [];
        }

        jalaliDayHeader(arg) {
            var parts = this.jalaliParts(arg);
            var shortName = format.WEEKDAY_SHORT[parts.stamp.day()];

            if (this.viewMode === 'month' || this.calendar.view.type === 'jalaliMonth') {
                return {text: shortName};
            }

            return {text: shortName + ' ' + parts.jalali.jd};
        }

        selectMode(mode) {
            var previous = this.viewMode;

            super.selectMode(mode);

            if (this.viewMode === 'month' && this.calendar) {
                if (previous !== 'month') {
                    this.setCursorFromGregorian(this.date || this._requestedDate);
                }

                this.showJalaliMonth();
            }
        }

        actionPrevious() {
            if (!this.calendar) {
                return;
            }

            if (this.viewMode === 'month') {
                this.moveJalaliMonth(-1);
                this.showJalaliMonth();
                this.handleScrollToNow();
                return;
            }

            super.actionPrevious();
        }

        actionNext() {
            if (!this.calendar) {
                return;
            }

            if (this.viewMode === 'month') {
                this.moveJalaliMonth(1);
                this.showJalaliMonth();
                this.handleScrollToNow();
                return;
            }

            super.actionNext();
        }

        actionToday() {
            if (!this.calendar) {
                return;
            }

            if (this.viewMode === 'month') {
                if (this.isToday()) {
                    this.actionRefresh();
                    return;
                }

                this.setCursorFromGregorian(this.getDateTime().getToday());
                this.showJalaliMonth();
                this.handleScrollToNow();
                return;
            }

            super.actionToday();
        }

        isToday() {
            if (this.viewMode === 'month' && this._jalaliCursor) {
                var stamp = this.getDateTime().getNowMoment();
                var converted = jalaali.toJalali(stamp.year(), stamp.month() + 1, stamp.date());

                return converted.jy === this._jalaliCursor.jy && converted.jm === this._jalaliCursor.jm;
            }

            return super.isToday();
        }

        getTitle() {
            if (!this.calendar) {
                return '';
            }

            var view = this.calendar.view;
            var title;

            if (this.viewMode === 'month' || view.type === 'jalaliMonth') {
                if (!this._jalaliCursor) {
                    this.setCursorFromGregorian(this._requestedDate);
                }

                title = format.MONTHS[this._jalaliCursor.jm - 1] + ' ' + this._jalaliCursor.jy;
            } else if (
                view.type === 'timeGridWeek' ||
                view.type === 'dayGridWeek' ||
                view.type === 'listWeek'
            ) {
                var start = this.dateToMoment(view.currentStart);
                var end = this.dateToMoment(view.currentEnd).clone().subtract(1, 'minute');

                title = this.formatJalaliMoment(start) + this.rangeSeparator + this.formatJalaliMoment(end);
            } else if (view.type === 'timeGridDay' || view.type === 'dayGridDay') {
                var dayStart = this.dateToMoment(view.currentStart);
                var converted = jalaali.toJalali(dayStart.year(), dayStart.month() + 1, dayStart.date());

                title = format.WEEKDAY_FULL[dayStart.day()] + '، ' +
                    converted.jd + ' ' + format.MONTHS[converted.jm - 1] + ' ' + converted.jy;
            } else {
                return super.getTitle();
            }

            if (this.options.userId && this.options.userName) {
                title += ' (' + this.options.userName + ')';
            }

            return title;
        }

        formatJalaliMoment(stamp) {
            var converted = jalaali.toJalali(stamp.year(), stamp.month() + 1, stamp.date());

            return converted.jd + ' ' + format.MONTHS[converted.jm - 1] + ' ' + converted.jy;
        }
    };
});
