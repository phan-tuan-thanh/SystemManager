import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MS365UserInfo {
  id: string;
  mail: string | null;
  displayName: string;
  userPrincipalName: string;
}

@Injectable()
export class MS365Strategy {
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private config: ConfigService) {
    this.tenantId = config.get('MS365_TENANT_ID', 'common');
    this.clientId = config.get('MS365_CLIENT_ID', '');
    this.clientSecret = config.get('MS365_CLIENT_SECRET', '');
    this.redirectUri = config.get(
      'MS365_REDIRECT_URI',
      'http://localhost:3000/api/v1/auth/ms365/callback',
    );
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'openid profile email User.Read',
      response_mode: 'query',
    });
    if (state) params.set('state', state);
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
      scope: 'openid profile email User.Read',
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new InternalServerErrorException(`MS365 token exchange failed: ${err}`);
    }

    const tokens: { access_token: string } = await response.json();
    return tokens.access_token;
  }

  async getUserInfo(msAccessToken: string): Promise<MS365UserInfo> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${msAccessToken}` },
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to fetch Microsoft user info');
    }

    return response.json();
  }
}
