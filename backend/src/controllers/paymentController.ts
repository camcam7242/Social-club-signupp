import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../services/socketService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15');

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.body;
    const customerId = req.user!.userId;

    const { rows } = await query(
      `SELECT j.*, q.price, m.stripe_account_id
       FROM jobs j
       JOIN quotes q ON q.id = j.quote_id
       JOIN mechanics m ON m.id = j.mechanic_id
       WHERE j.id = $1 AND j.customer_id = $2 AND j.status = 'completed'`,
      [jobId, customerId]
    );

    if (!rows.length) throw new AppError('Job not found or not completed', 404);
    const job = rows[0];

    if (!job.stripe_account_id) throw new AppError('Mechanic payment account not set up', 400);

    const amountCents = Math.round(parseFloat(job.price) * 100);
    const platformFeeCents = Math.round(amountCents * COMMISSION);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: job.stripe_account_id },
      metadata: { jobId, customerId },
    });

    const { rows: paymentRows } = await query(
      `INSERT INTO payments (job_id, customer_id, mechanic_id, amount, platform_fee, mechanic_payout, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        jobId,
        customerId,
        job.mechanic_id,
        job.price,
        (amountCents * COMMISSION / 100).toFixed(2),
        (amountCents * (1 - COMMISSION) / 100).toFixed(2),
        paymentIntent.id,
      ]
    );

    res.json({ clientSecret: paymentIntent.client_secret, payment: paymentRows[0] });
  } catch (err) {
    next(err);
  }
};

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature']!;
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      await query(
        `UPDATE payments SET status = 'captured', updated_at = NOW()
         WHERE stripe_payment_intent_id = $1`,
        [pi.id]
      );

      const { rows } = await query(
        'SELECT job_id FROM payments WHERE stripe_payment_intent_id = $1',
        [pi.id]
      );

      if (rows.length) {
        getIO().to(`job:${rows[0].job_id}`).emit('payment_processed', { jobId: rows[0].job_id });
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

export const createMechanicAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Always use the mechanic's own verified email — never trust client-supplied email
    const { rows: userRows } = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (!userRows.length) throw new AppError('User not found', 404);
    const email = userRows[0].email;

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: { transfers: { requested: true } },
    });

    await query(
      'UPDATE mechanics SET stripe_account_id = $1 WHERE user_id = $2',
      [account.id, userId]
    );

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/mechanic/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL}/mechanic/stripe/return`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    next(err);
  }
};
