import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_ORG = process.env.GITHUB_ORG || 'shipmode';
const GITHUB_REPO = process.env.GITHUB_REPO || 'framework';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

// Verify request authenticity
function verifyRequest(
  payload: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Invite user to GitHub repository
async function inviteUser(
  email: string,
  permission: 'pull' | 'push' | 'admin' = 'pull'
): Promise<{ success: boolean; message: string }> {
  try {
    // First, check if user exists on GitHub by email
    const searchResponse = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(email)}+in:email`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!searchResponse.ok) {
      return { success: false, message: 'Failed to search for GitHub user' };
    }

    const searchData = await searchResponse.json();
    
    if (searchData.total_count === 0) {
      return { 
        success: false, 
        message: 'GitHub account not found. Please sign up for GitHub first.' 
      };
    }

    const githubUsername = searchData.items[0].login;

    // Send invitation
    const inviteResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/collaborators/${githubUsername}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission }),
      }
    );

    if (!inviteResponse.ok) {
      const error = await inviteResponse.text();
      console.error('GitHub invite error:', error);
      return { success: false, message: 'Failed to send GitHub invite' };
    }

    const inviteData = await inviteResponse.json();
    
    return {
      success: true,
      message: `Invite sent to ${githubUsername}. Check your GitHub notifications.`,
      data: {
        invite_url: inviteData.html_url,
        username: githubUsername,
      },
    };
  } catch (error) {
    console.error('GitHub invite error:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// GET: Check invite status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const signature = request.headers.get('x-shipmode-signature');

  if (!email) {
    return NextResponse.json(
      { error: 'Email required' },
      { status: 400 }
    );
  }

  try {
    // Search for user
    const searchResponse = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(email)}+in:email`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: 'GitHub API error' },
        { status: 500 }
      );
    }

    const searchData = await searchResponse.json();
    
    if (searchData.total_count === 0) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No GitHub account linked to this email',
      });
    }

    // Check if already a collaborator
    const username = searchData.items[0].login;
    const collabResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/collaborators/${username}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (collabResponse.ok) {
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
      status: 'invited',
      message: 'Invite pending. Check your GitHub notifications.',
      data: {
        username,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

// POST: Send invite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, permission = 'pull' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const result = await inviteUser(email, permission);
    
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
