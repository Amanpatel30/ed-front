import type { Metadata } from "next";
import { BookOpen, GraduationCap, ShieldCheck, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 space-y-2">
        <Badge variant="outline" className="text-xs">
          Institution System
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          About EduCore
        </h1>
        <p className="text-base text-muted-foreground">
          An integrated academic management platform designed for administrative accuracy and data integrity.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Core Purpose</CardTitle>
            <CardDescription>
              EduCore holds the course catalogue, the semester calendar, and every enrollment record
              in one verifiable place. Permissions are enforced on the server for every request,
              guaranteeing that operations adhere strictly to academic policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="flex gap-3 items-start">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Database className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">ACID Transactional Safety</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Enrollment quotas, duplicate checks, and semester statuses run inside database transactions.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Strict RBAC Authorization</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Fine-grained permissions guard every endpoint for Super Admins, Admins, Instructors, and Students.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Course Life Cycle</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Active catalogue courses, department assignments, and credit tracking with audit history.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Semester Rules</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Enforces open/upcoming/closed states with automatic enrollment eligibility gating.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
