const assert = require('assert');
const jalali = require('../files/client/custom/modules/jalali-calendar/src/jalaali.js');

const pairs = [
    {g: [2021, 3, 21], j: [1400, 1, 1]},
    {g: [2024, 3, 20], j: [1403, 1, 1]},
    {g: [2025, 3, 21], j: [1404, 1, 1]},
    {g: [2026, 3, 21], j: [1405, 1, 1]},
    {g: [2026, 10, 21], j: [1405, 7, 29]},
    {g: [2021, 3, 20], j: [1399, 12, 30]},
];

function same(a, b) {
    assert.deepStrictEqual(a, b);
}

pairs.forEach((pair) => {
    const converted = jalali.toJalali(pair.g[0], pair.g[1], pair.g[2]);
    same([converted.jy, converted.jm, converted.jd], pair.j);

    const back = jalali.toGregorian(pair.j[0], pair.j[1], pair.j[2]);
    same([back.gy, back.gm, back.gd], pair.g);

    const weekday = jalali.utcWeekday(pair.g[0], pair.g[1], pair.g[2]);
    const throughJalali = jalali.utcWeekday(back.gy, back.gm, back.gd);
    assert.strictEqual(weekday, throughJalali);
});

assert.strictEqual(jalali.utcWeekday(2026, 10, 21), 3);
assert.strictEqual(jalali.isLeapJalaliYear(1403), true);
assert.strictEqual(jalali.isLeapJalaliYear(1404), false);
assert.strictEqual(jalali.daysInJalaliMonth(1403, 12), 30);
assert.strictEqual(jalali.daysInJalaliMonth(1404, 12), 29);
assert.strictEqual(jalali.isValidJalaliDate(1403, 12, 30), true);
assert.strictEqual(jalali.isValidJalaliDate(1404, 12, 30), false);

for (let gy = 1900; gy <= 2100; gy++) {
    for (let gm = 1; gm <= 12; gm++) {
        const converted = jalali.toJalali(gy, gm, 1);
        const back = jalali.toGregorian(converted.jy, converted.jm, converted.jd);
        same([back.gy, back.gm, back.gd], [gy, gm, 1]);
    }
}

console.log('jalaali ok');
