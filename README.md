# تقویم شمسی برای EspoCRM

Shamsi (Jalali) dates for EspoCRM 10. Stored values stay Gregorian (`2026-10-21`). Forms, the calendar, “this month / this year” filters, and email/PDF dates show Jalali (`1405/07/29`).

۲۱ اکتبر ۲۰۲۶ همان ۲۹ مهر ۱۴۰۵ و همان روز هفته است. عددها لاتین هستند تا ورود داده اشتباه نشود. نام ماه و روز در تقویم فارسی است و هفته از شنبه شروع می‌شود.

## نصب

فایل نصب، زیپ سورس گیت‌هاب نیست. از بخش Releases فایل `JalaliCalendar-1.0.0.zip` را دانلود کنید.

1. در EspoCRM بروید به Administration > Extensions.
2. فایل `JalaliCalendar-1.0.0.zip` را آپلود کنید و Install را بزنید.
3. اگر صفحه قدیمی ماند، Administration > Clear Cache را بزنید و با Ctrl+F5 تازه کنید.

بعد از نصب، منطقه زمانی `Asia/Tehran`، شروع هفته شنبه، و قالب تاریخ `YYYY/MM/DD` تنظیم می‌شود.

## خارج از این افزونه

افزونه‌های دیگری که خودشان تاریخ را قالب می‌زنند، و گزارش‌هایی که از فیلد استاندارد تاریخ EspoCRM استفاده نمی‌کنند، شمسی نمی‌شوند.

الگوریتم تبدیل از [jalaali-js](https://github.com/jalaali/jalaali-js) با مجوز MIT اقتباس شده است.
