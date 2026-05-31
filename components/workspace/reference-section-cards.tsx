"use client"

import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ReferenceSectionCard = {
  title: string
  value: string
  badge: string
  trend?: "up" | "down" | "neutral"
  footer: string
  detail: string
}

type ReferenceSectionCardsProps = {
  cards: ReferenceSectionCard[]
}

export function ReferenceSectionCards({ cards }: ReferenceSectionCardsProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 *:data-[slot=card]:min-w-0 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const TrendIcon =
          card.trend === "down"
            ? TrendingDown
            : card.trend === "up"
              ? TrendingUp
              : null

        return (
          <Card className="@container/card" key={card.title}>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge
                  className={cn(
                    "gap-1",
                    card.trend === "down" &&
                      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/45 dark:text-amber-200",
                    card.trend === "neutral" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/45 dark:text-emerald-200"
                  )}
                  variant="outline"
                >
                  {TrendIcon ? <TrendIcon className="size-3" /> : null}
                  {card.badge}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.footer}
              </div>
              <div className="text-muted-foreground">{card.detail}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
