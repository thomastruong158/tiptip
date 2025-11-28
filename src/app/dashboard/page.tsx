import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUser } from '@/app/actions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('tiptip_userId')?.value;

  if (!userId) {
    redirect('/signup');
  }

  const user = await getUser(userId);
  
  if (!user) {
    redirect('/signup');
  }

  return <DashboardClient user={user} />;
}

