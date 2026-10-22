import {
    closedTimes,
    dragMinutes,
    eventsOn,
    layoutDay,
    sameDay,
    scheduler,
    timeGridMinutes,
    timeGridOffset,
    type SchedulerBusinessHours,
    type SchedulerEvent,
} from '@wirecore/wirelayer-recipes/native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    View,
    type GestureResponderEvent,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';
import type { SchedulerKit } from './SchedulerViews.js';
import { contentName } from '../../utils/label.js';

/** Height of an hour in the time grid (pt) */
export const HOUR_HEIGHT = 56;
/** Width of the time column (w-15 in the recipe) */
const GUTTER = 60;

interface TimeGridProps {
    kit: SchedulerKit;
    days: Date[];
    /** Shown day: the week scrolls to its column */
    current: Date;
    /** Events of the shown range without background events */
    events: SchedulerEvent[];
    /** Holidays, closures – shown behind the events */
    backgrounds: SchedulerEvent[];
    startHour: number;
    endHour: number;
    /** Step of moving by dragging, in minutes */
    snap: number;
    /** Columns in view at once – the others are reached by scrolling sideways */
    daysInView: number;
    height: number;
    startScrollTime?: string;
    businessHours?: SchedulerBusinessHours[];
    /** Events can be moved: long press, then drag (snaps to `snap` and to whole days) */
    editing: boolean;
    onMove: (event: SchedulerEvent, minutes: number, days: number) => void;
    /** A day heading was pressed (opens the day view) */
    onDayPress?: (day: Date) => void;
}

interface Drag {
    id: string;
    minutes: number;
    days: number;
}

/**
 * Day and week view: hours on the left, a column per day (positioned events, hour lines, closed times, the current
 * time), the day headings and all-day events stay on top while the hours scroll. More days than `daysInView` scroll
 * sideways, the headings follow. A long press on an event lifts it; dragging moves it in steps (and by days).
 */
