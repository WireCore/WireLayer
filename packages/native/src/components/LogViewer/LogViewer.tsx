import {
    detectLogLevel,
    filterLogLines,
    logViewer,
    toLogLines,
    type DataSource,
    type ListItemAccessors,
    type LogLevel,
    type LogLine,
} from '@wirecore/wirelayer-recipes/native';
import { ArrowDown, Bug, CircleX, Info, Search, TriangleAlert } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    Platform,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type ViewProps,
} from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useOptionSource } from '../../utils/data-source.js';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { ChipGroup } from '../ChipGroup/ChipGroup.js';
import { Highlight } from '../Highlight/Highlight.js';
import { Input } from '../Input/Input.js';
import { Switch } from '../Switch/Switch.js';

export interface LogViewerProps extends Omit<ViewProps, 'children'> {
    /** The lines, oldest first – strings or { text, level, time, id } (with `dataSource`: the newest, after the loaded) */
    lines?: (LogLine | string)[];
    /**
     * Older lines from a server, page by page going back in time – each page newest first (page or cursor). The first
     * page is loaded at the start, "Load older entries" loads the next; `lines` (e.g. live lines) follow them
     */
    dataSource?: DataSource<LogLine | string>;
    /** Lines per page of the data source (default 200) */
    pageSize?: number;
    /** Accessible name of the list (default "Log") */
    label?: string;
    /** Search field: filters the lines and marks the hits (default true) */
    search?: boolean;
    /** Chips to show and hide the levels (default true) */
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
    className?: string;
}

const icons = { debug: Bug, info: Info, warn: TriangleAlert, error: CircleX };
const NO_LINES: (LogLine | string)[] = [];
const ORDER: LogLevel[] = ['error', 'warn', 'info', 'debug'];
const ACCESSORS: ListItemAccessors<LogLine | string> = {};

/**
 * Log: a list of numbered lines that wrap; level as icon and text; search filters and marks; level chips; new lines
 * stay in view until you scroll up (announced as paused), "Jump to end" and the switch follow them again. Older lines
 * load at the top.
 */
