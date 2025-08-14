"use client"
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte pour accéder au tableau de bord.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="login" />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground w-full text-center">
            Vous n'avez pas de compte ?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
                Inscrivez-vous
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
