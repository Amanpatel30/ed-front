"use client";

import {
  CircleAlert,
  Construction,
  Inbox,
  RefreshCw,
  ShieldX,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NormalizedApiError } from "@/lib/api/error";

/**
 * The four states every data screen must be able to show. Keeping them in one
 * module means loading, empty, error and permission-denied look identical
 * everywhere instead of being re-invented per screen.
 */

export function LoadingPanel({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={className ?? "space-y-2"}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: NormalizedApiError;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
        <CircleAlert className="size-5 text-destructive" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Could not load this data</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {error.message}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Shown when the API answers 403. The backend is authoritative for permissions,
 * so this reports the rule it enforced rather than pretending the data is empty.
 */
export function PermissionDeniedState({
  permission,
  description,
}: {
  permission?: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-6 py-14 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-amber-500/10">
        <ShieldX className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Your role does not have access</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {description ??
            "The API refused this request for your role. Ask an administrator to grant the required permission."}
        </p>
        {permission ? (
          <p className="text-xs text-muted-foreground">
            Required permission:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {permission}
            </code>
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Shown when the API answers 404 for an operation that has not been implemented
 * yet. Naming the endpoint is the point: it is the request for the missing
 * backend work, on the screen where someone would look for the feature.
 */
export function UnavailableState({
  title,
  endpoint,
  description,
}: {
  title: string;
  endpoint: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Construction className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {description ??
            "This part of the backend is not implemented yet, so the app cannot show or change it."}
        </p>
        <p className="text-xs text-muted-foreground">
          Missing endpoint:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {endpoint}
          </code>
        </p>
      </div>
    </div>
  );
}

/**
 * Renders exactly one of the four states, or the content once data is ready.
 * A 403 is routed to the permission screen and an expected 404 to the
 * not-implemented screen, rather than to the generic error screen.
 */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  requiredPermission,
  notFound,
  onRetry,
  loadingRows,
  children,
}: {
  isLoading: boolean;
  error: NormalizedApiError | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: React.ReactNode;
  /** Named in the 403 message so the missing grant is obvious. */
  requiredPermission?: string;
  /** Renders a 404 as "not implemented yet" naming this endpoint. */
  notFound?: { title: string; endpoint: string; description?: string };
  onRetry?: () => void;
  loadingRows?: number;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return <LoadingPanel rows={loadingRows} />;
  }

  if (error) {
    if (error.status === 403) {
      return <PermissionDeniedState permission={requiredPermission} />;
    }

    if (error.status === 404 && notFound) {
      return (
        <UnavailableState
          title={notFound.title}
          endpoint={notFound.endpoint}
          description={notFound.description}
        />
      );
    }

    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (isEmpty && emptyTitle) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
