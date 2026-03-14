import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

async function globalSetup(config: FullConfig) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  const testEmail = process.env.TEST_USER_EMAIL!;
  const testPassword = process.env.TEST_USER_PASSWORD!;
  const authDir = path.join(__dirname, '.auth');

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error || !data.session) {
    throw new Error(`Failed to authenticate: ${error?.message || 'No session'}`);
  }

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: process.env.E2E_BASE_URL ?? 'http://localhost',
        localStorage: [
          {
            name: 'sb-auth-token',
            value: data.session.access_token,
          },
          {
            name: 'sb-user',
            value: JSON.stringify(data.user),
          },
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(authDir, 'user.json'),
    JSON.stringify(storageState, null, 2)
  );

  console.log('✅ Global setup complete: E2E user authenticated');
}

export default globalSetup;
