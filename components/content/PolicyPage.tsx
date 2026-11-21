import Link from 'next/link';
import { PageHeader, PlaceholderNotice } from '@/components/ui/PageHeader';

/** Renders owner-supplied policy text. Supports "## Heading" lines and blank-line paragraphs. */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose-po">
      {blocks.map((b, i) =>
        b.startsWith('## ') ? (
          <h2 key={i}>{b.slice(3)}</h2>
        ) : b.split('\n').every((l) => l.startsWith('- ')) ? (
          <ul key={i} className="mb-4 list-disc space-y-1 pl-5 text-silver/85">
            {b.split('\n').map((l, j) => (
              <li key={j}>{l.slice(2)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b}
          </p>
        ),
      )}
    </div>
  );
}

export function PolicyPage({
  eyebrow,
  title,
  accent,
  content,
  outline,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  content: string;
  /** What the owner's policy needs to cover — shown only while the policy is missing. */
  outline: string[];
  children?: React.ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} accent={accent} />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {content.trim() ? (
          <RichText text={content} />
        ) : (
          <div className="space-y-6">
            <PlaceholderNotice>
              <strong>OWNER TO CONFIRM.</strong> This page has not been written yet. Pens Outlet will publish its own {title.toLowerCase()} {accent?.toLowerCase()} here — nothing on this page should be relied on until then. Edit it in Admin → Content.
            </PlaceholderNotice>
            <div className="glass rounded-[24px] p-6">
              <p className="label">The final page should cover</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-silver/85">
                {outline.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-titanium">
              Questions in the meantime? <Link href="/contact" className="text-champagne underline">Contact us</Link>.
            </p>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
