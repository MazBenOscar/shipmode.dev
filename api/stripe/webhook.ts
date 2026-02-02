import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Configuration
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_ORG = process.env.GITHUB_ORG || 'shipmode';
const GITHUB_REPO = process.env.GITHUB_REPO || 'framework';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

// Stripe webhook event types we care about
type StripeEventType = 'checkout.session.completed' | 'payment_intent.succeeded';

// Verify Stripe webhook signature
function verifyStripeSignature(payload: string, signature: string): { valid: boolean; event?: any } {
  try {
    // Stripe sends the signature in the format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const tElement = elements.find(e => e.startsWith('t='));
    const v1Element = elements.find(e => e.startsWith('v1='));
    
    if (!tElement || !v1Element) {
      return { valid: false };
    }
    
    const timestamp = tElement.replace('t=', '');
    const sig = v1Element.replace('v1=', '');
    
    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSig = crypto
      .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');
    
    // Use timing-safe comparison
    const sigBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expectedSig);
    
    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false };
    }
    
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false };
    }
    
    // Parse the event
    const event = JSON.parse(payload);
    return { valid: true, event };
  } catch (error) {
    console.error('Stripe signature verification error:', error);
    return { valid: false };
  }
}

// Verify ShipMode internal signature for GitHub API calls
function verifyShipModeSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// Get GitHub user ID from username
async function getGitHubUserId(username: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.id;
  } catch {
    return null;
  }
}

// Invite user to GitHub repository
async function inviteToGitHub(
  username: string,
  permission: 'pull' | 'push' | 'admin' = 'pull'
): Promise<{ success: boolean; message: string }> {
  try {
    const userId = await getGitHubUserId(username);
    
    if (!userId) {
      return { success: false, message: `GitHub user "${username}" not found` };
    }
    
    // Use repository invitations API
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/invitations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          invitee_id: userId,
          permission,
        }),
      }
    );
    
    if (response.status === 201) {
      return { 
        success: true, 
        message: `GitHub invite sent to @${username}. Check your GitHub email.`
      };
    }
    
    if (response.status === 422) {
      // User might already have access
      return { 
        success: true, 
        message: `@${username} already has access to the repository.`
      };
    }
    
    const error = await response.text();
    console.error('GitHub invite error:', error);
    return { success: false, message: 'Failed to send GitHub invite' };
  } catch (error) {
    console.error('GitHub invite error:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    // Verify Stripe signature
    const { valid, event } = verifyStripeSignature(payload, signature);
    
    if (!valid) {
      console.error('Invalid Stripe signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Handle the event
    const eventType = event.type as StripeEventType;
    
    if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
      const session = event.data.object;
      
      // Extract customer info
      const customerEmail = session.customer_email || 
        session.metadata?.email ||
        session.customer_details?.email;
      
      const username = session.metadata?.github_username || 
        session.customer_details?.name?.toLowerCase().replace(/\s+/g, '-');
      
      if (!customerEmail || !username) {
        console.error('Missing customer info:', { customerEmail, username });
        return NextResponse.json(
          { error: 'Missing customer information' },
          { status: 400 }
        );
      }
      
      // Send GitHub invite
      const inviteResult = await inviteToGitHub(username, 'pull');
      
      console.log(`Processed payment for ${customerEmail}, invite result: ${inviteResult.message}`);
      
      return NextResponse.json({
        received: true,
        customer_email: customerEmail,
        github_username: username,
        invite_status: inviteResult.success ? 'sent' : 'failed',
        message: inviteResult.message,
      });
    }
    
    // Ignore other event types
    return NextResponse.json({ received: true, ignored: eventType });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}