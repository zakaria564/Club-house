import { ClubLogo } from "@/components/club-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
            <ClubLogo className="h-20 w-auto" />
        </div>
        {children}
      </div>
    </div>
  );
}
