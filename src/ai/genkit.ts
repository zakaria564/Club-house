import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [firebase(), googleAI({apiKey: process.env.GOOGLE_API_KEY || ''})],
  model: 'googleai/gemini-1.5-flash',
});
