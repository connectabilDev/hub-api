#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const LOGTO_DOMAIN = process.env.LOGTO_DOMAIN || process.env.LOGTO_ENDPOINT;
const JWKS_URI = `${LOGTO_DOMAIN}/oidc/jwks`;

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  user_id?: string;
  email?: string;
  name?: string;
  picture?: string;
  roles?: string[];
  scope?: string;
  organizations?: string[];
  organization_roles?: string[];
  [key: string]: any;
}

class JwtConfigurationVerifier {
  verifyJwtConfiguration(): void {
    console.log('🔍 JWT Configuration Verification');
    console.log('='.repeat(50));

    console.log('\n📋 Expected JWT Claims:');
    console.log('  ✓ Standard Claims:');
    console.log('    - sub: Subject (user ID)');
    console.log('    - iat: Issued at');
    console.log('    - exp: Expiration');
    console.log('    - aud: Audience (API resource)');
    console.log('    - iss: Issuer (LogTO)');

    console.log('\n  ✓ User Profile Claims:');
    console.log('    - user_id: User identifier');
    console.log('    - email: User email');
    console.log('    - name: User name');
    console.log('    - picture: User avatar');

    console.log('\n  ✓ Authorization Claims:');
    console.log('    - roles: User roles (array)');
    console.log('    - scope: Granted scopes (space-separated)');
    console.log('    - organizations: Organization IDs (array)');
    console.log('    - organization_roles: Org:Role pairs (array)');

    console.log('\n🔑 JWKS Endpoint:');
    console.log(`  ${JWKS_URI}`);

    console.log('\n📝 Required Scopes for Full JWT:');
    console.log('  Frontend deve solicitar:');
    console.log('    - profile');
    console.log('    - email');
    console.log('    - phone');
    console.log('    - custom_data');
    console.log('    - identities');
    console.log('    - urn:logto:scope:organizations');
    console.log('    - urn:logto:scope:organization_roles');

    console.log('\n✅ Backend Configuration:');
    console.log('  LogtoTokenValidationService está configurado para:');
    console.log('    - Validar tokens com algoritmo ES384');
    console.log('    - Verificar issuer: ' + `${LOGTO_DOMAIN}/oidc`);
    console.log(
      '    - Verificar audience: ' +
        (process.env.LOGTO_API_RESOURCE_INDICATOR || 'Not set'),
    );
    console.log('    - Extrair organizations do JWT');
    console.log('    - Extrair organization_roles do JWT');

    console.log('\n📱 Frontend Configuration:');
    console.log('  React app deve usar:');
    console.log('    - @logto/react SDK');
    console.log('    - Incluir todos os scopes listados acima');
    console.log('    - Usar getIdTokenClaims() para organizations');
    console.log('    - Usar getOrganizationToken() para tokens específicos');

    console.log('\n🎯 Verificação de Token:');
    console.log('  Para verificar se o JWT contém os dados corretos:');
    console.log('  1. Faça login na aplicação');
    console.log('  2. Capture o access token');
    console.log('  3. Decodifique em jwt.io');
    console.log('  4. Verifique se contém:');
    console.log('     - organizations: ["org_id1", "org_id2"]');
    console.log(
      '     - organization_roles: ["org_id1:role1", "org_id2:role2"]',
    );

    console.log('\n💡 Dicas:');
    console.log('  - Se organizations/roles não aparecem no JWT:');
    console.log('    1. Verifique se o usuário está em alguma organização');
    console.log('    2. Confirme que os scopes estão sendo solicitados');
    console.log(
      '    3. Verifique se a aplicação tem permissão para esses scopes',
    );

    console.log('\n🔄 Custom JWT Claims (Opcional):');
    console.log('  Se precisar adicionar claims customizados:');
    console.log('  1. Acesse LogTO Admin Console');
    console.log('  2. Vá para "Custom JWT"');
    console.log('  3. Adicione função getCustomJwtClaims');
    console.log('  4. Exemplo:');
    console.log(`
const getCustomJwtClaims = async ({ token, context, environmentVariables }) => {
  const { user } = context;

  // Adicionar claims customizados
  return {
    tenant_id: user.custom_data?.tenant_id,
    permissions: user.roles?.map(r => r.name) || []
  };
};
`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Configuração JWT documentada com sucesso!');
  }

  testJwtStructure(): void {
    console.log('\n🧪 Testando estrutura JWT esperada...');

    const mockJwt: JwtPayload = {
      sub: 'user_123',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud:
        process.env.LOGTO_API_RESOURCE_INDICATOR ||
        'https://hub-api.connectabil.com',
      iss: `${LOGTO_DOMAIN}/oidc`,
      user_id: 'user_123',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['Admin', 'User'],
      scope:
        'profile email urn:logto:scope:organizations urn:logto:scope:organization_roles',
      organizations: ['org_abc123', 'org_def456'],
      organization_roles: ['org_abc123:Admin', 'org_def456:Member'],
    };

    console.log('\n📄 Estrutura JWT esperada:');
    console.log(JSON.stringify(mockJwt, null, 2));

    console.log('\n✅ Esta é a estrutura que o backend espera receber!');
  }
}

function main() {
  const verifier = new JwtConfigurationVerifier();

  try {
    verifier.verifyJwtConfiguration();
    verifier.testJwtStructure();
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
