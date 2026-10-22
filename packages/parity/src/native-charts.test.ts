import {
    arcPath,
    areaPath,
    barRects,
    categoryPositions,
    chartToneAt,
    linePath,
    linePoints,
    linearScale,
    niceTicks,
    pieArcs,
    seriesSummary,
    stackSeries,
    valueExtent,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Geometry of the React Native charts (@wirecore/wirelayer-native/chart, react-native-svg) – framework-neutral in @wirecore/wirelayer-recipes

const rows = [
    { month: 'Jan', web: 10, hosting: 5 },
    { month: 'Feb', web: -4, hosting: 6 },
    { month: 'Mar', hosting: 2 },
];
const series = [{ key: 'web' }, { key: 'hosting' }];

describe('value axis', () => {
    it('"nice" ticks cover the values in steps of 1, 2, 2.5 or 5 × 10ⁿ', () => {
        expect(niceTicks(0, 87)).toEqual([0, 20, 40, 60, 80, 100]);
        expect(niceTicks(-30, 45)).toEqual([-40, -20, 0, 20, 40, 60]);
        expect(niceTicks(120, 230)).toEqual([100, 125, 150, 175, 200, 225, 250]);
        expect(niceTicks(0, 1, 4)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });

    it('an empty or flat range still gets an axis that includes 0', () => {
        expect(niceTicks(0, 0)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
        expect(niceTicks(40, 40)).toEqual([0, 10, 20, 30, 40]);
        expect(niceTicks(Number.NaN, 3)).toEqual([0, 1]);
    });

    it('scales map values linearly onto pixels', () => {
        expect(linearScale([0, 100], [200, 0])(25)).toBe(150);
        expect(linearScale([5, 5], [0, 10])(5)).toBe(0);
    });
});

describe('stacked values', () => {
    it('without stacking every value starts at 0; missing values are null', () => {
        expect(stackSeries(rows, series)).toEqual([
            [
                { value: 10, start: 0, end: 10 },
                { value: -4, start: 0, end: -4 },
                { value: null, start: 0, end: 0 },
            ],
            [
                { value: 5, start: 0, end: 5 },
                { value: 6, start: 0, end: 6 },
                { value: 2, start: 0, end: 2 },
            ],
        ]);
    });

    it('stacked: positive values pile up, negative ones down from 0', () => {
        const [, hosting] = stackSeries(rows, series, true);
        expect(hosting).toEqual([
            { value: 5, start: 10, end: 15 },
            { value: 6, start: 0, end: 6 },
            { value: 2, start: 0, end: 2 },
        ]);
    });

    it('series stack by their stack name', () => {
        const values = stackSeries(
            [{ a: 1, b: 2, c: 3 }],
            [{ key: 'a', stack: 'x' }, { key: 'b' }, { key: 'c', stack: 'x' }]
        );
        expect(values.map((list) => list[0])).toEqual([
            { value: 1, start: 0, end: 1 },
            { value: 2, start: 0, end: 2 },
            { value: 3, start: 1, end: 4 },
        ]);
    });

    it('the extent covers the stacked ends, references and (for bars) 0', () => {
        const values = stackSeries(rows, series, true);
        expect(valueExtent(values)).toEqual([-4, 15]);
        expect(valueExtent(values, [{ value: 30 }, { from: -8, to: 2 }, { value: 99, axis: 'x' }])).toEqual([-8, 30]);
        const line = stackSeries([{ v: 120 }, { v: 230 }], [{ key: 'v' }]);
        expect(valueExtent(line, [], false)).toEqual([120, 230]);
        expect(valueExtent([], [], false)).toEqual([0, 1]);
    });
});

describe('categories and bars', () => {
    it('bars sit in the centres of equal bands, lines run edge to edge', () => {
        expect(categoryPositions(4, 200)).toEqual({ step: 50, centres: [25, 75, 125, 175] });
        expect(categoryPositions(5, 200, false)).toEqual({ step: 50, centres: [0, 50, 100, 150, 200] });
        expect(categoryPositions(1, 200, false).centres).toEqual([100]);
    });

    it('grouped bars: one slot per series with a small gap, none for missing values', () => {
        const data = [
            { web: 10, hosting: 5 },
            { web: 20, hosting: null },
        ];
        const values = stackSeries(data, series);
        expect(barRects(values, { series, width: 200, height: 100, domain: [0, 20], padding: 0.2 })).toEqual([
            { series: 0, row: 0, x: 11, y: 50, width: 38, height: 50 },
            { series: 0, row: 1, x: 111, y: 0, width: 38, height: 100 },
            { series: 1, row: 0, x: 51, y: 75, width: 38, height: 25 },
        ]);
    });

    it('stacked bars share the slot; horizontal bars grow from the start edge', () => {
        const data = [
            { web: 10, hosting: 5 },
            { web: 20, hosting: null },
        ];
        const stacked = stackSeries(data, series, true);
        expect(
            barRects(stacked, { series, stacked: true, width: 200, height: 100, domain: [0, 20], padding: 0.2 })
        ).toEqual([
            { series: 0, row: 0, x: 10, y: 50, width: 80, height: 50 },
            { series: 0, row: 1, x: 110, y: 0, width: 80, height: 100 },
            { series: 1, row: 0, x: 10, y: 25, width: 80, height: 25 },
        ]);
        const grouped = stackSeries(data, series);
        const horizontal = barRects(grouped, {
            series,
            horizontal: true,
            width: 200,
            height: 100,
            domain: [0, 20],
            padding: 0.2,
        });
        expect(horizontal[0]).toEqual({ series: 0, row: 0, x: 0, y: 6, width: 100, height: 18 });
    });

    it('negative bars hang below the zero line', () => {
        const values = stackSeries([{ v: -5 }], [{ key: 'v' }]);
        const [bar] = barRects(values, { series: [{ key: 'v' }], width: 100, height: 100, domain: [-10, 10] });
        expect(bar).toMatchObject({ y: 50, height: 25 });
    });
});

describe('lines and areas', () => {
    it('points run edge to edge; a missing value is a gap; the start edge is the base of an area', () => {
        const [web] = stackSeries(rows, series);
        const options = { width: 100, height: 50, domain: [-10, 10] as [number, number] };
        expect(linePoints(web!, options)).toEqual([{ x: 0, y: 0 }, { x: 50, y: 35 }, null]);
        expect(linePoints(web!, { ...options, edge: 'start' })).toEqual([{ x: 0, y: 25 }, { x: 50, y: 25 }, null]);
    });

    it('straight lines break at gaps', () => {
        expect(linePath([{ x: 0, y: 10 }, { x: 10, y: 0 }, null, { x: 30, y: 5 }])).toBe('M0,10L10,0M30,5');
        expect(linePath([null, null])).toBe('');
    });

    it('curved lines are monotone: no bulge past a flat stretch', () => {
        const straight = [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 20, y: 20 },
        ];
        expect(linePath(straight, true)).toBe('M0,0C3.33,3.33 6.67,6.67 10,10C13.33,13.33 16.67,16.67 20,20');
        const plateau = [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 20, y: 10 },
        ];
        expect(linePath(plateau, true)).toBe('M0,0C3.33,3.33 6.67,10 10,10C13.33,10 16.67,10 20,10');
    });

    it('an area runs along the top line and back along the base', () => {
        const top = [
            { x: 0, y: 0 },
            { x: 10, y: 5 },
        ];
        const base = [
            { x: 0, y: 10 },
            { x: 10, y: 10 },
        ];
        expect(areaPath(top, base)).toBe('M0,0L10,5L10,10L0,10Z');
        expect(areaPath([{ x: 0, y: 0 }, null, { x: 20, y: 0 }], [...base, { x: 20, y: 10 }])).toBe(
            'M0,0L0,10ZM20,0L20,10Z'
        );
    });
});

describe('pie slices', () => {
    it('angles clockwise from 12 o’clock by share; negative values count as 0', () => {
        const arcs = pieArcs([1, 1, 2]);
        expect(arcs.map((arc) => arc.share)).toEqual([0.25, 0.25, 0.5]);
        expect(arcs[1]!.start).toBeCloseTo(Math.PI / 2);
        expect(arcs[2]!.end).toBeCloseTo(Math.PI * 2);
        expect(pieArcs([3, -1]).map((arc) => arc.share)).toEqual([1, 0]);
        expect(pieArcs([0, 0]).map((arc) => arc.share)).toEqual([0, 0]);
    });

    it('a gap between slices only with more than one slice', () => {
        const [first, second] = pieArcs([1, 1], 0.1);
        expect(first!.start).toBeCloseTo(0.05);
        expect(first!.end).toBeCloseTo(Math.PI - 0.05);
        expect(second!.start).toBeCloseTo(Math.PI + 0.05);
        const [whole] = pieArcs([5, 0], 0.1);
        expect(whole!.end - whole!.start).toBeCloseTo(Math.PI * 2);
    });

    it('slices of a pie and a ring as SVG paths', () => {
        expect(arcPath(50, 50, 50, 0, 0, Math.PI / 2)).toBe('M50,50L50,0A50,50 0 0 1 100,50Z');
        expect(arcPath(50, 50, 50, 0, 0, Math.PI * 1.5)).toBe('M50,50L50,0A50,50 0 1 1 0,50Z');
        expect(arcPath(50, 50, 50, 30, 0, Math.PI / 2)).toBe('M50,0A50,50 0 0 1 100,50L80,50A30,30 0 0 0 50,20Z');
        expect(arcPath(50, 50, 50, 0, 1, 1)).toBe('');
    });

    it('a full turn is a closed circle, a full ring keeps its hole', () => {
        expect(arcPath(50, 50, 50, 0, 0, Math.PI * 2)).toBe('M50,0A50,50 0 1 1 50,100A50,50 0 1 1 50,0Z');
        expect(arcPath(50, 50, 50, 30, 0, Math.PI * 2)).toBe(
            'M50,0A50,50 0 1 1 50,100A50,50 0 1 1 50,0ZM50,20A30,30 0 1 0 50,80A30,30 0 1 0 50,20Z'
        );
    });
});

describe('text and colours', () => {
    it('the summary names the title, then the trend and the extremes of each series', () => {
        const data = [
            { month: 'Jan', web: 10 },
            { month: 'Feb', web: 30 },
            { month: 'Mar', web: 20 },
        ];
        expect(seriesSummary('Revenue per month', data, [{ key: 'web', label: 'Web' }], String)).toBe(
            'Revenue per month. Web: from 10 to 20, low 10, high 30'
        );
    });

    it('series without a tone take the colours in turn', () => {
        expect([0, 1, 5, 6].map(chartToneAt)).toEqual(['primary', 'info', 'muted', 'primary']);
    });
});
