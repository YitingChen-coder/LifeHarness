import Dashboard from '@/components/dashboard';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Calendar | LifeHarness' };
export const dynamic = 'force-dynamic';
export default function BoardPage() {
  return (
    <Dashboard
      browserChatEnabled={process.env.LIFEHARNESS_BROWSER_CHAT === '1'}
    />
  );
}
