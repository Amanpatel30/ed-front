import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Users,
  Workflow,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CAPABILITIES = [
  {
    icon: BookOpen,
    title: "Course catalogue",
    body: "Courses carry a code, credit weight, capacity and owning department. Deactivating a course retires it from the catalogue without destroying its enrollment history.",
  },
  {
    icon: CalendarDays,
    title: "Semester lifecycle",
    body: "Semesters move through upcoming, open and closed. Enrollment is accepted only while a semester is open, and a closed semester cannot be reopened.",
  },
  {
    icon: Workflow,
    title: "Enrollment rules in the database",
    body: "Capacity limits, duplicate-enrollment checks and semester state are enforced inside a database transaction, so concurrent enrollment attempts cannot oversubscribe a course.",
  },
  {
    icon: GraduationCap,
    title: "Instructor assignment",
    body: "Attach instructors to the courses they teach, with the assignment history kept alongside the course.",
  },
  {
    icon: Users,
    title: "Students and departments",
    body: "Students and instructors belong to departments, and every enrollment ties a student to a specific course in a specific semester.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Permissions are checked on the server for every request, so what a role can do is decided by the institution — not by what the interface happens to show.",
  },
];

const ROLES = [
  {
    name: "Super Admin",
    badge: "System",
    body: "Institution-wide oversight of the academic catalogue, departments, audits, and enrollment records.",
  },
  {
    name: "Admin",
    badge: "Operations",
    body: "Manages courses, semesters, instructor assignments, students, and enrollment records.",
  },
  {
    name: "Instructor",
    badge: "Faculty",
    body: "Sees assigned courses, course capacities, and student course information.",
  },
  {
    name: "Student",
    badge: "Learner",
    body: "Browses the catalogue, self-enrolls during open semesters, and manages active study plans.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-muted/30 via-background to-background pt-16 pb-20 md:pt-24 md:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_15%,transparent),transparent)]"
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6">
          <Badge variant="outline" className="mb-6 gap-2 px-3 py-1 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Academic Management System
          </Badge>

          <h1 className="max-w-4xl text-balance font-heading text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Academic operations, kept consistent end to end.
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            EduCore holds the course catalogue, semester calendars, and enrollment records
            in one place. Business rules — capacity limits, duplicates, and open semester
            eligibility — are strictly enforced.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/catalog"
              className={buttonVariants({ size: "lg", className: "gap-2 shadow-xs" })}
            >
              Browse course catalog
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Sign in to workspace
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Role-isolated access for Super Admins, Admins, Faculty Instructors, and Students.
          </p>
        </div>
      </section>

      {/* Capabilities section */}
      <section aria-labelledby="capabilities-heading" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2
            id="capabilities-heading"
            className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
          >
            What the system handles
          </h2>
          <p className="mt-2 text-muted-foreground">
            The core elements of academic administration managed with consistency.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="group/card transition-all duration-200 hover:border-foreground/20 hover:shadow-sm"
            >
              <CardHeader className="gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Roles section */}
      <section aria-labelledby="roles-heading" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2
            id="roles-heading"
            className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
          >
            One platform, four tailored roles
          </h2>
          <p className="mt-2 text-muted-foreground">
            Each role interacts with a dedicated workspace aligned with their authorized responsibilities.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => (
            <Card key={role.name} className="flex flex-col justify-between">
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{role.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {role.badge}
                  </Badge>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {role.body}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Enter workspace <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}