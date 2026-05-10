"use client"

import * as React from "react"
import Link from "next/link"

import {
  getDashboardScope,
  getDashboardWorkspace,
} from "@/components/demo/dashboard-nav-config"
import { ClinicPulseMark } from "@/components/brand/clinicpulse-logo"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { ClientAuthSession } from "@/lib/auth/api"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  session: ClientAuthSession
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
  const workspace = getDashboardWorkspace(session.role)
  const scope = getDashboardScope(session)

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={workspace.homeUrl} />}>
              <ClinicPulseMark className="size-8 rounded-lg shadow-none [&_svg]:!size-[82%]" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">ClinicPulse</span>
                <span className="truncate text-xs">{scope}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={workspace.groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
