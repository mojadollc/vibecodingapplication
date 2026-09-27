import Link from "next/link"
import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  balance: number
}

export default function CreditBadge({ balance }: Props) {
  const isLow = balance <= 10

  return (
    <Link href={isLow ? "/pricing" : "/billing"}>
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-opacity hover:opacity-80",
          isLow
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : "bg-primary/10 text-primary border-primary/20"
        )}
      >
        <Coins className="w-3.5 h-3.5" />
        {balance} credits{isLow ? " — Upgrade" : ""}
      </div>
    </Link>
  )
}
