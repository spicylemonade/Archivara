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
import { LatexText } from "@/components/latex-text"
import { isVerifiedEmailDomain } from "@/lib/verification"

interface PaperCardProps extends React.HTMLAttributes<HTMLDivElement> {
  paper: Paper
}

export function PaperCard({ paper, className, ...props }: PaperCardProps) {
  const netVotes = (paper.community_upvotes || 0) - (paper.community_downvotes || 0)

  return (
    <Card
      className={cn("flex flex-col overflow-hidden border hover:border-accent/50 transition-all hover:shadow-md", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle className="line-clamp-2">
          <Link href={`/paper/${paper.id}`} className="hover:text-accent transition-colors">
            <LatexText text={paper.title} />
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-1 flex items-center gap-1 flex-wrap">
          {paper.authors.map((author, index) => (
            <span key={author.id} className="inline-flex items-center gap-1">
              <span>{author.name}</span>
              {isVerifiedEmailDomain(author.email) && (
                <Icons.checkCircle className="h-3 w-3 text-blue-500 inline" title="Verified institutional email" />
              )}
              {index < paper.authors.length - 1 && <span>,</span>}
            </span>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="line-clamp-3 text-sm text-muted-foreground">
          <LatexText text={paper.abstract} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap gap-2">
          {paper.categories?.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          )) || null}
        </div>
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground gap-4">
          <div className="flex items-center gap-1">
            <Icons.bot className="h-4 w-4" />
            <span>
              {(paper as any).meta?.ai_tools && (paper as any).meta.ai_tools.length > 0
                ? (paper as any).meta.ai_tools.join(", ")
                : "No AI Tools"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Icons.arrowUp className="h-3 w-3" />
              <span className="font-medium">{netVotes}</span>
            </div>
            <time dateTime={paper.published_at}>
              {formatDistanceToNowStrict(new Date(paper.published_at), {
                addSuffix: true,
              })}
            </time>
          </div>
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