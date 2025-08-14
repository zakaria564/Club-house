"use client"
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Remplissez les informations ci-dessous pour créer votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="signup" />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground w-full text-center">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
                Connectez-vous
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