export function SchedulerTimeGrid({
    kit,
    days,
    current,
    events,
    backgrounds,
    startHour,
    endHour,
    snap,
    daysInView,
    height,
    startScrollTime,
    businessHours,
    editing,
    onMove,
    onDayPress,
}: TimeGridProps) {
    const { t, locale } = kit;
    const styles = scheduler();
    const [width, setWidth] = useState(0);
    const columns = Math.max(1, Math.min(daysInView, days.length));
    const columnWidth = width ? Math.max(1, (width - GUTTER) / columns) : 0;
    const gridHeight = (endHour - startHour) * HOUR_HEIGHT;
    const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const allDay = days.map((day) => ({
        events: eventsOn(events, day).filter((event) => event.allDay),
        backgrounds: eventsOn(backgrounds, day).filter((event) => event.allDay),
    }));
    const hasAllDay = allDay.some((day) => day.events.length || day.backgrounds.length);

    // Scrolling: the hours to startScrollTime, the columns to the shown day; the headings follow the columns
    const vertical = useRef<ComponentRef<typeof ScrollView>>(null);
    const body = useRef<ComponentRef<typeof ScrollView>>(null);
    const heads = useRef<ComponentRef<typeof ScrollView>>(null);
    const allDayRow = useRef<ComponentRef<typeof ScrollView>>(null);
    const firstDay = days[0]?.getTime() ?? 0;
    const index = Math.max(
        0,
        Math.min(
            days.findIndex((day) => sameDay(day, current)),
            days.length - columns
        )
    );
    useEffect(() => {
        if (!startScrollTime) return;
        vertical.current?.scrollTo({ y: timeGridOffset(startScrollTime, HOUR_HEIGHT, startHour), animated: false });
    }, [startScrollTime, startHour, firstDay]);
    useEffect(() => {
        if (!columnWidth) return;
        const x = index * columnWidth;
        for (const view of [body, heads, allDayRow]) view.current?.scrollTo({ x, animated: false });
    }, [index, columnWidth, firstDay]);
    const follow = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        heads.current?.scrollTo({ x, animated: false });
        allDayRow.current?.scrollTo({ x, animated: false });
    };

    // Dragging: a long press lifts the event, the grid takes over the touch (responder capture) and moves a preview;
    // releasing applies it. The start is kept in a ref (handlers only), the preview in state.
    const [drag, setDrag] = useState<Drag | null>(null);
    const dragStart = useRef<(Drag & { x: number; y: number; active: boolean }) | null>(null);
    const suppressPress = useRef(false);
    const startDrag = (event: SchedulerEvent, press: GestureResponderEvent) => {
        if (!editing) return;
        suppressPress.current = true;
        const { pageX, pageY } = press.nativeEvent;
        dragStart.current = { id: event.id, minutes: 0, days: 0, x: pageX, y: pageY, active: false };
        setDrag({ id: event.id, minutes: 0, days: 0 });
    };
    const endDrag = (apply: boolean) => {
        const state = dragStart.current;
        dragStart.current = null;
        setDrag(null);
        // A press that arrives with the release (web) does not open the event
        setTimeout(() => {
            suppressPress.current = false;
        }, 0);
        if (!apply || !state || (!state.minutes && !state.days)) return;
        const event = events.find((item) => item.id === state.id);
        if (event) onMove(event, state.minutes, state.days);
    };
    // Released without dragging: the press ends, the grid never took over
    const onPressOut = () => {
        setTimeout(() => {
            if (dragStart.current && !dragStart.current.active) endDrag(false);
        }, 0);
    };
    const responder = {
        onMoveShouldSetResponderCapture: () => !!dragStart.current,
        onResponderGrant: () => {
            if (dragStart.current) dragStart.current.active = true;
        },
        onResponderMove: (move: GestureResponderEvent) => {
            const state = dragStart.current;
            if (!state) return;
            const minutes = dragMinutes(move.nativeEvent.pageY - state.y, HOUR_HEIGHT, snap);
            const distance = move.nativeEvent.pageX - state.x;
            const shift = days.length > 1 && columnWidth ? Math.round(distance / columnWidth) || 0 : 0;
            if (minutes === state.minutes && shift === state.days) return;
            state.minutes = minutes;
            state.days = shift;
            setDrag({ id: state.id, minutes, days: shift });
        },
        onResponderTerminationRequest: () => false,
        onResponderRelease: () => endDrag(true),
        onResponderTerminate: () => endDrag(false),
    };

    // Position of a press in the column: locationY (iOS, Android), the offset of the mouse event (web)
    const pressedAt = (press: GestureResponderEvent) =>
        press.nativeEvent.locationY ?? (press.nativeEvent as unknown as { offsetY?: number }).offsetY ?? 0;
    const hourLabel = (hour: number) => time.format(new Date(2000, 0, 1, hour));
    const top = (percent: number) => (percent / 100) * gridHeight;
    const now = kit.today;
    const nowTop = now ? timeGridOffset(now.getHours() * 60 + now.getMinutes(), HOUR_HEIGHT, startHour) : -1;
    const showNow = (day: Date) => !!now && sameDay(day, now) && nowTop > 0 && nowTop < gridHeight;

    return (
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
            <ScrollView ref={vertical} style={{ height }} stickyHeaderIndices={[0]} scrollEnabled={!drag}>
                <View className={styles.header()}>
                    <View className={styles.headRow()}>
                        <View className={styles.corner()} />
                        <ScrollView
                            ref={heads}
                            horizontal
                            scrollEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            className={styles.headScroll()}
                        >
                            {days.map((day) => {
                                const look = scheduler({ today: !!now && sameDay(day, now) });
                                const content = (
                                    <>
                                        <Text className={look.weekday()}>{weekday.format(day)}</Text>
                                        <View className={look.dayNumber()}>
                                            <Text className={look.dayNumberText()}>{day.getDate()}</Text>
                                        </View>
                                    </>
                                );
                                // The columns are named by their day; the heading opens the day view when offered
                                return onDayPress ? (
                                    <Pressable
                                        key={day.getTime()}
                                        role="button"
                                        // The web reads "Wed 21" like the web Scheduler; iOS and Android the full date
                                        {...contentName(kit.longDate(day))}
                                        className={look.dayHead()}
                                        style={{ width: columnWidth }}
                                        onPress={() => onDayPress(day)}
                                    >
                                        {content}
                                    </Pressable>
                                ) : (
                                    <View
                                        key={day.getTime()}
                                        className={look.dayHead()}
                                        style={{ width: columnWidth }}
                                        aria-hidden
                                    >
                                        {content}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                    {hasAllDay && (
                        <View className={styles.allDayRow()}>
                            <View className={styles.allDayLabel()}>
                                <Text className={styles.allDayLabelText()}>{t.allDay}</Text>
                            </View>
                            <ScrollView
                                ref={allDayRow}
                                horizontal
                                scrollEnabled={false}
                                showsHorizontalScrollIndicator={false}
                                className={styles.headScroll()}
                            >
                                {days.map((day, column) => (
                                    <View
                                        key={day.getTime()}
                                        role="group"
                                        aria-label={`${kit.longDate(day)}, ${t.allDay}`}
                                        className={styles.allDayCell()}
                                        style={{ width: columnWidth }}
                                    >
                                        {allDay[column]!.backgrounds.map((event) => (
                                            <View key={event.id} className={styles.backgroundLabel()}>
                                                <Text numberOfLines={1} className={styles.backgroundText()}>
                                                    {event.title}
                                                </Text>
                                            </View>
                                        ))}
                                        {allDay[column]!.events.map((event) => (
                                            <Pressable
                                                key={event.id}
                                                role="button"
                                                {...contentName(kit.name(event))}
                                                className={scheduler({ tone: kit.tone(event) }).allDayEvent()}
                                                onPress={() => kit.open(event)}
                                                {...kit.actions(event)}
                                            >
                                                <Text numberOfLines={1} className={styles.eventGridTitle()}>
                                                    {event.title}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
                <View className={styles.gridRow()}>
                    <View className={styles.gutter()} style={{ height: gridHeight }} aria-hidden>
                        {hours.map((hour, row) => (
                            <Text
                                key={hour}
                                className={styles.hourLabel()}
                                style={{ top: row ? row * HOUR_HEIGHT - 6 : 2 }}
                            >
                                {hourLabel(hour)}
                            </Text>
                        ))}
                    </View>
                    <ScrollView
                        ref={body}
                        horizontal
                        scrollEnabled={!drag}
                        onScroll={follow}
                        scrollEventThrottle={16}
                        snapToInterval={columnWidth || undefined}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        className={styles.headScroll()}
                    >
                        <View className={styles.columns()} {...responder}>
                            {days.map((day) => (
                                <View
                                    key={day.getTime()}
                                    role="group"
                                    aria-label={kit.longDate(day)}
                                    className={styles.column()}
                                    style={{ width: columnWidth, height: gridHeight }}
                                >
                                    {hours.map((hour, row) => (
                                        <View
                                            key={hour}
                                            className={styles.hourLine()}
                                            style={{ top: row * HOUR_HEIGHT }}
                                            pointerEvents="none"
                                            aria-hidden
                                        />
                                    ))}
                                    {closedTimes(businessHours, day, startHour, endHour).map((block) => (
                                        <View
                                            key={block.top}
                                            className={styles.closed()}
                                            style={{ top: top(block.top), height: top(block.height) }}
                                            pointerEvents="none"
                                            aria-hidden
                                        />
                                    ))}
                                    {layoutDay(backgrounds, day, startHour, endHour).map((item) => (
                                        <View
                                            key={item.event.id}
                                            className={styles.backgroundEvent()}
                                            style={{ top: top(item.top), height: top(item.height) }}
                                            pointerEvents="none"
                                        >
                                            <Text numberOfLines={2} className={styles.backgroundText()}>
                                                {item.event.title}
                                            </Text>
                                        </View>
                                    ))}
                                    {!!kit.slot && (
                                        <Pressable
                                            role="button"
                                            aria-label={t.newEvent(kit.longDate(day))}
                                            className={styles.slot()}
                                            onPress={(press) =>
                                                kit.slot?.(
                                                    day,
                                                    timeGridMinutes(
                                                        pressedAt(press),
                                                        HOUR_HEIGHT,
                                                        startHour,
                                                        endHour,
                                                        snap
                                                    )
                                                )
                                            }
                                        />
                                    )}
                                    {layoutDay(events, day, startHour, endHour).map((item) => {
                                        const { event } = item;
                                        const moving = drag?.id === event.id ? drag : null;
                                        const look = scheduler({ tone: kit.tone(event), dragging: !!moving });
                                        const boxHeight = top(item.height);
                                        return (
                                            <Pressable
                                                key={event.id}
                                                role="button"
                                                {...contentName(kit.name(event))}
                                                className={look.event()}
                                                style={{
                                                    top: top(item.top),
                                                    height: boxHeight - 1,
                                                    left: `${(item.column / item.columns) * 100}%` as const,
                                                    width: `${100 / item.columns}%` as const,
                                                    ...(moving
                                                        ? {
                                                              transform: [
                                                                  {
                                                                      translateY: (moving.minutes / 60) * HOUR_HEIGHT,
                                                                  },
                                                                  { translateX: moving.days * columnWidth },
                                                              ],
                                                          }
                                                        : {}),
                                                }}
                                                onPress={() => {
                                                    if (!suppressPress.current) kit.open(event);
                                                }}
                                                {...(editing
                                                    ? {
                                                          onLongPress: (press: GestureResponderEvent) =>
                                                              startDrag(event, press),
                                                          delayLongPress: 350,
                                                          onPressOut,
                                                      }
                                                    : {})}
                                                {...kit.actions(event)}
                                            >
                                                <Text
                                                    numberOfLines={boxHeight > 44 ? 2 : 1}
                                                    className={look.eventGridTitle()}
                                                >
                                                    {event.title}
                                                </Text>
                                                {boxHeight > 36 && (
                                                    <Text numberOfLines={1} className={look.eventGridTime()}>
                                                        {kit.time(event)}
                                                    </Text>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                    {showNow(day) && (
                                        <View
                                            className={styles.now()}
                                            style={{ top: nowTop }}
                                            pointerEvents="none"
                                            aria-hidden
                                        />
                                    )}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
}