export function LogViewer({
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
    hasMore: hasMoreProp = false,
    onLoadMore,
    loading: loadingProp = false,
    className,
    ...props
}: LogViewerProps) {
    const { locale, translations } = useLocale();
    const t = translations.logViewer;
    const styles = logViewer();
    const list = useRef<FlatList<number>>(null);
    const lastScroll = useRef({ offset: 0, height: 0 });
    const { announce, region } = useAnnouncer();
    // Older lines from a data source (newest first, shown oldest first) before the given lines
    const source = useOptionSource<LogLine | string>({
        items: NO_LINES,
        source: dataSource,
        accessors: ACCESSORS,
        pageSize,
    });
    const { open: openSource } = source;
    useEffect(() => {
        if (dataSource) openSource();
    }, [dataSource, openSource]);
    const older = source.active ? source.items : NO_LINES;
    const hasMore = source.active ? source.hasMore : hasMoreProp;
    const loading = loadingProp || source.loading;
    const all = useMemo(
        () =>
            toLogLines(older.length ? [...older].reverse().concat(lines) : lines).map((line) =>
                line.level || !detectLevels ? line : { ...line, level: detectLogLevel(line.text) }
            ),
        [older, lines, detectLevels]
    );
    const present = ORDER.filter((level) => all.some((line) => line.level === level));
    const [shownLevels, setLevels] = useControllable(levels, ORDER, onLevelsChange);
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => filterLogLines(all, { query, levels: shownLevels }), [all, query, shownLevels]);
    const words = query.trim().split(/\s+/).filter(Boolean);
    const timeFormat = useMemo(() => new Intl.DateTimeFormat(locale, { timeStyle: 'medium' }), [locale]);
    const timeText = (time: LogLine['time']) => {
        if (time === undefined) return '';
        const date = time instanceof Date ? time : new Date(time);
        return Number.isNaN(date.getTime()) ? String(time) : timeFormat.format(date);
    };

    // Following the newest line: controlled by autoScroll, paused by scrolling up
    const [following, setFollowingState] = useState(autoScroll);
    const [shownAuto, setShownAuto] = useState(autoScroll);
    if (shownAuto !== autoScroll) {
        setShownAuto(autoScroll);
        setFollowingState(autoScroll);
    }
    const [atBottom, setAtBottom] = useState(true);
    const setFollowing = (value: boolean) => {
        setFollowingState(value);
        onAutoScrollChange?.(value);
        if (value) list.current?.scrollToEnd({ animated: false });
        else announce(t.paused);
    };

    // The number of lines once typing pauses
    const searching = !!query.trim();
    const linesText = t.lines(filtered.length, all.length);
    useEffect(() => {
        if (!searching) return;
        const timer = setTimeout(() => announce(linesText), 600);
        return () => clearTimeout(timer);
    }, [searching, query, linesText, announce]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const bottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;
        if (bottom !== atBottom) setAtBottom(bottom);
        // Scrolling up pauses following – not a shift while the content grows (new lines, rendered rows)
        const last = lastScroll.current;
        const up = contentOffset.y < last.offset - 4 && contentSize.height === last.height;
        if (up && !bottom && following) setFollowing(false);
        lastScroll.current = { offset: contentOffset.y, height: contentSize.height };
    };

    return (
        <View {...props} className={styles.base({ class: className })}>
            <View className={styles.toolbar()}>
                {search && (
                    <Input
                        role="searchbox"
                        value={query}
                        onChangeText={setQuery}
                        leadingIcon={Search}
                        clearable
                        aria-label={t.search}
                        placeholder={t.search}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                )}
                <View className={styles.toolbarRow()}>
                    {levelFilter && present.length > 0 && (
                        <ChipGroup
                            label={t.levelFilter}
                            items={present.map((level) => ({
                                value: level,
                                label: t.levels[level] ?? level,
                                icon: icons[level],
                            }))}
                            value={shownLevels}
                            onValueChange={(next) => setLevels(next as LogLevel[])}
                        />
                    )}
                    <Switch checked={following} onCheckedChange={setFollowing}>
                        {t.autoScroll}
                    </Switch>
                </View>
            </View>
            {hasMore && (
                <View className={styles.more()}>
                    <Button
                        variant="outline"
                        size="sm"
                        loading={loading}
                        onPress={() => (source.active ? source.loadMore() : onLoadMore?.())}
                    >
                        {t.loadMore}
                    </Button>
                </View>
            )}
            <View className={styles.body()}>
                <FlatList
                    ref={list}
                    data={filtered}
                    keyExtractor={(index) => {
                        const id = all[index]?.id;
                        return id === undefined ? `#${index}` : `id:${id}`;
                    }}
                    // A list only with lines (an empty list is no list for screen readers)
                    {...(filtered.length ? { role: 'list' as const, 'aria-label': label ?? t.label } : {})}
                    aria-busy={loading || undefined}
                    // Web: the scrolling list must be reachable with the keyboard (axe)
                    {...(Platform.OS === 'web' ? { tabIndex: 0 as const } : {})}
                    className={styles.list()}
                    contentContainerClassName={styles.content()}
                    // iOS/Android: older lines at the top keep the view where it is
                    maintainVisibleContentPosition={following ? undefined : { minIndexForVisible: 0 }}
                    onContentSizeChange={() => {
                        if (following) list.current?.scrollToEnd({ animated: false });
                    }}
                    onScroll={onScroll}
                    scrollEventThrottle={100}
                    initialNumToRender={30}
                    ListEmptyComponent={<Text className={styles.empty()}>{t.empty}</Text>}
                    renderItem={({ item: index }) => {
                        const line = all[index]!;
                        const look = logViewer({ level: line.level ?? 'none' });
                        return (
                            <View role="listitem" className={look.line()}>
                                {lineNumbers && (
                                    <Text aria-hidden className={styles.number()}>
                                        {index + 1}
                                    </Text>
                                )}
                                {!!line.level && (
                                    <View className={look.level()}>
                                        <Icon icon={icons[line.level]} className={look.levelIcon()} />
                                        <Text className={look.levelText()}>{t.levels[line.level]}</Text>
                                    </View>
                                )}
                                <View className={styles.main()}>
                                    {line.time !== undefined && (
                                        <Text className={styles.time()}>{timeText(line.time)}</Text>
                                    )}
                                    <Text selectable className={look.text()}>
                                        {words.length ? (
                                            <Highlight text={line.text} query={words} ignoreAccents />
                                        ) : (
                                            line.text
                                        )}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />
                {!atBottom && filtered.length > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        leadingIcon={ArrowDown}
                        className={styles.jump()}
                        onPress={() => setFollowing(true)}
                    >
                        {t.jumpToEnd}
                    </Button>
                )}
            </View>
            <View className={styles.footer()}>
                <Text className={styles.footerText()}>{linesText}</Text>
                {!following && <Text className={styles.footerText()}>{t.paused}</Text>}
            </View>
            {region}
        </View>
    );
}
