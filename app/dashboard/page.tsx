export const dynamic = 'force-static';

import { redirect } from 'next/navigation';

export default function DashboardPage() {
  return redirect('/secretaria');
} 