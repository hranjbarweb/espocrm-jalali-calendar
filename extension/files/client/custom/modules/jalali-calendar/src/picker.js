define('jalali-calendar:picker', ['jalali-calendar:jalaali', 'jalali-calendar:format'], function (jalaali, format) {
    var popup = null;
    var activeInput = null;

    function ensureDocumentListener() {
        if (document.documentElement.dataset.jalaliPickerBound) {
            return;
        }

        document.documentElement.dataset.jalaliPickerBound = '1';

        document.addEventListener('pointerdown', function (event) {
            if (!popup || popup.contains(event.target) || event.target === activeInput) {
                return;
            }

            closeJalaliPicker();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeJalaliPicker();
            }
        });
    }

    function closeJalaliPicker() {
        if (popup) {
            popup.remove();
            popup = null;
            activeInput = null;
        }
    }

    function shiftMonth(year, month, delta) {
        var nextMonth = month + delta;
        var nextYear = year;

        while (nextMonth > 12) {
            nextMonth -= 12;
            nextYear += 1;
        }

        while (nextMonth < 1) {
            nextMonth += 12;
            nextYear -= 1;
        }

        return {jy: nextYear, jm: nextMonth};
    }

    function addGregorianDays(gy, gm, gd, delta) {
        var date = new Date(Date.UTC(gy, gm - 1, gd));

        date.setUTCDate(date.getUTCDate() + delta);

        return {
            gy: date.getUTCFullYear(),
            gm: date.getUTCMonth() + 1,
            gd: date.getUTCDate(),
        };
    }

    function monthCells(jy, jm) {
        var first = jalaali.toGregorian(jy, jm, 1);
        var sinceSaturday = (jalaali.utcWeekday(first.gy, first.gm, first.gd) + 1) % 7;
        var cells = [];
        var index;

        for (index = 0; index < 42; index++) {
            var gregorian = addGregorianDays(first.gy, first.gm, first.gd, index - sinceSaturday);
            var converted = jalaali.toJalali(gregorian.gy, gregorian.gm, gregorian.gd);

            cells.push({
                jy: converted.jy,
                jm: converted.jm,
                jd: converted.jd,
                iso: gregorian.gy + '-' + format.pad(gregorian.gm) + '-' + format.pad(gregorian.gd),
                outside: converted.jy !== jy || converted.jm !== jm,
            });
        }

        return cells;
    }

    function placePopup(input) {
        var rect = input.getBoundingClientRect();
        var width = popup.offsetWidth;
        var height = popup.offsetHeight;
        var left = rect.left;
        var top = rect.bottom + 4;

        if (left + width > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - width - 8);
        }

        if (top + height > window.innerHeight - 8) {
            top = Math.max(8, rect.top - height - 4);
        }

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
    }

    function openJalaliPicker(input, options) {
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        options = options || {};
        ensureDocumentListener();
        closeJalaliPicker();
        activeInput = input;

        var today = format.jalaliFromGregorianIso(options.todayIso);
        var now = new Date();

        if (!today) {
            today = jalaali.toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        }

        var selectedIso = format.anchorIso(input.value);
        var selected = selectedIso ? format.jalaliFromGregorianIso(selectedIso) : null;
        var minIso = options.minText ? format.anchorIso(options.minText) : null;
        var cursor = selected
            ? {jy: selected.jy, jm: selected.jm}
            : {jy: today.jy, jm: today.jm};

        popup = document.createElement('div');
        popup.className = 'jalali-picker';
        popup.dir = 'rtl';
        document.body.appendChild(popup);

        var render = function () {
            if (cursor.jy < 1) {
                cursor.jy = 1;
            }

            if (cursor.jy > 3177) {
                cursor.jy = 3177;
            }

            var cells = monthCells(cursor.jy, cursor.jm);
            var weekdays = format.WEEKDAY_SATURDAY_FIRST.map(function (name) {
                return '<span>' + name + '</span>';
            }).join('');

            popup.innerHTML =
                '<div class="jalali-picker-head">' +
                    '<button type="button" data-shift="-12" aria-label="سال قبل">«</button>' +
                    '<button type="button" data-shift="-1" aria-label="ماه قبل">‹</button>' +
                    '<span class="jalali-picker-title">' + format.MONTHS[cursor.jm - 1] + ' ' + cursor.jy + '</span>' +
                    '<button type="button" data-shift="1" aria-label="ماه بعد">›</button>' +
                    '<button type="button" data-shift="12" aria-label="سال بعد">»</button>' +
                '</div>' +
                '<div class="jalali-picker-weekdays">' + weekdays + '</div>' +
                '<div class="jalali-picker-grid"></div>' +
                '<button type="button" class="jalali-picker-today" data-today="1">امروز</button>';

            var grid = popup.querySelector('.jalali-picker-grid');

            cells.forEach(function (cell) {
                var button = document.createElement('button');

                button.type = 'button';
                button.textContent = String(cell.jd);
                button.className = 'jalali-picker-day';

                if (cell.outside) {
                    button.classList.add('is-outside');
                }

                if (selected && selected.jy === cell.jy && selected.jm === cell.jm && selected.jd === cell.jd) {
                    button.classList.add('is-selected');
                }

                if (today.jy === cell.jy && today.jm === cell.jm && today.jd === cell.jd) {
                    button.classList.add('is-today');
                }

                if (minIso && cell.iso < minIso) {
                    button.disabled = true;
                    button.classList.add('is-disabled');
                }

                button.addEventListener('click', function () {
                    var $ = window.jQuery || window.$;
                    var text = format.formatJalali(cell.jy, cell.jm, cell.jd);

                    if ($) {
                        $(input).val(text).trigger('change');
                    } else {
                        input.value = text;
                        input.dispatchEvent(new Event('change', {bubbles: true}));
                    }

                    closeJalaliPicker();
                });

                grid.appendChild(button);
            });

            popup.querySelectorAll('[data-shift]').forEach(function (button) {
                button.addEventListener('click', function () {
                    cursor = shiftMonth(cursor.jy, cursor.jm, +button.getAttribute('data-shift'));
                    render();
                    placePopup(input);
                });
            });

            popup.querySelector('[data-today]').addEventListener('click', function () {
                cursor = {jy: today.jy, jm: today.jm};
                render();
                placePopup(input);
            });

            placePopup(input);
        };

        render();
    }

    function replaceDatePickers(view) {
        var root = view.element;
        var $ = window.jQuery || window.$;

        if (!root) {
            return;
        }

        if ($) {
            root.querySelectorAll('input, .input-group').forEach(function (element) {
                if (element.classList && element.classList.contains('time-part')) {
                    return;
                }

                var $element = $(element);

                if ($element.data('datepicker')) {
                    try {
                        $element.datepicker('destroy');
                    } catch (e) {}
                }
            });

            root.querySelectorAll('input').forEach(function (element) {
                if (!element.classList.contains('time-part')) {
                    $(element).off('click');
                }
            });
        }

        var optionsFor = function () {
            return {
                todayIso: view.getDateTime().getToday(),
                minText: typeof view.getStartDateForDatePicker === 'function'
                    ? view.getStartDateForDatePicker()
                    : undefined,
            };
        };

        var openFor = function (input) {
            if (input instanceof HTMLInputElement && !input.classList.contains('time-part')) {
                openJalaliPicker(input, optionsFor());
            }
        };

        root.querySelectorAll('input.date-part, input[data-name], input.filter-from, input.filter-to').forEach(function (input) {
            if (input.classList.contains('time-part')) {
                return;
            }

            input.onclick = function (event) {
                event.stopPropagation();
                openFor(input);
            };
        });

        root.querySelectorAll('button.date-picker-btn').forEach(function (button) {
            var clone = button.cloneNode(true);

            button.parentNode.replaceChild(clone, button);
            clone.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();

                var group = clone.closest('.input-group');
                var input = group
                    ? group.querySelector('input:not(.time-part)')
                    : root.querySelector('input[data-name]');

                openFor(input);
            });
        });

        view.datepicker = {
            show: function () {
                openFor(view.mainInputElement || root.querySelector('input[data-name]'));
            },
            hide: function () {
                closeJalaliPicker();
            },
            setStartDate: function () {},
        };
    }

    return {
        openJalaliPicker: openJalaliPicker,
        closeJalaliPicker: closeJalaliPicker,
        replaceDatePickers: replaceDatePickers,
    };
});
