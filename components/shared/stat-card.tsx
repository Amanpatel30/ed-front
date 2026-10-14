import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * A single real measurement. Values come from API responses, so a card is only
 * rendered where the data to fill it exists.
 * Styled according to the reference Kiranism dashboard stat card pattern.
 */
export function StatCard({
  label,
  value,
  hint,
  subhint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  subhint?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {Icon ? (
          <CardAction>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
              <Icon className="size-4" aria-hidden />
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      {hint ? (
        <CardFooter className="flex-col items-start gap-1 text-xs">
          <div className="line-clamp-1 font-medium text-foreground">{hint}</div>
          {subhint ? <div className="text-muted-foreground">{subhint}</div> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
