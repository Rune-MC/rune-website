export const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
export const GITHUB_USER_URL = "https://api.github.com/user";
export const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

const SCOPES = "read:user user:email";

export function isGithubConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );
}

function clientCreds(): { id: string; secret: string } {
  const id = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!id || !secret) throw new Error("GitHub OAuth not configured");
  return { id, secret };
}

export function buildAuthorizeUrl(opts: {
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: clientCreds().id,
    redirect_uri: opts.redirectUri,
    scope: SCOPES,
    state: opts.state,
    allow_signup: "true",
  });
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

export interface GithubProfile {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
}

export async function exchangeCodeForToken(opts: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const { id, secret } = clientCreds();
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: id,
      client_secret: secret,
      code: opts.code,
      redirect_uri: opts.redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`GitHub token exchange failed: ${res.status}`);
  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "Missing token");
  }
  return data.access_token;
}

export async function fetchGithubProfile(
  accessToken: string,
): Promise<GithubProfile> {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "rune-website",
  };

  const userRes = await fetch(GITHUB_USER_URL, { headers });
  if (!userRes.ok) {
    throw new Error(`Failed to fetch GitHub user: ${userRes.status}`);
  }
  const user = (await userRes.json()) as {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string | null;
    email: string | null;
  };

  let email = user.email;
  if (!email) {
    // User has no public email; pull the verified primary from /user/emails.
    const emailsRes = await fetch(GITHUB_EMAILS_URL, { headers });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      email =
        emails.find((e) => e.primary && e.verified)?.email ??
        emails.find((e) => e.verified)?.email ??
        null;
    }
  }

  return {
    id: user.id,
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    email,
  };
}
