import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../services/socketService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15');

// Mechanic's phone fetches a connection token to initialise Stripe Terminal SDK
export const createConnectionToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await stripe.terminal.connectionTokens.create();
    res.json({ secret: token.secret });
  } catch (err) {
    next(err);
  }
};

// Create a Terminal PaymentIntent — amount comes from the accepted quote
export const createTerminalPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.body;
    const userId = req.user!.userId;

    const { rows } = await query(
      `SELECT j.*, q.price, m.stripe_account_id, m.id AS mechanic_row_id
       FROM jobs j
       JOIN quotes q ON q.id = j.quote_id
       JOIN mechanics m ON m.id = j.mechanic_id
       WHERE j.id = $1
         AND m.user_id = $2
         AND j.status = 'completed'`,
      [jobId, userId]
    );

    if (!rows.length) throw new AppError('Job not found or not ready for payment', 404);
    const job = rows[0];

    if (!job.stripe_account_id) throw new AppError('Stripe account not set up', 400);

    const amountCents = Math.round(parseFloat(job.price) * 100);
    const platformFeeCents = Math.round(amountCents * COMMISSION);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: job.stripe_account_id },
      metadata: { jobId, mechanicUserId: userId },
    });

    // Store pending payment record
    await query(
      `INSERT INTO payments
         (job_id, customer_id, mechanic_id, amount, platform_fee, mechanic_payout, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        jobId,
        job.customer_id,
        job.mechanic_row_id,
        job.price,
        (amountCents * COMMISSION / 100).toFixed(2),
        (amountCents * (1 - COMMISSION) / 100).toFixed(2),
        paymentIntent.id,
      ]
    );

    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
    });
  } catch (err) {
    next(err);
  }
};

// Called by mechanic after Terminal SDK confirms payment captured
export const captureTerminalPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId, jobId } = req.body;

    await query(
      `UPDATE payments SET status = 'captured', updated_at = NOW()
       WHERE stripe_payment_intent_id = $1`,
      [paymentIntentId]
    );

    getIO().to(`job:${jobId}`).emit('payment_processed', { jobId });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
