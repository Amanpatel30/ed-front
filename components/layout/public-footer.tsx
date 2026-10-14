export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <p className="font-medium text-foreground">
            EduCore Academic Management System
          </p>
          <p className="text-muted-foreground/80">
            Institutional platform for courses, semesters, faculty, and student enrollment.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a href="/catalog" className="transition-colors hover:text-foreground">
            Course Catalog
          </a>
          <a href="/about" className="transition-colors hover:text-foreground">
            About
          </a>
          <a href="/contact" className="transition-colors hover:text-foreground">
            Contact
          </a>
          <a href="/login" className="transition-colors hover:text-foreground">
            Sign In
          </a>
        </div>
      </div>
    </footer>
  );
}

