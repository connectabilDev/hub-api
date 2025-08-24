import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'scopes';
export const Scopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);

export const REQUIRE_ALL_SCOPES_KEY = 'requireAllScopes';
export const RequireAllScopes = () => SetMetadata(REQUIRE_ALL_SCOPES_KEY, true);
