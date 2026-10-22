import {
    compareEvents,
    eventsOn,
    pluralText,
    sameDay,
    scheduler,
    toIsoDate,
    type AgendaSection,
    type SchedulerEvent,
    type Translations,
} from '@wirecore/wirelayer-recipes/native';
import { Plus, Repeat } from 'lucide-react-native';
import { Pressable, ScrollView, SectionList, Text, View, type AccessibilityActionEvent } from 'react-native';
import { Icon } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { Button } from '../Button/Button.js';
import { contentName } from '../../utils/label.js';

/** Colour of an event (its own, else that of its resource) */
export type SchedulerTone = NonNullable<SchedulerEvent['tone']>;

/** Accessibility actions of an event (editable): move by the step or by a day */
export interface SchedulerEventActions {
    accessibilityActions?: { name: string; label: string }[];
    onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}

/** What the views share with the Scheduler: texts, formats, the look and the actions of an event */
export interface SchedulerKit {
    t: Translations['scheduler'];
    locale: string;
    /** Accessible name of an event: title, time, resource, series */
    name: (event: SchedulerEvent) => string;
    /** Visible time: "10:00–11:00" or "All day" */
    time: (event: SchedulerEvent) => string;
    /** Label of the event's resource */
    resource: (event: SchedulerEvent) => string | undefined;
    tone: (event: SchedulerEvent) => SchedulerTone | undefined;
    /** "Wednesday, October 21, 2026" */
    longDate: (day: Date) => string;
    /** An event was pressed: onEventClick or the detail sheet */
    open: (event: SchedulerEvent) => void;
    actions: (event: SchedulerEvent) => SchedulerEventActions;
    /** Empty time chosen (onSlotSelect) – minutes of the day, none for the whole day; undefined: not offered */
    slot?: (day: Date, minutes?: number) => void;
    /** Today in the shown time zone (null until known) */
    today: Date | null;
}

const styles = scheduler();

/** An event in a list (agenda, the chosen day of the month): time, title, resource and series */
export function ListEvent({ event, kit }: { event: SchedulerEvent; kit: SchedulerKit }) {
    const look = scheduler({ tone: kit.tone(event) });
    const resource = kit.resource(event);
    const meta = [resource, event.seriesId ? kit.t.series : ''].filter(Boolean).join(' · ');
    return (
        <Pressable
            role="button"
            {...contentName(kit.name(event))}
            className={look.agendaEvent()}
            onPress={() => kit.open(event)}
            {...kit.actions(event)}
        >
            <Text className={look.agendaTime()}>{kit.time(event)}</Text>
            <View className={look.agendaBody()}>
                <Text className={look.eventTitle()}>{event.title}</Text>
                {!!meta && (
                    <View className={look.eventMeta()}>
                        {!!event.seriesId && <Icon icon={Repeat} className={look.seriesIcon()} />}
                        <Text className={look.eventMetaText()}>{meta}</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

/** Events of one day as a list */
function EventList({ events, kit }: { events: SchedulerEvent[]; kit: SchedulerKit }) {
    return (
        <View role="list">
            {events.map((event) => (
                <View key={event.id} role="listitem" className={styles.agendaItem()}>
                    <ListEvent event={event} kit={kit} />
                </View>
            ))}
        </View>
    );
}

interface AgendaProps {
    sections: AgendaSection[];
    kit: SchedulerKit;
    height: number;
    /** Level of the day headings */
    level: number;
}

/** Agenda: a heading per day (sticky while scrolling), the day's events as a list; days without events left out */
export function SchedulerAgenda({ sections, kit, height, level }: AgendaProps) {
    return (
        <SectionList
            style={{ height }}
            sections={sections.map((section) => ({ key: section.key, day: section.day, data: [section.events] }))}
            keyExtractor={(_, index) => String(index)}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
                <Text role="heading" aria-level={level} className={styles.agendaHeading()}>
                    {kit.longDate(section.day)}
                </Text>
            )}
            renderItem={({ item }) => <EventList events={item} kit={kit} />}
            ListEmptyComponent={<Text className={styles.empty()}>{kit.t.empty}</Text>}
        />
    );
}

interface MonthProps {
    weeks: Date[][];
    /** The chosen day */
    current: Date;
    /** Events without background events */
    events: SchedulerEvent[];
    /** Number of events per ISO day */
    counts: Map<string, number>;
    kit: SchedulerKit;
    height: number;
    /** Name of the days (the month and year) */
    title: string;
    /** Level of the heading of the chosen day */
    level: number;
    onSelectDay: (day: Date) => void;
}

/**
 * Compact month: the days as a radio group (named with date and number of events, dots for up to three events, the
 * number for more), the events of the chosen day below
 */
export function SchedulerMonth({ weeks, current, events, counts, kit, height, title, level, onSelectDay }: MonthProps) {
    const { t, locale } = kit;
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const month = current.getMonth();
    const dayEvents = eventsOn(events, current).sort(compareEvents);
    const selectedDate = kit.longDate(current);
    const countText = (count: number) => (count ? pluralText(t.eventCount, count, locale) : t.empty);

    return (
        <ScrollView style={{ height }}>
            <View className={styles.weekdays()} aria-hidden>
                {(weeks[0] ?? []).map((day) => (
                    <Text key={day.getDay()} className={styles.weekdayName()}>
                        {weekday.format(day)}
                    </Text>
                ))}
            </View>
            <View role="radiogroup" aria-label={title} className={styles.monthGrid()}>
                {weeks.map((week) => (
                    <View key={toIsoDate(week[0]!)} className={styles.monthRow()}>
                        {week.map((day) => {
                            const count = counts.get(toIsoDate(day)) ?? 0;
                            const checked = sameDay(day, current);
                            const look = scheduler({
                                selected: checked,
                                outside: day.getMonth() !== month,
                                today: !!kit.today && sameDay(day, kit.today),
                            });
                            const choose = () => onSelectDay(day);
                            return (
                                <Pressable
                                    key={day.getTime()}
                                    role="radio"
                                    aria-checked={checked}
                                    aria-label={`${kit.longDate(day)}, ${countText(count)}`}
                                    className={look.monthDay()}
                                    onPress={choose}
                                    {...toggleOnSpace(choose)}
                                >
                                    <Text className={look.monthDayNumber()}>{day.getDate()}</Text>
                                    <View className={look.monthMarks()}>
                                        {count > 3 ? (
                                            <Text className={look.monthCount()}>{count}</Text>
                                        ) : (
                                            Array.from({ length: count }, (_, index) => (
                                                <View key={index} className={look.monthDot()} />
                                            ))
                                        )}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </View>
            <View className={styles.dayList()}>
                <Text role="heading" aria-level={level} className={styles.dayListHeading()}>
                    {selectedDate}
                </Text>
                {dayEvents.length ? (
                    <EventList events={dayEvents} kit={kit} />
                ) : (
                    <Text className={styles.empty()}>{t.empty}</Text>
                )}
                {!!kit.slot && (
                    <View className={styles.newEvent()}>
                        <Button variant="outline" size="sm" leadingIcon={Plus} onPress={() => kit.slot?.(current)}>
                            {t.newEvent(selectedDate)}
                        </Button>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
