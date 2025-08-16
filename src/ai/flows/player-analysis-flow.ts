'use server';
/**
 * @fileOverview A player performance analysis AI agent.
 *
 * - analyzePlayerPerformance - A function that handles the player performance analysis.
 * - PlayerAnalysisInput - The input type for the analyzePlayerPerformance function.
 * - PlayerAnalysisOutput - The return type for the analyzePlayerPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlayerAnalysisInputSchema = z.object({
  playerName: z.string().describe("The full name of the player."),
  playerCategory: z.string().describe("The age category of the player (e.g., U17, Senior)."),
  playerPosition: z.string().describe("The position the player plays (e.g., Attaquant de pointe)."),
  matchesPlayed: z.number().describe("The total number of matches the player has participated in."),
  goalsScored: z.number().describe("The total number of goals scored by the player."),
  assistsMade: z.number().describe("The total number of assists made by the player."),
});
export type PlayerAnalysisInput = z.infer<typeof PlayerAnalysisInputSchema>;

const PlayerAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A concise performance analysis paragraph written in French."),
});
export type PlayerAnalysisOutput = z.infer<typeof PlayerAnalysisOutputSchema>;


const prompt = ai.definePrompt({
  name: 'playerAnalysisPrompt',
  input: {schema: PlayerAnalysisInputSchema},
  output: {schema: PlayerAnalysisOutputSchema},
  prompt: `Tu es un analyste sportif expert et un entraîneur de football expérimenté. Ta mission est de fournir une analyse de performance concise et constructive pour un joueur, en français.

Informations sur le joueur :
- Nom : {{{playerName}}}
- Catégorie : {{{playerCategory}}}
- Poste : {{{playerPosition}}}

Statistiques de la saison :
- Matchs joués : {{{matchesPlayed}}}
- Buts marqués : {{{goalsScored}}}
- Passes décisives : {{{assistsMade}}}

Instructions :
1. Rédige une analyse de 1 à 3 phrases.
2. Commence par une observation générale basée sur les statistiques.
3. Identifie un point fort clair (par exemple, "semble être un finisseur efficace", "a un bon sens du jeu et de la passe").
4. Suggère un axe d'amélioration ou un point à surveiller (par exemple, "pourrait améliorer sa régularité", "devrait chercher à être plus impliqué dans la construction du jeu").
5. Le ton doit être encourageant et professionnel.

Exemple de format de réponse :
"Avec {{goalsScored}} buts en {{matchesPlayed}} matchs, {{playerName}} montre un réel potentiel offensif. Son principal atout est sa capacité à se trouver en bonne position pour marquer. Pour passer au niveau supérieur, il pourrait se concentrer sur sa contribution défensive lorsque l'équipe n'a pas le ballon."

Génère l'analyse pour le joueur ci-dessus.`,
});

export async function analyzePlayerPerformance(input: PlayerAnalysisInput): Promise<PlayerAnalysisOutput> {
    const {output} = await prompt(input);
    return output!;
}
