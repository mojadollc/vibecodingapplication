import Link from "next/link"
import { Coins, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  balance: number
  totalCredits?: number
  planName?: string
}

export default function CreditBadge({ balance, totalCredits, planName }: Props) {
  const isOut = balance <= 0
  const isLow = balance > 0 && balance <= 10
  const isFree = !planName || planName === "Free"
  const pct = totalCredits ? Math.min(100, Math.round((balance / totalCredits) * 100)) : null

  return (
    <Link href={isOut || isLow ? "/pricing" : "/billing"}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all hover:opacity-80",
        isOut ? "bg-destructive/10 text-destructive border-destructive/20"
        : isLow ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
        : "bg-primary/10 text-primary border-primary/20"
      )}>
        {isOut || isLow
          ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          : <Coins className="w-3.5 h-3.5 shrink-0" />
        }
        <span>
          {isOut ? "No credits — Upgrade"
          : isLow ? `${balance} credits left!`
          : `${balance} credits`}
        </span>
        {pct !== null && !isOut && (
          <div className="w-12 h-1.5 rounded-full bg-current/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-current transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  )
}
