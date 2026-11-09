import Dashboard from '@/components/dashboard';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Task board | LifeHarness' };
export default function BoardPage() {
  return <Dashboard />;
}
