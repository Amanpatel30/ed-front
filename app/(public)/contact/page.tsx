import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Contact
        </h1>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          Access to EduCore is granted by your institution. Staff accounts are
          issued by your administrator.
        </p>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          For anything else about your account, courses or enrollments, contact
          your institution&rsquo;s administrator.
        </p>
      </div>
    </div>
  );
}
