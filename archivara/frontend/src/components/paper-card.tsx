import { formatDistanceToNowStrict } from "date-fns"
import Link from "next/link"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { Paper } from "@/types"

interface PaperCardProps extends React.HTMLAttributes<HTMLDivElement> {
  paper: Paper
}

export function PaperCard({ paper, className, ...props }: PaperCardProps) {
  return (
    <Card
      className={cn("flex flex-col overflow-hidden hover:shadow-lg transition-shadow dark:bg-card", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle className="line-clamp-2">
          <Link href={`/paper/${paper.id}`} className="hover:text-primary transition-colors">
            {paper.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-1">
          {paper.authors.map((author) => author.name).join(", ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {paper.abstract}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap gap-2">
          {paper.categories?.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          )) || null}
        </div>
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icons.bot className="h-4 w-4" />
            <span>{paper.generation_method || "Unknown"}</span>
          </div>
          <time dateTime={paper.published_at}>
            {formatDistanceToNowStrict(new Date(paper.published_at), {
              addSuffix: true,
            })}
          </time>
        </div>
      </CardFooter>
    </Card>
  )
}

export function PaperCardSkeleton() {
  return (
    <Card className="dark:bg-card">
      <CardHeader className="gap-2">
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded-md bg-muted" />
      </CardContent>
      <CardFooter className="gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </CardFooter>
    </Card>
  )
} 