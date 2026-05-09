"use client"

import type { ComponentProps } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { SidebarInput } from "@/components/ui/sidebar"
import { SearchIcon } from "lucide-react"

type SearchFormProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  placeholder: string
}

export function SearchForm({ placeholder, ...props }: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault()
        const trimmedQuery = query.trim()
        if (!trimmedQuery) {
          return
        }

        router.push(`/finder?query=${encodeURIComponent(trimmedQuery)}`)
      }}
    >
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-8 pl-7"
        />
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  )
}
