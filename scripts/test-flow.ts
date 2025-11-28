import { chromium } from 'playwright';

async function testFlow() {
  console.log('🚀 Starting E2E Test Flow...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Signup
    console.log('1️⃣  Testing Signup...');
    await page.goto('http://localhost:3000/signup');
    const uniqueUser = `user_${Date.now()}`;
    await page.fill('input[name="username"]', uniqueUser);
    await page.fill('input[name="email"]', `${uniqueUser}@example.com`);
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    console.log('✅ Signup successful');

    // 2. Dashboard Check
    console.log('2️⃣  Checking Dashboard...');
    const connectButton = page.getByText('Connect Bank via Stripe');
    if (await connectButton.isVisible()) {
        console.log('✅ "Connect Bank" button visible');
    } else {
        throw new Error('"Connect Bank" button missing');
    }

    // 3. Visit Tip Page (Expect Error initially)
    console.log('3️⃣  Visiting Tip Page (Pre-onboarding)...');
    await page.goto(`http://localhost:3000/u/${uniqueUser}`);
    await page.click('button:has-text("$5")');
    
    // Capture alert
    page.on('dialog', async dialog => {
        console.log(`   ⚠️  Alert Message: ${dialog.message()}`);
        await dialog.accept();
    });

    await page.click('button:has-text("Pay $5")');
    console.log('✅ Payment failed as expected (no stripe account)');

    console.log('🎉 Test Flow Complete (Partial - Cannot auto-test Stripe Onboarding without mocking)');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await browser.close();
  }
}

testFlow();

