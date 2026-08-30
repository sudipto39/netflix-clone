import { Router } from 'express';
import {
  getSubscription,
  changePlan,
  subscribe,
  updatePaymentMethod,
  updateCredentials,
  createCheckoutSession,
  createSetupIntent,
  getInvoices,
  cancelSubscription,
  changePlanSchema,
  subscribeSchema,
  updateCredentialsSchema,
  updatePaymentMethodSchema,
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

// All payment routes require a valid JWT
router.use(protect);

router.get('/subscription', getSubscription);
router.get('/invoices', getInvoices);
router.post('/subscribe', validate(subscribeSchema), subscribe);
router.post('/change-plan', validate(changePlanSchema), changePlan);

// PCI-safe: accepts Stripe paymentMethodId (not raw card data)
router.post('/update-payment', validate(updatePaymentMethodSchema), updatePaymentMethod);
router.post('/update-credentials', validate(updateCredentialsSchema), updateCredentials);
router.post('/checkout-session', validate(changePlanSchema), createCheckoutSession);

// Creates a Stripe SetupIntent so the frontend can collect card via Stripe.js Elements
router.post('/create-setup-intent', createSetupIntent);

// MF-3: Cancel subscription — schedules cancellation at end of billing period
router.post('/cancel-subscription', cancelSubscription);

export default router;
