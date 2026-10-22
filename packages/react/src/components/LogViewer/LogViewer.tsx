import {
    detectLogLevel,
    filterLogLines,
    isAtBottom,
    logViewer as logViewerRecipe,
    logWindow,
    toLogLines,
    type DataSource,
    type LogLevel,
    type LogLine,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ArrowDown, Bug, CircleX, Info, Search, TriangleAlert } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button } from '../Button/Button.js';
import { Highlight } from '../Highlight/Highlight.js';
import { Input } from '../Input/Input.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { ToggleButton } from '../ToggleButton/ToggleButton.js';
import { useDataSource } from '../../utils/data-source.js';

export interface LogViewerProps {
    /** The lines, oldest first – strings or { text, level, time, id } (with `dataSource`: the newest, after the loaded) */
    lines?: (LogLine | string)[];
    /**
     * Older lines from a server, page by page going back in time – each page newest first (page or cursor). The first
     * page is loaded at the start, "Load older entries" loads the next; `lines` (e.g. live lines) follow them
     */
    dataSource?: DataSource<LogLine | string>;
    /** Lines per page of the data source (default 200) */
    pageSize?: number;
    /** Accessible name of the scroll area (default "Log") */
    label?: string;
    /** Search field: filters the lines and marks the hits (default true) */
    search?: boolean;
    /** Buttons to show and hide the levels (default true) */
    levelFilter?: boolean;
    /** Levels shown (controlled, default all) */
    levels?: LogLevel[];
    onLevelsChange?: (levels: LogLevel[]) => void;
    /** Reads the level from the text when a line has none ("ERROR", "[warn]" …, default true) */
    detectLevels?: boolean;
    /** Keeps the newest line in view; scrolling up pauses it (default true) */
    autoScroll?: boolean;
    onAutoScrollChange?: (autoScroll: boolean) => void;
    /** Line numbers (default true) */
    lineNumbers?: boolean;
    /** Older lines can be loaded: a button at the top calls onLoadMore */
    hasMore?: boolean;
    /** Load older lines (they are added at the top, the view stays where it is) */
    onLoadMore?: () => void;
    /** Older lines are loading */
    loading?: boolean;
    /** Height of a line in px – must match the styles (default 20) */
    rowHeight?: number;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof logViewerRecipe>;
}

const icons = { debug: Bug, info: Info, warn: TriangleAlert, error: CircleX };
const NO_LINES: (LogLine | string)[] = [];
const order: LogLevel[] = ['error', 'warn', 'info', 'debug'];

/**
 * Log: a scrollable, focusable area (arrow keys scroll) with numbered lines; level as icon and text; search filters
 * and marks; new lines stay in view until you scroll up. Only the visible lines are rendered.
 */
