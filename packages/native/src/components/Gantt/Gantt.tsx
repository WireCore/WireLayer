import {
    criticalPath,
    formatDayRange,
    formatList,
    gantt,
    ganttBarPercent,
    ganttExtent,
    ganttGroupIds,
    ganttRows,
    parseLocal,
    pluralText,
    stepProgress,
    taskDuration,
    type GanttRow,
    type GanttTask,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronRight, Minus, Plus } from 'lucide-react-native';
import { Platform, Pressable, Text, View, type ViewProps } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { contentName } from '../../utils/label.js';
import { useControllable } from '../../utils/useControllable.js';
import { IconButton } from '../IconButton/IconButton.js';

/** New progress of a task in percent */
export interface GanttProgress {
    task: GanttTask;
    progress: number;
}

export interface GanttProps extends ViewProps {
    tasks: GanttTask[];
    /** Ids of the expanded groups; controlled together with onExpandedChange (default: all expanded) */
    expanded?: string[];
    defaultExpanded?: string[];
    onExpandedChange?: (ids: string[]) => void;
    /** The progress of tasks can be changed: buttons beside the bar, accessibility actions (increment/decrement) */
    editable?: boolean;
    /** Step of a progress change in percent (default 10) */
    progressStep?: number;
    /** The tasks are loading (e.g. from a server): the list is busy, without tasks it says "Loading" */
    loading?: boolean;
    /** Names the tasks on the critical path (tasks without slack) and outlines their bars */
    showCriticalPath?: boolean;
    /** Title above the list */
    title?: string;
    /** Level of the title heading (default 2) */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Accessible name of the task list (default: the title, else "Project plan") */
    label?: string;
    locale?: string;
    /** A task was pressed */
    onTaskClick?: (task: GanttTask) => void;
    /** The progress of a task was changed (editable) – apply it to your data */
    onProgressChange?: (change: GanttProgress) => void;
    className?: string;
}

/**
 * Gantt chart for phones as a task list: name, period, duration and progress of each task, a bar in the span of the
 * whole project, groups that expand and collapse, milestones, dependencies and the critical path in words. Editable
 * progress changes with buttons, accessibility actions or the arrow keys (web) on the bar (a slider).
 */
