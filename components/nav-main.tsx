"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { DashboardNavGroup } from "@/components/demo/dashboard-nav-config"
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
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

function getHrefPath(url: string) {
  return url.split(/[?#]/)[0] || url
}

function isUrlActive(
  url: string,
  pathname: string,
  searchParams: { toString: () => string },
) {
  const hrefPath = getHrefPath(url)
  const hrefQuery = url.includes("?") ? url.split("?")[1] : ""
  const pathActive = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`)

  if (!hrefQuery) {
    return pathActive
  }

  return pathname === hrefPath && searchParams.toString() === hrefQuery
}

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
              const active =
                isUrlActive(item.url, pathname, searchParams) ||
                item.items?.some((subItem) =>
                  isUrlActive(subItem.url, pathname, searchParams),
                )

              return (
                <Collapsible
                  key={`${group.label}-${item.title}`}
                  defaultOpen={active}
                  render={<SidebarMenuItem />}
                >
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    render={<Link href={item.url} />}
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
                                isActive={isUrlActive(
                                  subItem.url,
                                  pathname,
                                  searchParams,
                                )}
                                render={<Link href={subItem.url} />}
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
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
