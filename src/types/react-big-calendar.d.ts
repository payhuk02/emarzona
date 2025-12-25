/**
 * Type declarations for react-big-calendar
 * Since @types/react-big-calendar is not available, we provide basic type definitions
 */

declare module 'react-big-calendar' {
  import { Component, ReactNode, CSSProperties } from 'react';

  export interface Event {
    title?: string;
    start?: Date;
    end?: Date;
    resource?: any;
    [key: string]: any;
  }

  export interface Localizer {
    format(value: Date | Date[], format: string, culture?: string): string;
    parse(value: string, format: string, culture?: string): Date;
    startOfWeek(culture?: string): number;
    getDay(date: Date, culture?: string): number;
    locales?: { [key: string]: any };
  }

  export interface dateFnsLocalizerOptions {
    format: (value: Date | number | string, formatStr: string, options?: any) => string;
    parse: (value: string, format: string, referenceDate: Date, options?: any) => Date;
    startOfWeek: (date: Date, options?: any) => Date;
    getDay: (date: Date) => number;
    locales?: { [key: string]: any };
  }

  export function dateFnsLocalizer(options: dateFnsLocalizerOptions): Localizer;

  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

  export const Views: {
    MONTH: 'month';
    WEEK: 'week';
    WORK_WEEK: 'work_week';
    DAY: 'day';
    AGENDA: 'agenda';
  };

  export interface Messages {
    date?: string;
    time?: string;
    event?: string;
    allDay?: string;
    week?: string;
    work_week?: string;
    day?: string;
    month?: string;
    previous?: string;
    next?: string;
    yesterday?: string;
    tomorrow?: string;
    today?: string;
    agenda?: string;
    noEventsInRange?: string;
    showMore?: (total: number) => string;
  }

  export interface CalendarProps<TEvent extends Event = Event, TResource = any> {
    localizer: Localizer;
    events: TEvent[];
    startAccessor: string | ((event: TEvent) => Date);
    endAccessor: string | ((event: TEvent) => Date);
    view?: View;
    onView?: (view: View) => void;
    date?: Date;
    onNavigate?: (date: Date) => void;
    onSelectEvent?: (event: TEvent) => void;
    onEventDrop?: (args: { event: TEvent; start: Date; end: Date }) => void;
    eventPropGetter?: (event: TEvent) => { style?: CSSProperties; className?: string };
    messages?: Messages;
    step?: number;
    timeslots?: number;
    min?: Date;
    max?: Date;
    defaultDate?: Date;
    draggableAccessor?: string | ((event: TEvent) => boolean);
    resizable?: boolean;
    popup?: boolean;
    className?: string;
    style?: CSSProperties;
    components?: any;
    formats?: any;
    culture?: string;
    defaultView?: View;
    views?: View[];
    toolbar?: boolean;
    showMultiDayTimes?: boolean;
    scrollToTime?: Date;
    onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[]; action: 'select' | 'click' | 'doubleClick' }) => void;
    onSelecting?: (range: { start: Date; end: Date }) => boolean;
    onRangeChange?: (range: Date[] | { start: Date; end: Date }) => void;
    resourceIdAccessor?: string | ((event: TEvent) => any);
    resourceTitleAccessor?: string | ((resource: TResource) => string);
    resources?: TResource[];
    onDrillDown?: (date: Date) => void;
    drilldownView?: View;
    getNow?: () => Date;
    dayLayoutAlgorithm?: 'overlap' | 'no-overlap';
    length?: number;
    onShowMore?: (events: TEvent[], date: Date) => void;
    showAllEvents?: boolean;
    doShowMore?: (events: TEvent[], date: Date) => void;
    popupOffset?: number | { x: number; y: number };
    popupHeader?: ReactNode;
    popupContent?: ReactNode;
    selectable?: boolean | 'ignoreEvents';
    longPressThreshold?: number;
    [key: string]: any;
  }

  export class Calendar<TEvent extends Event = Event, TResource = any> extends Component<CalendarProps<TEvent, TResource>> {}
}

