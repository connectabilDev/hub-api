import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || process.env.LOGTO_DOMAIN;
const LOGTO_ADMIN_API_KEY = process.env.LOGTO_ADMIN_API_KEY;

if (!LOGTO_ENDPOINT || !LOGTO_ADMIN_API_KEY) {
  console.error('Missing required environment variables');
  console.error('Please set LOGTO_ENDPOINT and LOGTO_ADMIN_API_KEY');
  process.exit(1);
}

interface SpaApplication {
  id: string;
  name: string;
  secret: string;
  type: string;
  oidcClientMetadata: {
    redirectUris: string[];
    postLogoutRedirectUris: string[];
    logoUri?: string;
  };
  customClientMetadata: {
    corsAllowedOrigins: string[];
    idTokenTtl?: number;
    refreshTokenTtl?: number;
  };
}

interface ApiResource {
  id: string;
  name: string;
  indicator: string;
  scopes?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

class LogtoSpaConfigurator {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = `${LOGTO_ENDPOINT}/api`;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOGTO_ADMIN_API_KEY}`,
    };
  }

  async createOrUpdateSpaApplication(): Promise<SpaApplication> {
    console.log('🔍 Checking for existing Hub Web application...');

    const existingApp = await this.findApplication('Hub Web');

    if (existingApp) {
      console.log('✅ Found existing Hub Web application');
      return this.updateApplication(existingApp.id);
    } else {
      console.log('📱 Creating new Hub Web application...');
      return this.createApplication();
    }
  }

  private async findApplication(name: string): Promise<SpaApplication | null> {
    try {
      const response = await fetch(`${this.baseUrl}/applications`, {
        headers: this.headers,
      });

      if (!response.ok) {
        console.error('Failed to fetch applications:', response.statusText);
        return null;
      }

      const applications = (await response.json()) as SpaApplication[];
      return applications.find((app) => app.name === name) || null;
    } catch (error) {
      console.error('Error fetching applications:', error);
      return null;
    }
  }

  private async createApplication(): Promise<SpaApplication> {
    const applicationData = {
      name: 'Hub Web',
      description: 'Hub Platform Web Application - React SPA',
      type: 'SPA',
      oidcClientMetadata: {
        redirectUris: [
          'http://localhost/callback',
          'http://localhost:3000/callback',
          'http://localhost:3001/callback',
          'http://localhost:5173/callback', // Vite default port
          'http://localhost:4200/callback', // Angular default port
          'https://hub.connectabil.com/callback',
        ],
        postLogoutRedirectUris: [
          'http://localhost',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
      },
      customClientMetadata: {
        corsAllowedOrigins: [
          'http://localhost',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
        idTokenTtl: 3600, // 1 hour
        refreshTokenTtl: 1209600, // 14 days
      },
    };

    const response = await fetch(`${this.baseUrl}/applications`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create application: ${error}`);
    }

    const application = (await response.json()) as SpaApplication;
    console.log('✅ SPA application created successfully');
    return application;
  }

  private async updateApplication(
    applicationId: string,
  ): Promise<SpaApplication> {
    const updateData = {
      oidcClientMetadata: {
        redirectUris: [
          'http://localhost:3000/callback',
          'http://localhost:3001/callback',
          'http://localhost:5173/callback',
          'http://localhost:4200/callback',
          'https://hub.connectabil.com/callback',
        ],
        postLogoutRedirectUris: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
      },
      customClientMetadata: {
        corsAllowedOrigins: [
          'http://localhost',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://localhost:4200',
          'https://hub.connectabil.com',
        ],
        idTokenTtl: 3600,
        refreshTokenTtl: 1209600,
      },
    };

    const response = await fetch(
      `${this.baseUrl}/applications/${applicationId}`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update application: ${error}`);
    }

    const application = (await response.json()) as SpaApplication;
    console.log('✅ SPA application updated successfully');
    return application;
  }

  async getApiResource(): Promise<ApiResource | null> {
    try {
      const response = await fetch(`${this.baseUrl}/resources`, {
        headers: this.headers,
      });

      if (!response.ok) {
        console.error('Failed to fetch resources:', response.statusText);
        return null;
      }

      const resources = (await response.json()) as ApiResource[];
      const hubApiResource = resources.find(
        (r) =>
          r.name === 'Hub Platform API' ||
          r.indicator === 'http://localhost:3000/api',
      );

      return hubApiResource || null;
    } catch (error) {
      console.error('Error fetching API resource:', error);
      return null;
    }
  }

  async assignApplicationToResource(applicationId: string, resourceId: string) {
    console.log('🔗 Assigning application to API resource...');

    try {
      // Get all scopes from the resource
      const resourceResponse = await fetch(
        `${this.baseUrl}/resources/${resourceId}`,
        {
          headers: this.headers,
        },
      );

      if (!resourceResponse.ok) {
        console.error('Failed to fetch resource details');
        return;
      }

      const resource = (await resourceResponse.json()) as ApiResource;
      const scopeIds = resource.scopes?.map((s) => s.id) || [];

      // Assign scopes to application
      for (const scopeId of scopeIds) {
        const response = await fetch(
          `${this.baseUrl}/applications/${applicationId}/resources/${resourceId}/scopes/${scopeId}`,
          {
            method: 'PUT',
            headers: this.headers,
          },
        );

        if (response.ok) {
          console.log(`✅ Assigned scope: ${scopeId}`);
        }
      }
    } catch (error) {
      console.error('Error assigning application to resource:', error);
    }
  }

  generateEnvFile(
    application: SpaApplication,
    apiResource: ApiResource | null,
  ) {
    const envContent = `# LogTO Configuration for Hub Web (React SPA)
# Generated by configure-spa-application.ts

# LogTO Endpoint
VITE_LOGTO_ENDPOINT=${LOGTO_ENDPOINT}
REACT_APP_LOGTO_ENDPOINT=${LOGTO_ENDPOINT}

# Application ID (public - safe to expose in frontend)
VITE_LOGTO_APP_ID=${application.id}
REACT_APP_LOGTO_APP_ID=${application.id}

# API Resource Indicator
VITE_LOGTO_API_RESOURCE=${apiResource?.indicator || 'http://localhost:3000/api'}
REACT_APP_LOGTO_API_RESOURCE=${apiResource?.indicator || 'http://localhost:3000/api'}

# Redirect URIs (configured in LogTO)
VITE_LOGTO_REDIRECT_URI=http://localhost/callback
REACT_APP_LOGTO_REDIRECT_URI=http://localhost/callback

# Post Logout Redirect URI
VITE_LOGTO_POST_LOGOUT_REDIRECT_URI=http://localhost
REACT_APP_LOGTO_POST_LOGOUT_REDIRECT_URI=http://localhost

# Available scopes (for reference)
# profile - Basic profile information
# email - Email address
# phone - Phone number
# custom_data - Custom user data
# identities - Social identities
# urn:logto:scope:organizations - Organization membership
# urn:logto:scope:organization_roles - Organization roles
# vagas:view - View job listings
# vagas:apply - Apply to jobs
# vagas:manage - Manage job listings
# mentoria:view - View mentoring sessions
# mentoria:schedule - Schedule mentoring
# mentoria:create - Create mentoring sessions
# educacao:view - View courses
# educacao:enroll - Enroll in courses
# educacao:teach - Teach courses
# comunidade:view - View community posts
# comunidade:post - Create posts
# comunidade:moderate - Moderate community
# admin:users - Manage users
# admin:workspaces - Manage workspaces
`;

    const envPath = path.join(process.cwd(), '.env.web');
    fs.writeFileSync(envPath, envContent);
    console.log(`\n📝 Environment variables saved to: ${envPath}`);

    // Also create a sample React configuration file
    const reactConfigContent = `// LogTO Configuration for React
// Save this file as src/config/logto.ts in your React application

import { LogtoConfig } from '@logto/react';

const config: LogtoConfig = {
  endpoint: process.env.VITE_LOGTO_ENDPOINT || process.env.REACT_APP_LOGTO_ENDPOINT || '',
  appId: process.env.VITE_LOGTO_APP_ID || process.env.REACT_APP_LOGTO_APP_ID || '',
  scopes: [
    // User information scopes
    'profile',
    'email',
    'phone',
    'custom_data',
    'identities',
    'urn:logto:scope:organizations',
    'urn:logto:scope:organization_roles',
    
    // Application-specific scopes
    'vagas:view',
    'vagas:apply',
    'vagas:manage',
    'mentoria:view',
    'mentoria:schedule',
    'mentoria:create',
    'educacao:view',
    'educacao:enroll',
    'educacao:teach',
    'comunidade:view',
    'comunidade:post',
    'comunidade:moderate',
  ],
  resources: [
    process.env.VITE_LOGTO_API_RESOURCE || process.env.REACT_APP_LOGTO_API_RESOURCE || 'http://localhost:3000/api',
  ],
};

export default config;
`;

    const configPath = path.join(process.cwd(), 'logto.config.example.ts');
    fs.writeFileSync(configPath, reactConfigContent);
    console.log(`📝 React configuration example saved to: ${configPath}`);
  }

  printInstructions(application: SpaApplication) {
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SPA Application Configuration Complete!');
    console.log('='.repeat(50));

    console.log('\n📋 Application Details:');
    console.log(`   Name: ${application.name}`);
    console.log(`   Type: ${application.type}`);
    console.log(`   ID: ${application.id}`);

    console.log('\n🔗 Configured URLs:');
    console.log('   Redirect URIs:');
    application.oidcClientMetadata.redirectUris.forEach((uri) => {
      console.log(`      - ${uri}`);
    });

    console.log('\n   Post-Logout URIs:');
    application.oidcClientMetadata.postLogoutRedirectUris.forEach((uri) => {
      console.log(`      - ${uri}`);
    });

    console.log('\n   CORS Origins:');
    application.customClientMetadata.corsAllowedOrigins.forEach((origin) => {
      console.log(`      - ${origin}`);
    });

    console.log('\n📚 Next Steps:');
    console.log('1. Copy .env.web to your React application as .env');
    console.log('2. Install LogTO React SDK: npm install @logto/react');
    console.log(
      '3. Use the example configuration from logto.config.example.ts',
    );
    console.log('4. Wrap your app with LogtoProvider:');
    console.log(`
   import { LogtoProvider } from '@logto/react';
   import config from './config/logto';
   
   function App() {
     return (
       <LogtoProvider config={config}>
         <YourAppContent />
       </LogtoProvider>
     );
   }
`);
    console.log('5. Use useLogto hook for authentication:');
    console.log(`
   import { useLogto } from '@logto/react';
   
   function LoginButton() {
     const { signIn, signOut, isAuthenticated } = useLogto();
     
     return isAuthenticated ? (
       <button onClick={() => signOut()}>Sign Out</button>
     ) : (
       <button onClick={() => signIn('http://localhost:3000/callback')}>
         Sign In
       </button>
     );
   }
`);
  }
}

async function main() {
  console.log('🚀 Starting LogTO SPA Application Configuration');
  console.log('='.repeat(50));

  const configurator = new LogtoSpaConfigurator();

  try {
    // Create or update SPA application
    const application = await configurator.createOrUpdateSpaApplication();

    // Get API resource
    const apiResource = await configurator.getApiResource();

    if (apiResource) {
      // Assign application to API resource
      await configurator.assignApplicationToResource(
        application.id,
        apiResource.id,
      );
    } else {
      console.warn(
        '⚠️  No API resource found. You may need to run configure-api-resources.ts first',
      );
    }

    // Generate environment file
    configurator.generateEnvFile(application, apiResource);

    // Print instructions
    configurator.printInstructions(application);

    console.log('\n✅ SPA application configuration completed successfully!');
  } catch (error) {
    console.error('\n❌ Configuration failed:', error);
    process.exit(1);
  }
}

// Run the configuration
main().catch(console.error);
