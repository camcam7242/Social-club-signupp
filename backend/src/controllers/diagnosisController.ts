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

const QUOTE_CHECK_SCHEMA = {
  type: 'object',
  properties: {
    is_quote: { type: 'boolean', description: 'Whether the image actually shows a repair quote/estimate/invoice' },
    verdict: { type: 'string', enum: ['fair', 'slightly_high', 'overpriced', 'rip_off'] },
    total_quoted: { type: 'string', description: 'The total price found on the quote, e.g. "$742.50", or "unknown"' },
    fair_price_range: { type: 'string', description: 'Typical fair range for this work, e.g. "$350 - $500"' },
    summary: { type: 'string', description: '2-3 sentence plain-language verdict for the customer' },
    line_items: {
      type: 'array',
      description: 'Each line item found on the quote with an assessment',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string' },
          quoted_price: { type: 'string' },
          typical_price: { type: 'string' },
          assessment: { type: 'string', enum: ['fair', 'high', 'very_high', 'unnecessary'] },
        },
        required: ['item', 'quoted_price', 'typical_price', 'assessment'],
        additionalProperties: false,
      },
    },
    red_flags: {
      type: 'array',
      description: 'Warning signs found (padded labor hours, unnecessary services, vague fees)',
      items: { type: 'string' },
    },
  },
  required: ['is_quote', 'verdict', 'total_quoted', 'fair_price_range', 'summary', 'line_items', 'red_flags'],
  additionalProperties: false,
};

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type AllowedMedia = (typeof ALLOWED_MEDIA)[number];

export const checkQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image_base64, media_type } = req.body;

    if (!image_base64 || typeof image_base64 !== 'string') {
      res.status(400).json({ error: 'Please attach a photo of the quote.' });
      return;
    }
    // ~10MB base64 cap
    if (image_base64.length > 14_000_000) {
      res.status(400).json({ error: 'Image too large — please use a smaller photo.' });
      return;
    }
    const mediaType: AllowedMedia = ALLOWED_MEDIA.includes(media_type) ? media_type : 'image/jpeg';

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      output_config: { format: { type: 'json_schema', schema: QUOTE_CHECK_SCHEMA } },
      system:
        'You are a consumer advocate who analyzes auto repair quotes (from repair shops OR mobile mechanics) ' +
        'for a mobile mechanic marketplace. Read the quote in the photo, extract the line items and prices, ' +
        'and judge whether the customer is being overcharged based on typical US market rates for parts and ' +
        'labor. Compare against BOTH shop rates and mobile mechanic rates (mobile mechanics typically charge ' +
        '20-40% less since they have no shop overhead). Flag padded labor hours, unnecessary add-on services, ' +
        'vague fees, and marked-up parts. If the image is not actually a repair quote/estimate/invoice, set ' +
        'is_quote to false and say so in the summary. Be direct and honest but note that prices vary by ' +
        'region and vehicle.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image_base64 },
            },
            { type: 'text', text: 'Is this repair quote fair, or am I being ripped off?' },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(502).json({ error: 'Could not analyze the quote, please try again.' });
      return;
    }

    res.json(JSON.parse(textBlock.text));
  } catch (e: any) {
    console.error('Quote check error', e?.message || e);
    res.status(500).json({ error: 'Could not analyze the quote right now. Please try again.' });
  }
};
