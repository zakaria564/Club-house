
"use client"

import * as React from "react"
import { Player, StatEvent } from "@/types"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Trash2, PlusCircle } from "lucide-react"
import { Label } from "./ui/label"

interface MatchStatsFormProps {
    title: string;
    stats: StatEvent[];
    onStatsChange: (stats: StatEvent[]) => void;
    players: Player[];
}

export function MatchStatsForm({ title, stats, onStatsChange, players }: MatchStatsFormProps) {

    const handleAddStat = () => {
        const currentStats = Array.isArray(stats) ? stats : [];
        onStatsChange([...currentStats, { playerId: "", count: 1 }]);
    }

    const handleRemoveStat = (index: number) => {
        const currentStats = Array.isArray(stats) ? stats : [];
        const newStats = [...currentStats];
        newStats.splice(index, 1);
        onStatsChange(newStats);
    }

    const handleStatChange = (index: number, field: keyof StatEvent, value: string | number) => {
        const currentStats = Array.isArray(stats) ? stats : [];
        const newStats = [...currentStats];
        if (field === 'count') {
            newStats[index] = { ...newStats[index], [field]: Math.max(1, Number(value)) };
        } else {
            newStats[index] = { ...newStats[index], [field]: String(value) };

        }
        onStatsChange(newStats);
    }

    const safeStats = Array.isArray(stats) ? stats : [];

    return (
        <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                 <Label className="font-semibold">{title}</Label>
                 <Button type="button" variant="outline" size="sm" onClick={handleAddStat}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter
                </Button>
            </div>
           
            <div className="space-y-2">
                {safeStats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Select value={stat.playerId} onValueChange={(value) => handleStatChange(index, 'playerId', value)}>
                             <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un joueur" />
                            </SelectTrigger>
                            <SelectContent>
                                {players.map(player => (
                                    <SelectItem key={player.id} value={player.id}>{player.firstName} {player.lastName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            min="1"
                            value={stat.count}
                            onChange={(e) => handleStatChange(index, 'count', e.target.value)}
                            className="w-20"
                        />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveStat(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {safeStats.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">Aucun {title.toLowerCase()} enregistré.</p>
                )}
            </div>
        </div>
    )
}
