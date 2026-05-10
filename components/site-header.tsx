"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { CommandPalette } from "@/components/demo/command-palette"
import {
  getDashboardWorkspace,
} from "@/components/demo/dashboard-nav-config"
import { LiveIndicator } from "@/components/demo/live-indicator"
import { SearchForm } from "@/components/search-form"
import { ThemeSwitcher } from "@/components/theme-switcher"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import type { ClientAuthSession } from "@/lib/auth/api"
import { cn } from "@/lib/utils"
import { LogOutIcon, PanelLeftIcon, SearchIcon } from "lucide-react"

type SiteHeaderProps = {
  authSession: ClientAuthSession
  logoutAction: () => Promise<void>
}

export function SiteHeader({ authSession, logoutAction }: SiteHeaderProps) {
  const { toggleSidebar } = useSidebar()
  const [commandOpen, setCommandOpen] = useState(false)
  const workspace = getDashboardWorkspace(authSession.role)

  useEffect(() => {
    const isTextField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      return (
        target.nodeName === "INPUT" ||
        target.nodeName === "TEXTAREA" ||
        target.nodeName === "SELECT" ||
        target.isContentEditable
      )
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextField(event.target)) {
        return
      }

      const modifier = event.metaKey || event.ctrlKey

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen((current) => !current)
      }

    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 flex w-full items-center border-b border-border bg-background/95 text-foreground backdrop-blur">
        <div className="flex h-(--header-height) w-full items-center gap-2 px-3 lg:px-4">
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle dashboard navigation"
          >
            <PanelLeftIcon />
          </Button>
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb className="hidden min-w-0 sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={workspace.primaryAction.url}>
                  {workspace.workspaceLabel}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{workspace.roleLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <SearchForm
            placeholder={workspace.searchPlaceholder}
            className="min-w-0 flex-1 sm:ml-auto sm:max-w-sm"
          />

          <Link
            href={workspace.primaryAction.url}
            className={cn(
              buttonVariants({ size: "sm", variant: "default" }),
              "hidden lg:inline-flex",
            )}
          >
            {workspace.primaryAction.icon}
            {workspace.primaryAction.title}
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommandOpen(true)}
            className="hidden md:inline-flex"
          >
            <SearchIcon />
            Command
          </Button>

          <ThemeSwitcher />

          <div className="hidden xl:block">
            <LiveIndicator />
          </div>

          <form action={logoutAction}>
            <Button variant="outline" size="icon-sm" type="submit" aria-label="Sign out">
              <LogOutIcon />
            </Button>
          </form>
        </div>
      </header>
      <CommandPalette
        key={commandOpen ? "open" : "closed"}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </>
  )
}
