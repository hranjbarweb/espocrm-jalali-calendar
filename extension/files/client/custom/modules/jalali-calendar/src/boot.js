(function () {
    var attempts = 0;
    var script = document.currentScript;
    var base = script ? (script.getAttribute('data-base-path') || '') : '';
    var css = 'client/custom/modules/jalali-calendar/css/jalali.css';

    if (!document.querySelector('link[href*="jalali-calendar/css/jalali.css"]')) {
        var link = document.createElement('link');

        link.rel = 'stylesheet';
        link.href = base + css;
        document.head.appendChild(link);
    }

    function start() {
        if (!window.Espo || !Espo.loader || typeof Espo.loader.require !== 'function') {
            retry();
            return;
        }

        try {
            Espo.loader.require('date-time', function (DateTime) {
                Espo.loader.require('jalali-calendar:patch', function (patch) {
                    if (patch && typeof patch.install === 'function') {
                        patch.install(DateTime);
                    }
                }, retry);
            }, retry);
        } catch (e) {
            retry();
        }
    }

    function retry() {
        attempts += 1;

        if (attempts < 50) {
            setTimeout(start, 100);
        }
    }

    start();
}());
