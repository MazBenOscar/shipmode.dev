import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_ORG = process.env.GITHUB_ORG || 'shipmode';
const GITHUB_REPO = process.env.GITHUB_REPO || 'framework';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

// Verify request authenticity using HMAC-SHA256
function verifyRequest(payload: string, signature: string | null): boolean {
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

// Invite user to GitHub repository
async function inviteUser(
  username: string,
  permission: 'pull' | 'push' | 'admin' = 'pull'
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Use GitHub's repository invitation API
    // This sends an email invitation to the user
    const inviteResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/invitations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          invitee_id: await getUserId(username),
          permission,
        }),
      }
    );

    if (inviteResponse.status === 201) {
      return { 
        success: true, 
        message: `Invite sent to ${username}. Check your GitHub email.`,
        data: { username }
      };
    }

    if (inviteResponse.status === 422) {
      // User might already be a collaborator
      return { 
        success: true, 
        message: `${username} already has access to the repository.`,
        data: { username }
      };
    }

    const error = await inviteResponse.text();
    console.error('GitHub invite error:', error);
    return { success: false, message: 'Failed to send GitHub invite' };
  } catch (error) {
    console.error('GitHub invite error:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// Get GitHub user ID from username
async function getUserId(username: string): Promise<number | null> {
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

// Check if user is already a collaborator
async function checkCollaborator(username: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/collaborators/${encodeURIComponent(username)}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    return response.status === 204;
  } catch {
    return false;
  }
}

// GET: Check invite status (requires signature)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const signature = request.headers.get('x-shipmode-signature');

  // Verify signature
  const payload = `GET:${username || ''}`;
  if (!verifyRequest(payload, signature)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!username) {
    return NextResponse.json(
      { error: 'Username required' },
      { status: 400 }
    );
  }

  try {
    // Check if user exists
    const userId = await getUserId(username);
    if (!userId) {
      return NextResponse.json({
        status: 'not_found',
        message: 'GitHub user not found',
      }, { status: 404 });
    }

    // Check if already a collaborator
    const isCollaborator = await checkCollaborator(username);
    
    if (isCollaborator) {
      return NextResponse.json({
        status: 'active',
        message: 'You have access to the ShipMode framework',
        data: {
          repo_url: `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`,
          username,
        },
      });
    }

    return NextResponse.json({
      status: 'pending',
      message: 'Invite pending. Check your GitHub email.',
      data: { username },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

// POST: Send invite (requires signature)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-shipmode-signature');
    
    // Verify signature
    if (!verifyRequest(body, signature)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = JSON.parse(body);
    const { username, permission = 'pull' } = data;

    if (!username) {
      return NextResponse.json(
        { error: 'Username required' },
        { status: 400 }
      );
    }

    // Validate permission
    if (!['pull', 'push', 'admin'].includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission. Use: pull, push, or admin' },
        { status: 400 }
      );
    }

    const result = await inviteUser(username, permission);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}