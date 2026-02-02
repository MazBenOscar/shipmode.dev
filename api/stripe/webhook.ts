import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Configuration (from environment variables)
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const GITHUB_ORG = process.env.GITHUB_ORG || 'shipmode';
const GITHUB_REPO = process.env.GITHUB_REPO || 'framework';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      customer_email?: string;
      metadata?: {
        email?: string;
      };
      subscription?: {
        customer_email?: string;
      };
    };
  };
}

interface GitHubInviteResponse {
  id: number;
  node_id: string;
  login: string;
}

// Verify Stripe webhook signature
function verifyStripeSignature(
  payload: string,
  signature: string
): StripeEvent | null {
  try {
    const event = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const signedPayload = `${event.id}${event.type}${event.data.object.id}`;

    const expectedSignature = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    return event as unknown as StripeEvent;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return null;
  }
}

// Invite user to GitHub repo
async function inviteUserToGitHub(email: string): Promise<GitHubInviteResponse | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/collaborators/${email}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permission: 'read',
          invitee_id: undefined, // GitHub will lookup by email
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub invite failed:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub invite error:', error);
    return null;
  }
}

// Handle checkout.session.completed event
async function handleCheckoutComplete(event: StripeEvent): Promise<void> {
  const email = 
    event.data.object.customer_email ||
    event.data.object.metadata?.email ||
    event.data.object.subscription?.customer_email;

  if (!email) {
    console.error('No email found in payment event');
    return;
  }

  console.log(`Processing payment for: ${email}`);

  const invite = await inviteUserToGitHub(email);
  
  if (invite) {
    console.log(`✅ Successfully invited ${email} to GitHub repo`);
  } else {
    console.error(`❌ Failed to invite ${email}`);
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const event = verifyStripeSignature(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event);
        break;
      
      case 'invoice.payment_succeeded':
        // Handle subscription renewals if applicable
        console.log('Subscription payment succeeded');
        break;
      
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        console.log('Subscription cancelled');
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