export function LogViewer({
    classes,
    lines = NO_LINES,
    dataSource,
    pageSize = 200,
    label,
    search = true,
    levelFilter = true,
    levels,
    onLevelsChange,
    detectLevels = true,
    autoScroll = true,
    onAutoScrollChange,
    lineNumbers = true,
    hasMore: hasMoreProp,
    onLoadMore,
    loading: loadingProp,
    rowHeight = 20,
    className,
    style,
}: LogViewerProps) {
    const logViewer = useRecipe('logViewer', logViewerRecipe, classes);
    const styles = logViewer();
    const { locale, translations } = useLocale();
    const t = translations.logViewer;
    const viewport = useRef<HTMLDivElement>(null);
    const lastTop = useRef(0);
    // Older lines from a data source (newest first, shown oldest first) before the given lines
    const source = useDataSource<LogLine | string>({ source: dataSource, pageSize });
    const openSource = useRef(source.open);
    useEffect(() => {
        openSource.current = source.open;
    });
    useEffect(() => {
        if (dataSource) openSource.current();
    }, [dataSource]);
    const older = source.active ? source.state.items : NO_LINES;
    const hasMore = source.active ? source.state.hasMore : hasMoreProp;
    const loading = !!loadingProp || (source.active && source.state.status === 'loading');
    const all = useMemo(
        () =>
            toLogLines(older.length ? [...older].reverse().concat(lines) : lines).map((line) =>
                line.level || !detectLevels ? line : { ...line, level: detectLogLevel(line.text) }
            ),
        [older, lines, detectLevels]
    );
    const present = order.filter((level) => all.some((line) => line.level === level));
    const [internalLevels, setInternalLevels] = useState<LogLevel[]>(order);
    const shownLevels = levels ?? internalLevels;
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => filterLogLines(all, { query, levels: shownLevels }), [all, query, shownLevels]);
    const [scrollTop, setScrollTop] = useState(0);
    const [height, setHeight] = useState(0);
    const view = logWindow(scrollTop, height, rowHeight, filtered.length);
    const [following, setFollowingState] = useState(autoScroll);
    const [shownAuto, setShownAuto] = useState(autoScroll);
    if (shownAuto !== autoScroll) {
        setShownAuto(autoScroll);
        setFollowingState(autoScroll);
    }
    const [atBottom, setAtBottom] = useState(true);
    const timeFormat = useMemo(() => new Intl.DateTimeFormat(locale, { timeStyle: 'medium' }), [locale]);
    const timeText = (time: LogLine['time']) => {
        if (time === undefined) return '';
        const date = time instanceof Date ? time : new Date(time);
        return Number.isNaN(date.getTime()) ? String(time) : timeFormat.format(date);
    };

    // New lines: follow them; lines added at the top (older ones): keep the view where it is
    const [previous, setPrevious] = useState({ all, older: older.length });
    const [plan, setPlan] = useState<{ scroll: 'end' | number } | null>(null);
    if (previous.all !== all) {
        const first = previous.all[0];
        // Pages of the data source come in at the top; otherwise the old first line tells the shift
        const shift = older.length > previous.older ? older.length - previous.older : first ? all.indexOf(first) : -1;
        setPrevious({ all, older: older.length });
        if (shift > 0) setPlan({ scroll: shift * rowHeight });
        else if (following) setPlan({ scroll: 'end' });
    }
    useLayoutEffect(() => {
        const element = viewport.current;
        if (!element || !plan) return;
        if (plan.scroll === 'end') element.scrollTop = element.scrollHeight;
        else element.scrollTop += plan.scroll;
    }, [plan]);
    useEffect(() => {
        const element = viewport.current;
        if (!element) return;
        const observer = new ResizeObserver(() => setHeight(element.clientHeight));
        observer.observe(element);
        if (following) element.scrollTop = element.scrollHeight;
        return () => observer.disconnect();
        // Measured once on mount; the observer follows later changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleLevel = (level: LogLevel, on: boolean) => {
        const next = on ? [...shownLevels, level] : shownLevels.filter((entry) => entry !== level);
        setInternalLevels(next);
        onLevelsChange?.(next);
    };
    const setFollowing = (value: boolean) => {
        setFollowingState(value);
        onAutoScrollChange?.(value);
        if (value && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
    };
    const onScroll = () => {
        const element = viewport.current;
        if (!element) return;
        setScrollTop(element.scrollTop);
        const bottom = isAtBottom(element);
        setAtBottom(bottom);
        // Scrolling up pauses following; back at the end it follows again
        if (element.scrollTop < lastTop.current && !bottom && following) setFollowing(false);
        lastTop.current = element.scrollTop;
    };
    const rows = filtered.slice(view.start, view.end).map((index, offset) => ({
        index,
        position: view.start + offset,
        line: all[index]!,
    }));
    const words = query.trim().split(/\s+/);

    return (
        <div className={styles.base({ class: className })} style={style}>
            <div className={styles.toolbar()}>
                {search && (
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                        type="search"
                        size="sm"
                        leadingIcon={Search}
                        clearable
                        placeholder={t.search}
                        aria-label={t.search}
                        className={styles.search()}
                    />
                )}
                {levelFilter && present.length > 0 && (
                    <div role="group" aria-label={t.levelFilter} className={styles.levels()}>
                        {present.map((level) => (
                            <ToggleButton
                                key={level}
                                size="sm"
                                icon={icons[level]}
                                pressed={shownLevels.includes(level)}
                                onPressedChange={(on) => toggleLevel(level, on)}
                            >
                                {t.levels[level]}
                            </ToggleButton>
                        ))}
                    </div>
                )}
                <ToggleButton size="sm" icon={ArrowDown} pressed={following} onPressedChange={setFollowing}>
                    {t.autoScroll}
                </ToggleButton>
            </div>
            <div className={styles.body()}>
                <div
                    ref={viewport}
                    className={styles.viewport()}
                    tabIndex={0}
                    role="region"
                    aria-label={label ?? t.label}
                    onScroll={onScroll}
                >
                    {hasMore && (
                        <div className={styles.more()}>
                            <Button
                                variant="outline"
                                size="sm"
                                loading={loading}
                                onClick={() => (source.active ? source.loadMore() : onLoadMore?.())}
                            >
                                {t.loadMore}
                            </Button>
                        </div>
                    )}
                    {filtered.length ? (
                        <ol
                            className={styles.list()}
                            style={{ paddingTop: `${view.before}px`, paddingBottom: `${view.after}px` }}
                        >
                            {rows.map((row) => {
                                const Icon = row.line.level ? icons[row.line.level] : undefined;
                                return (
                                    <li
                                        key={row.line.id === undefined ? `#${row.index}` : `id:${row.line.id}`}
                                        className={logViewer({ level: row.line.level ?? 'none' }).line()}
                                        aria-setsize={filtered.length}
                                        aria-posinset={row.position + 1}
                                    >
                                        {lineNumbers && (
                                            <span className={styles.number()} aria-hidden="true">
                                                {row.index + 1}
                                            </span>
                                        )}
                                        {row.line.level && Icon && (
                                            <span className={logViewer({ level: row.line.level }).level()}>
                                                <Icon className={styles.levelIcon()} aria-hidden="true" />
                                                {t.levels[row.line.level]}
                                            </span>
                                        )}
                                        {row.line.time !== undefined && (
                                            <span className={styles.time()}>{timeText(row.line.time)}</span>
                                        )}
                                        <span className={styles.text()}>
                                            {query.trim() ? (
                                                <Highlight text={row.line.text} query={words} ignoreAccents />
                                            ) : (
                                                row.line.text
                                            )}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    ) : (
                        <p className={styles.empty()}>{t.empty}</p>
                    )}
                </div>
                {!atBottom && filtered.length > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        leadingIcon={ArrowDown}
                        className={styles.jump()}
                        onClick={() => setFollowing(true)}
                    >
                        {t.jumpToEnd}
                    </Button>
                )}
            </div>
            <div className={styles.footer()}>
                <span>{t.lines(filtered.length, all.length)}</span>
                {!following && <span>{t.paused}</span>}
            </div>
            <span role="status" className={styles.status()}>
                {query.trim() ? t.lines(filtered.length, all.length) : ''}
            </span>
        </div>
    );
}