export function Gantt({
    tasks,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    editable = false,
    progressStep = 10,
    loading = false,
    showCriticalPath = false,
    title,
    headingLevel = 2,
    label,
    locale: localeProp,
    onTaskClick,
    onProgressChange,
    className,
    ...props
}: GanttProps) {
    const localeContext = useLocale();
    const translations = localeContext.translations;
    const t = translations.gantt;
    const locale = localeProp ?? localeContext.locale;
    const styles = gantt();
    const { announce, region } = useAnnouncer();
    const [expanded, setExpanded] = useControllable(
        expandedProp,
        defaultExpanded ?? ganttGroupIds(tasks),
        onExpandedChange
    );
    const toggle = (id: string) =>
        setExpanded(expanded.includes(id) ? expanded.filter((item) => item !== id) : [...expanded, id]);
    const rows = ganttRows(tasks, expanded);
    const extent = ganttExtent(tasks);
    const critical = showCriticalPath ? criticalPath(tasks) : new Set<string>();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const changeProgress = (row: GanttRow, step: number) => {
        const progress = stepProgress(row.progress, step);
        if (progress === row.progress) return;
        onProgressChange?.({ task: row.task, progress });
        announce(t.progressChanged(row.task.name, progress));
    };

    const renderRow = (row: GanttRow) => {
        const { task } = row;
        const isCritical = critical.has(task.id);
        const look = gantt({
            tone: task.tone,
            group: row.hasChildren,
            expanded: row.expanded,
            critical: isCritical,
        });
        const dates = task.milestone
            ? new Intl.DateTimeFormat(locale, dateOptions).format(parseLocal(row.start))
            : formatDayRange(parseLocal(row.start), parseLocal(row.end), locale, dateOptions);
        const facts = task.milestone
            ? [t.milestone, dates]
            : [dates, pluralText(t.days, taskDuration(row), locale), t.progress(row.progress)];
        const predecessors = (task.dependencies ?? []).flatMap((id) => byId.get(id)?.name ?? []);
        const dependsOn = predecessors.length ? t.dependsOn(formatList(predecessors, locale)) : '';
        const name = [task.name, ...facts, dependsOn, isCritical ? t.critical : ''].filter(Boolean).join(', ');
        const bar = extent ? ganttBarPercent({ ...row, milestone: task.milestone }, extent) : null;
        const editableRow = editable && !row.hasChildren && !task.milestone;
        const texts = (
            <>
                <Text className={look.name()}>{task.name}</Text>
                <Text className={look.meta()}>{facts.join(' · ')}</Text>
                {!!dependsOn && <Text className={look.meta()}>{dependsOn}</Text>}
                {isCritical && <Text className={look.critical()}>{t.critical}</Text>}
            </>
        );
        const track = bar && (
            <View className={look.track()}>
                {task.milestone ? (
                    <View className={look.milestone()} style={{ left: `${bar.offset}%` as const }} />
                ) : (
                    <View
                        className={look.bar()}
                        style={{ left: `${bar.offset}%` as const, width: `${bar.width}%` as const }}
                    >
                        <View className={look.barProgress()} style={{ width: `${row.progress}%` as const }} />
                    </View>
                )}
            </View>
        );
        const step = (direction: 1 | -1) => changeProgress(row, direction * progressStep);
        const keys: Record<string, () => void> = {
            ArrowLeft: () => step(-1),
            ArrowDown: () => step(-1),
            ArrowRight: () => step(1),
            ArrowUp: () => step(1),
            Home: () => changeProgress(row, -100),
            End: () => changeProgress(row, 100),
        };

        return (
            <View
                key={task.id}
                role="listitem"
                className={look.row()}
                style={{ paddingLeft: 4 + (row.level - 1) * 16 }}
            >
                <View className={look.rowHeader()}>
                    {row.hasChildren ? (
                        <Pressable
                            role="button"
                            aria-label={task.name}
                            aria-expanded={row.expanded}
                            hitSlop={6}
                            className={look.toggle()}
                            onPress={() => toggle(task.id)}
                        >
                            <Icon icon={ChevronRight} className={look.toggleIcon()} />
                        </Pressable>
                    ) : (
                        <View className={look.toggleSpace()} />
                    )}
                    {onTaskClick ? (
                        <Pressable
                            role="button"
                            {...contentName(name)}
                            className={look.infoButton()}
                            onPress={() => onTaskClick(task)}
                        >
                            {texts}
                        </Pressable>
                    ) : (
                        <View className={look.info()}>{texts}</View>
                    )}
                </View>
                {!!track &&
                    (editableRow ? (
                        <View className={look.progressRow()}>
                            <IconButton
                                icon={Minus}
                                label={`${task.name}: ${translations.numberInput.decrementLabel}`}
                                variant="text"
                                size="sm"
                                hitSlop={6}
                                disabled={row.progress <= 0}
                                onPress={() => step(-1)}
                            />
                            <View
                                role="slider"
                                tabIndex={0}
                                aria-label={task.name}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={row.progress}
                                aria-valuetext={t.progress(row.progress)}
                                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                                onAccessibilityAction={(event) =>
                                    step(event.nativeEvent.actionName === 'increment' ? 1 : -1)
                                }
                                {...((Platform.OS === 'web'
                                    ? {
                                          onKeyDown: (event: { key: string; preventDefault(): void }) => {
                                              const action = keys[event.key];
                                              if (!action) return;
                                              event.preventDefault();
                                              action();
                                          },
                                      }
                                    : {}) as object)}
                                className={look.slider()}
                            >
                                {track}
                            </View>
                            <IconButton
                                icon={Plus}
                                label={`${task.name}: ${translations.numberInput.incrementLabel}`}
                                variant="text"
                                size="sm"
                                hitSlop={6}
                                disabled={row.progress >= 100}
                                onPress={() => step(1)}
                            />
                        </View>
                    ) : (
                        <View className={look.progressRow()} aria-hidden>
                            {track}
                        </View>
                    ))}
            </View>
        );
    };

    return (
        <View {...props} className={styles.base({ class: className })}>
            {!!title && (
                <Text role="heading" aria-level={headingLevel} className={styles.heading()}>
                    {title}
                </Text>
            )}
            {rows.length ? (
                <View
                    role="list"
                    aria-label={label ?? title ?? t.label}
                    aria-busy={loading || undefined}
                    className={styles.list()}
                >
                    {rows.map(renderRow)}
                </View>
            ) : (
                <Text className={styles.empty()}>{loading ? translations.common.loading : t.empty}</Text>
            )}
            {region}
        </View>
    );
}
