import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";

/**
 * Public landing page. Every claim below maps to a capability the EduCore API
 * actually implements — there are no invented statistics, customers or features.
 */

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
    body: "Institution-wide oversight of the academic catalogue and enrollment records.",
  },
  {
    name: "Admin",
    body: "Manages courses, semesters, instructor assignment and enrollment records.",
  },
  {
    name: "Instructor",
    body: "Sees the courses assigned to them and the students enrolled in those courses.",
  },
  {
    name: "Student",
    body: "Browses the catalogue, enrolls in open semesters and manages their own enrollments.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        {/* Single restrained gradient wash, no imagery required. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_16%,transparent),transparent)]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden
              />
              Education management system
            </p>

            <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Academic operations, kept consistent end to end.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              EduCore holds the catalogue, the semester calendar and every
              enrollment record in one place. Rules that matter — capacity,
              duplicates, open semesters — are enforced by the API, and each
              role only sees the work that belongs to it.
            </p>

            <p className="mt-9 text-sm text-muted-foreground">
              Accounts are issued by your institution.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="capabilities-heading"
        className="border-t border-border/70 bg-muted/30"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="capabilities-heading"
            className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            What the system handles
          </h2>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            The parts of running a term that go wrong when they live in
            spreadsheets.
          </p>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-accent">
                  <Icon
                    className="size-4 text-accent-foreground"
                    aria-hidden
                  />
                </div>

                <h3 className="font-heading text-base font-medium">{title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="roles-heading">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2
            id="roles-heading"
            className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            One product, four roles
          </h2>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Each role signs in to a workspace built around its own
            responsibilities.
          </p>

          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => (
              <div key={role.name} className="bg-card p-5">
                <h3 className="font-heading text-base font-medium">
                  {role.name}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {role.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}