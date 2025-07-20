"use client"

import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"

type Calendar05Props = {
    dateRange: DateRange | undefined
    onDateChange: (range: DateRange | undefined) => void
}

function Calendar05({ dateRange, onDateChange }: Calendar05Props) {
    return (
        <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateChange}
            numberOfMonths={2}
        />
    )
}

type DateRangePopoverProps = {
    dateRange: DateRange | undefined
    onDateChange: (range: DateRange | undefined) => void
}

export function DateRangePopover({ dateRange, onDateChange }: DateRangePopoverProps) {
    return (
        <Calendar05
            dateRange={dateRange}
            onDateChange={onDateChange}
        />
    )
}


