
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Joueurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">128</p>
            <p className="text-sm text-muted-foreground">+5 depuis le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prochain Match</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">vs. FC Lions</p>
            <p className="text-sm text-muted-foreground">25 Juillet 2024 - 18:00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paiements en attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">Total: 1200 €</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dernier entraînement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">Séance de tirs</p>
            <p className="text-sm text-muted-foreground">22 Juillet 2024</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
