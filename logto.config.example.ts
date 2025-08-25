// LogTO Configuration for React
// Save this file as src/config/logto.ts in your React application

import { LogtoConfig } from '@logto/react';

const config: LogtoConfig = {
  endpoint:
    process.env.VITE_LOGTO_ENDPOINT ||
    process.env.REACT_APP_LOGTO_ENDPOINT ||
    '',
  appId:
    process.env.VITE_LOGTO_APP_ID || process.env.REACT_APP_LOGTO_APP_ID || '',
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
    process.env.VITE_LOGTO_API_RESOURCE ||
      process.env.REACT_APP_LOGTO_API_RESOURCE ||
      'http://localhost:3000/api',
  ],
};

export default config;
