import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUser, connectStripeAccount } from '@/app/actions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage(props: { searchParams: Promise<{ code?: string }> }) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get('tiptip_userId')?.value;

  if (!userId) {
    redirect('/signup');
  }

  // Handle Stripe Connect callback
  if (searchParams.code) {
    await connectStripeAccount(searchParams.code, userId);
    redirect('/dashboard');
  }

  const user = await getUser(userId);
  
  if (!user) {
    redirect('/signup');
  }

  return <DashboardClient user={user} />;
}

