"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
  {
    value: "system",
    ariaLabel: "Use system theme",
    icon: MonitorIcon,
  },
  {
    value: "light",
    ariaLabel: "Use light theme",
    icon: SunIcon,
  },
  {
    value: "dark",
    ariaLabel: "Use dark theme",
    icon: MoonIcon,
  },
] as const

const subscribe = () => () => undefined
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeSwitcher() {
  const { setTheme, theme = "system" } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  )

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="block h-8 w-[6.75rem] shrink-0 rounded-lg border border-border bg-muted"
      />
    )
  }

  return (
    <div
      aria-label="Theme"
      className="flex shrink-0 items-center rounded-lg border border-border bg-muted p-0.5"
      role="group"
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon
        const active = theme === option.value

        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={option.ariaLabel}
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "size-7 rounded-md text-muted-foreground hover:text-foreground",
              active && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" />
          </Button>
        )
      })}
    </div>
  )
}
