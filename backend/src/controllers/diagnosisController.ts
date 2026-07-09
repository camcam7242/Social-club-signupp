import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const DIAGNOSIS_SCHEMA = {
  type: 'object',
  properties: {
    likely_problem: { type: 'string', description: 'The most likely issue in plain language' },
    confidence: { type: 'integer', description: 'Confidence score 0-100' },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
    explanation: { type: 'string', description: 'Short plain-language explanation for the customer' },
    parts_needed: {
      type: 'array',
      description: 'Parts likely required for the repair',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          search_term: { type: 'string', description: 'Best term to search for this part online' },
        },
        required: ['name', 'search_term'],
        additionalProperties: false,
      },
    },
    recommended_tier: { type: 'string', enum: ['basic', 'certified', 'master'] },
    safe_to_drive: { type: 'boolean' },
  },
  required: ['likely_problem', 'confidence', 'severity', 'explanation', 'parts_needed', 'recommended_tier', 'safe_to_drive'],
  additionalProperties: false,
};

export const diagnose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symptoms, make, model, year } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
      res.status(400).json({ error: 'Please describe what is wrong with the vehicle.' });
      return;
    }
    if (symptoms.length > 2000) {
      res.status(400).json({ error: 'Description too long (2000 char max).' });
      return;
    }

    const vehicle = [year, make, model].filter(Boolean).join(' ') || 'an unspecified vehicle';

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      output_config: { format: { type: 'json_schema', schema: DIAGNOSIS_SCHEMA } },
      system:
        'You are an expert automotive diagnostic assistant for a mobile mechanic marketplace. ' +
        'Given a customer description of vehicle symptoms, provide the most likely diagnosis, a ' +
        'calibrated confidence score, the parts a mechanic would likely need, which mechanic tier ' +
        'should handle it (basic = no cert, certified = ASE, master = advanced/diesel), and whether ' +
        'the car is safe to drive. Be honest about uncertainty — lower the confidence score when the ' +
        'symptoms are vague. This is guidance only, not a guaranteed diagnosis.',
      messages: [
        {
          role: 'user',
          content: `Vehicle: ${vehicle}\nSymptoms: ${symptoms.trim()}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(502).json({ error: 'Diagnosis unavailable, please try again.' });
      return;
    }

    const diagnosis = JSON.parse(textBlock.text);
    res.json(diagnosis);
  } catch (e: any) {
    console.error('Diagnosis error', e?.message || e);
    res.status(500).json({ error: 'Could not generate a diagnosis right now. Please try again.' });
  }
};
