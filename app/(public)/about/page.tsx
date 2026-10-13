import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          About EduCore
        </h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          EduCore is an education management system. It holds the course
          catalogue, the semester calendar and every enrollment record in one
          place, and checks each role&rsquo;s permissions on the server for every
          request.
        </p>
      </div>
    </div>
  );
}
