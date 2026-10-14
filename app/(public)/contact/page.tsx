import type { Metadata } from "next";
import { Mail, Building, ShieldAlert } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 space-y-2">
        <Badge variant="outline" className="text-xs">
          Support & Inquiries
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          Contact Administration
        </h1>
        <p className="text-base text-muted-foreground">
          Academic account issuance and administration support.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <Building className="size-5" />
            </div>
            <CardTitle className="text-lg">Institutional Access</CardTitle>
            <CardDescription className="leading-relaxed">
              Access to EduCore is granted directly by your educational institution. Staff and faculty accounts
              are configured and issued by designated system administrators.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <Mail className="size-5" />
            </div>
            <CardTitle className="text-lg">Support Channels</CardTitle>
            <CardDescription className="leading-relaxed">
              For questions regarding course offerings, enrollment status, semester deadlines, or account password resets,
              please reach out to your institution&apos;s academic registrar office.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="sm:col-span-2 border-dashed">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <ShieldAlert className="size-5 text-muted-foreground" />
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Security Notice</CardTitle>
              <CardDescription className="text-xs">
                EduCore administrators will never ask for your password via email or unofficial channels.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
