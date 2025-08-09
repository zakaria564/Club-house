
"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { ClubEvent } from "@/types"


const eventTypes = [
    { value: "Match", label: "Match" },
    { value: "Entraînement", label: "Entraînement" },
    { value: "Réunion", label: "Réunion" },
    { value: "Événement", label: "Événement" },
    { value: "Autre", label: "Autre" },
]

export function EventTypeCombobox({ value, onValueChange }: { value: string, onValueChange: (value: ClubEvent['type'] | "") => void }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between col-span-3"
        >
          {value
            ? eventTypes.find((eventType) => eventType.value === value)?.label
            : "Sélectionnez le type..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un type..." />
          <CommandEmpty>Aucun type d'événement trouvé.</CommandEmpty>
          <CommandGroup>
            <CommandList>
                {eventTypes.map((eventType) => (
                <CommandItem
                    key={eventType.value}
                    value={eventType.label}
                    onSelect={(currentValue) => {
                      const selected = eventTypes.find(et => et.label.toLowerCase() === currentValue.toLowerCase());
                      onValueChange(selected ? selected.value as ClubEvent['type'] : "")
                      setOpen(false)
                    }}
                >
                    <Check
                    className={cn(
                        "mr-2 h-4 w-4",
                        value === eventType.value ? "opacity-100" : "opacity-0"
                    )}
                    />
                    {eventType.label}
                </CommandItem>
                ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
