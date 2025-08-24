#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createHmac } from 'crypto';

interface TestWebhookOptions {
  url: string;
  signingKey: string;
  payload: any;
}

async function testWebhook(options: TestWebhookOptions): Promise<void> {
  const { url, signingKey, payload } = options;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;

  const signature = `v1=${createHmac('sha256', signingKey)
    .update(signedPayload, 'utf8')
    .digest('hex')}`;

  console.log('Testing webhook:', url);
  console.log('Payload:', payloadString);
  console.log('Signature:', signature);
  console.log('Timestamp:', timestamp);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'logto-signature-sha-256': signature,
        'logto-timestamp': timestamp,
      },
      body: payloadString,
    });

    console.log('Response Status:', response.status);
    console.log(
      'Response Headers:',
      Object.fromEntries(response.headers.entries()),
    );

    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Webhook test error:', error);
  }
}

const testPayload = {
  hookId: 'hook_test_123',
  event: 'User.Created',
  createdAt: new Date().toISOString(),
  data: {
    id: 'user_test_123',
    username: 'testuser',
    primaryEmail: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profile: {
      givenName: 'Test',
      familyName: 'User',
      email: 'test@example.com',
    },
  },
};

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const signingKey = process.env.LOGTO_WEBHOOK_SIGNING_KEY;

if (!signingKey) {
  console.error(
    '❌ LOGTO_WEBHOOK_SIGNING_KEY environment variable is required',
  );
  process.exit(1);
}

testWebhook({
  url: `${backendUrl}/api/webhooks/logto/user-created`,
  signingKey,
  payload: testPayload,
}).catch(console.error);
