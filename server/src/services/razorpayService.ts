import crypto from 'crypto';
import Razorpay from 'razorpay';

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_PrajnacartDemoKey123';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_PrajnacartDemoSecret456';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_PrajnacartWebhookSecret789';

export const isRazorpayLiveConfigured = (): boolean => {
  return (
    Boolean(process.env.RAZORPAY_KEY_ID) &&
    !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_PrajnacartDemo') &&
    !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_NovamartDemo')
  );
};

let razorpayInstance: Razorpay | null = null;
if (isRazorpayLiveConfigured()) {
  razorpayInstance = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
}

export interface RazorpayOrderParams {
  amount: number; // in Rupees
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export const createRazorpayOrder = async (params: RazorpayOrderParams) => {
  const amountInPaise = Math.round(params.amount * 100);

  if (razorpayInstance && isRazorpayLiveConfigured()) {
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes,
    });
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID,
      isDemo: false,
    };
  }

  // Demo simulation order when testing without external credentials
  const demoOrderId = `order_demo_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  return {
    orderId: demoOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId: KEY_ID,
    isDemo: true,
  };
};

export const verifyRazorpaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  if (!isRazorpayLiveConfigured() || razorpayOrderId.startsWith('order_demo_')) {
    // In demo mode, permit successful simulation validation
    return Boolean(razorpayPaymentId);
  }

  const generatedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

export const verifyWebhookSignature = (
  rawBody: string,
  signatureHeader: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signatureHeader;
};
