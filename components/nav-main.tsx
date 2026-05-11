"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type {
  DashboardNavGroup,
  DashboardNavItem,
} from "@/lib/product/workspace-config"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { isDashboardNavUrlActive } from "@/lib/product/nav-active-state"
import { resolveNavCollapsibleOpen } from "@/lib/product/nav-collapsible-state"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({ groups }: { groups: DashboardNavGroup[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const active = Boolean(
                isDashboardNavUrlActive(item.url, pathname, searchParams) ||
                  item.items?.some((subItem) =>
                    isDashboardNavUrlActive(
                      subItem.url,
                      pathname,
                      searchParams,
                    ),
                  ),
              )

              return (
                <NavMainItem
                  key={`${group.label}-${item.title}`}
                  active={active}
                  item={item}
                  pathname={pathname}
                  searchParams={searchParams}
                />
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

function NavMainItem({
  active,
  item,
  pathname,
  searchParams,
}: {
  active: boolean
  item: DashboardNavItem
  pathname: string
  searchParams: { toString: () => string }
}) {
  const { setOpenMobile } = useSidebar()
  const [userOpen, setUserOpen] = React.useState(active)
  const [closedActiveSignature, setClosedActiveSignature] = React.useState<
    string | null
  >(null)
  const activeSignature = active
    ? `${pathname}?${searchParams.toString()}`
    : null
  const open = resolveNavCollapsibleOpen({
    active,
    activeSignature,
    closedActiveSignature,
    userOpen,
  })

  return (
    <Collapsible
      open={open}
      onOpenChange={(nextOpen) => {
        setUserOpen(nextOpen)
        setClosedActiveSignature(
          !nextOpen && active ? activeSignature : null,
        )
      }}
      render={<SidebarMenuItem />}
    >
      <SidebarMenuButton
        isActive={active}
        tooltip={item.title}
        render={<Link href={item.url} onClick={() => setOpenMobile(false)} />}
      >
        {item.icon}
        <span>{item.title}</span>
        {item.badge ? (
          <span className="ml-auto rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold text-sidebar-accent-foreground">
            {item.badge}
          </span>
        ) : null}
      </SidebarMenuButton>
      {item.items?.length ? (
        <>
          <SidebarMenuAction
            render={<CollapsibleTrigger />}
            className="aria-expanded:rotate-90"
          >
            <ChevronRightIcon />
            <span className="sr-only">Toggle</span>
          </SidebarMenuAction>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    isActive={isDashboardNavUrlActive(
                      subItem.url,
                      pathname,
                      searchParams,
                    )}
                    render={
                      <Link
                        href={subItem.url}
                        onClick={() => setOpenMobile(false)}
                      />
                    }
                  >
                    <span>{subItem.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </>
      ) : null}
    </Collapsible>
  )
}
