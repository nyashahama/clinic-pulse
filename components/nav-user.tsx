"use client"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { getDashboardScope, getDashboardWorkspace } from "@/components/demo/dashboard-nav-config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { ClientAuthSession } from "@/lib/auth/api"
import { BadgeCheckIcon, ChevronsUpDownIcon, ShieldCheckIcon } from "lucide-react"

function getInitials(session: ClientAuthSession) {
  const source = session.displayName || session.name || session.email
  const [first = "", second = ""] = source.split(/\s+/)

  return `${first[0] ?? "C"}${second[0] ?? "P"}`.toUpperCase()
}

export function NavUser({ session }: { session: ClientAuthSession }) {
  const { isMobile } = useSidebar()
  const workspace = getDashboardWorkspace(session.role)
  const scope = getDashboardScope(session)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-muted aria-expanded:text-foreground"
              />
            }
          >
            <Avatar>
              <AvatarFallback>{getInitials(session)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {session.displayName || session.email}
              </span>
              <span className="truncate text-xs">{workspace.roleLabel}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{getInitials(session)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {session.displayName || session.email}
                    </span>
                    <span className="truncate text-xs">{session.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheckIcon />
                {workspace.workspaceLabel}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShieldCheckIcon />
                {scope}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
