import { PenArt } from '@/components/product/PenArt';
import { LinkButton } from '@/components/ui/Button';

export function EmptyBasket({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className={compact ? 'relative h-44 w-36' : 'relative h-64 w-52'}>
        <div className="absolute inset-0 animate-float">
          <PenArt colour="Champagne Gold" penType="fountain" angle={-52} className="h-full w-full" title="An empty basket" />
        </div>
      </div>
      <h2 className={compact ? 'mt-2 text-xl font-light text-paper' : 'mt-4 text-3xl font-light text-paper'}>
        Your basket awaits its <span className="font-serif italic text-champagne">first signature.</span>
      </h2>
      <p className="mt-3 max-w-xs text-sm text-titanium">Discover exceptional writing instruments, from everyday autograph pens to limited editions.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3" onClick={onNavigate}>
        <LinkButton href="/collections">Explore the collection</LinkButton>
        <LinkButton href="/offers" variant="glass">
          Special offers
        </LinkButton>
      </div>
    </div>
  );
}
