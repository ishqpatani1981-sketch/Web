import Link from 'next/link';
import { CheckCircle2, Circle, Rocket } from 'lucide-react';
import { requirePermission } from '@/lib/auth/session';
import { computeLaunchChecks, type LaunchGroup } from '@/lib/launch';
import { Card, PageTitle } from '@/components/admin/ui';

export const metadata = { title: 'Launch checklist' };

const GROUPS: LaunchGroup[] = ['Content', 'Services & accounts', 'Launch switches'];

export default async function LaunchPage() {
  await requirePermission('settings:manage');
  const items = await computeLaunchChecks();
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  const pct = Math.round((done / required.length) * 100);
  const ready = done === required.length;

  return (
    <>
      <PageTitle
        title="Launch checklist"
        description="Everything between this preview and a live shop, checked against the site’s real state. Each item turns green on its own as you finish it."
      />
      <div className="mb-8 rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-silver">
              <Rocket className="h-4 w-4 text-champagne" /> {ready ? 'Ready to launch' : 'Preview mode'}
            </p>
            <p className="mt-3 text-4xl font-light tabular-nums text-paper" data-testid="launch-progress">
              {done} <span className="text-titanium">of {required.length} required steps done</span>
            </p>
          </div>
          <p className="max-w-sm text-sm text-titanium">
            {ready ? 'Every required step is complete. Flip the launch switches and go.' : 'Optional items are marked and never block launch.'}
          </p>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Launch readiness">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-deep via-champagne to-paper" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-6">
        {GROUPS.map((group) => {
          const rows = items.filter((i) => i.group === group);
          return (
            <Card key={group} title={`${group} · ${rows.filter((r) => r.done && !r.optional).length}/${rows.filter((r) => !r.optional).length}`}>
              <ul className="divide-y divide-white/[0.06]">
                {rows.map((i) => (
                  <li key={i.id} className="flex gap-4 py-4" data-done={i.done}>
                    {i.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Done" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-titanium" aria-label="To do" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-paper">
                        {i.label}
                        {i.optional && <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-titanium">Optional</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-silver">{i.detail}</p>
                      {!i.done && <p className="mt-1.5 text-sm text-titanium">{i.how}</p>}
                    </div>
                    {!i.done && i.href && (
                      <Link href={i.href} className="h-fit shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-silver hover:border-champagne/50 hover:text-paper">
                        Open
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
