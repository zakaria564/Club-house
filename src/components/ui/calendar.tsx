
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
        Dropdown: (props: DropdownProps) => {
          const { fromYear, toYear, fromMonth, toMonth, fromDate, toDate } = props
          const options: { label: string, value: string }[] = []
          if (props.name === "months") {
            options.push(
              ...Array.from({ length: 12 }, (_, i) => ({
                label: format(new Date(new Date().getFullYear(), i, 1), "MMMM"),
                value: i.toString(),
              }))
            )
          } else if (props.name === "years") {
            const earliestYear = fromYear || fromDate?.getFullYear() || new Date().getFullYear() - 100
            const latestYear = toYear || toDate?.getFullYear() || new Date().getFullYear()
            if (earliestYear && latestYear) {
              for (let i = latestYear; i >= earliestYear; i--) {
                options.push({ label: i.toString(), value: i.toString() })
              }
            }
          }

          const { name, onChange, value } = props
          return (
            <Select
              onValueChange={(newValue) => {
                if (onChange) {
                  const event = {
                    target: { value: newValue },
                  } as React.ChangeEvent<HTMLSelectElement>
                  onChange(event)
                }
              }}
              value={value?.toString()}
            >
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue placeholder={name === 'years' ? 'Année' : 'Mois'}>
                  {name === 'months'
                    ? format(new Date(new Date().getFullYear(), Number(value), 1), 'MMMM')
                    : value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-48">
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          )
        },
      }}
      captionLayout="dropdown-buttons"
      fromYear={props.fromYear || 1950}
      toYear={props.toYear || new Date().getFullYear() + 10}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

// Helper function to format month name, assuming locale is already loaded
function format(date: Date, fmt: string) {
  return date.toLocaleString('fr-FR', { month: 'long' })
}

export { Calendar }

    