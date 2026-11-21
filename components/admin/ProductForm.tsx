'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { saveProduct } from '@/actions/admin/products';
import type { Product } from '@/lib/db/schema';
import { penceToPounds } from '@/lib/utils';
import { AdminForm, Card, Field, SubmitButton, Toggle } from './ui';
import { PenArt } from '@/components/product/PenArt';

type Cat = { id: string; name: string; rule: string };

export function ProductForm({ product, categories }: { product?: Product; categories: Cat[] }) {
  const router = useRouter();
  const [images, setImages] = useState(product?.images ?? []);
  const fileInput = useRef<HTMLInputElement>(null);
  // After a save, router.refresh() brings back the stored photos (including new uploads).
  // Sync them in without remounting, so the "Product saved." message stays visible.
  const serverImages = JSON.stringify(product?.images ?? []);
  const [prevServerImages, setPrevServerImages] = useState(serverImages);
  if (prevServerImages !== serverImages) {
    setPrevServerImages(serverImages);
    setImages(product?.images ?? []);
  }
  const [specs, setSpecs] = useState(product?.specifications ?? []);
  const [previews, setPreviews] = useState<string[]>([]);
  const p = product;

  const move = (i: number, d: -1 | 1) => setImages((arr) => {
    const next = [...arr];
    const j = i + d;
    if (j < 0 || j >= next.length) return arr;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  return (
    <AdminForm action={saveProduct} className="grid gap-6 xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0" onSuccess={() => {
        setPreviews([]);
        if (fileInput.current) fileInput.current.value = '';
        router.refresh();
      }}>
      {(pending) => (
        <>
          <input type="hidden" name="id" value={p?.id ?? ''} />
          <input type="hidden" name="images" value={JSON.stringify(images)} />
          <input type="hidden" name="specifications" value={JSON.stringify(specs.filter((s) => s.label.trim() && s.value.trim()))} />

          <div className="space-y-6">
            <Card title="Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2" label="Product name" name="name" defaultValue={p?.name} required />
                <Field label="URL slug" name="slug" defaultValue={p?.slug} hint="Leave blank to generate from the name" />
                <Field label="SKU" name="sku" defaultValue={p?.sku ?? ''} />
                <Field className="sm:col-span-2" label="Short description" name="shortDescription" defaultValue={p?.shortDescription ?? ''} hint="Shown on product cards (one or two sentences)" />
                <Field className="sm:col-span-2" as="textarea" rows={7} label="Full description" name="description" defaultValue={p?.description ?? ''} />
              </div>
            </Card>

            <Card title="Photographs">
              <p className="mb-4 text-xs text-titanium">The first image is the main photo. JPEG, PNG, WebP or AVIF, up to 4 MB per upload (add one or two photos at a time). Describe each image for accessibility (alt text).</p>
              <ul className="space-y-3">
                {images.map((img, i) => (
                  <li key={img.url} className="flex items-center gap-3 rounded-xl border border-white/[0.07] p-2">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white/[0.03]">
                      <Image src={img.url} alt="" fill sizes="56px" className="object-cover" unoptimized={!img.url.startsWith('/')} />
                    </div>
                    <input value={img.alt} onChange={(e) => setImages((arr) => arr.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} placeholder="Alt text" aria-label={`Alt text for image ${i + 1}`} className="field h-10 flex-1 py-0" />
                    <div className="flex gap-1">
                      <IconBtn label="Move up" onClick={() => move(i, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn label="Move down" onClick={() => move(i, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn label="Remove image" onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </li>
                ))}
              </ul>
              {images.length === 0 && previews.length === 0 && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-dashed border-white/10 p-3 text-xs text-titanium">
                  <div className="h-16 w-14 shrink-0">
                    <PenArt colour={p?.colour} name={p?.name} penType={p?.penType} stage={false} className="h-full w-full" title="" />
                  </div>
                  No photographs yet — the storefront shows a placeholder illustration.
                </div>
              )}
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 p-6 text-sm text-silver hover:border-champagne/40">
                <Upload className="h-5 w-5 text-champagne" />
                Upload photographs
                <input
                  ref={fileInput}
                  type="file"
                  name="newImages"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => f.name))}
                />
              </label>
              {previews.length > 0 && <p className="mt-2 text-xs text-champagne">{previews.length} new file(s) will upload when you save: {previews.join(', ')}</p>}
            </Card>

            <Card title="Specifications" action={<button type="button" onClick={() => setSpecs((s) => [...s, { label: '', value: '' }])} className="flex items-center gap-1 text-xs text-champagne"><Plus className="h-3.5 w-3.5" /> Add row</button>}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Brand" name="brand" defaultValue={p?.brand ?? ''} />
                <Field label="Pen model" name="penModel" defaultValue={p?.penModel ?? ''} />
                <Field as="select" label="Pen type" name="penType" defaultValue={p?.penType ?? ''}>
                  <option value="">Not specified</option>
                  <option value="fountain">Fountain pen</option>
                  <option value="rollerball">Rollerball</option>
                  <option value="ballpoint">Ballpoint</option>
                  <option value="set">Pen set</option>
                  <option value="other">Other</option>
                </Field>
                <Field label="Colour" name="colour" defaultValue={p?.colour ?? ''} />
                <Field label="Material" name="material" defaultValue={p?.material ?? ''} />
                <Field label="Dimensions" name="dimensions" defaultValue={p?.dimensions ?? ''} />
                <Field label="Condition" name="condition" defaultValue={p?.condition ?? ''} />
                <Field label="Packaging" name="packaging" defaultValue={p?.packaging ?? ''} />
              </div>
              {specs.length > 0 && <p className="label mt-6">Additional specifications</p>}
              <ul className="space-y-2">
                {specs.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <input value={s.label} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Label (e.g. Nib size)" aria-label="Specification label" className="field h-10 py-0" />
                    <input value={s.value} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Value" aria-label="Specification value" className="field h-10 py-0" />
                    <IconBtn label="Remove row" onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Search engines">
              <div className="grid gap-4">
                <Field label="Meta title" name="seoTitle" defaultValue={p?.seoTitle ?? ''} hint="Defaults to the product name" />
                <Field as="textarea" rows={2} label="Meta description" name="seoDescription" defaultValue={p?.seoDescription ?? ''} hint="Defaults to the short description (aim for 150–160 characters)" />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Publishing">
              <div className="grid gap-4">
                <Field as="select" label="Status" name="status" defaultValue={p?.status ?? 'active'}>
                  <option value="active">Active — visible in the shop</option>
                  <option value="draft">Draft — hidden</option>
                  <option value="archived">Archived — hidden</option>
                </Field>
                <Field as="select" label="Collection" name="categoryId" defaultValue={p?.categoryId ?? ''}>
                  <option value="">No collection</option>
                  {categories
                    .filter((c) => c.rule === 'manual')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Field>
                <div className="grid gap-2">
                  <Toggle label="Featured" name="isFeatured" defaultChecked={p?.isFeatured} />
                  <Toggle label="Bestseller" name="isBestseller" defaultChecked={p?.isBestseller} />
                  <Toggle label="New arrival" name="isNewArrival" defaultChecked={p?.isNewArrival} />
                  <Toggle label="On sale" name="isOnSale" defaultChecked={p?.isOnSale} hint="Also automatic when the original price is higher" />
                  <Toggle label="Demonstration content" name="isPlaceholder" defaultChecked={p?.isPlaceholder} hint="Shows a ‘Demo’ label and keeps it out of search engines" />
                </div>
              </div>
            </Card>

            <Card title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="Price (£)" name="price" inputMode="decimal" defaultValue={penceToPounds(p?.pricePence)} hint="Leave blank for ‘price to be confirmed’ (cannot be bought)" />
                <Field label="Original price (£)" name="originalPrice" inputMode="decimal" defaultValue={penceToPounds(p?.originalPricePence)} hint="Shown struck through when higher than the price" />
                <Field label="Discount badge (optional)" name="discountLabel" defaultValue={p?.discountLabel ?? ''} hint="Overrides the automatic ‘-20%’ badge" />
              </div>
            </Card>

            <Card title="Stock">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="Stock quantity" name="stockQuantity" inputMode="numeric" defaultValue={p?.stockQuantity ?? ''} hint="Leave blank if stock is not tracked" />
                <Field label="Low-stock alert at" name="lowStockThreshold" type="number" min={0} defaultValue={p?.lowStockThreshold ?? 3} />
                <Field as="select" label="Availability" name="availability" defaultValue={p?.availability ?? 'auto'}>
                  <option value="auto">Automatic (from stock)</option>
                  <option value="in_stock">In stock</option>
                  <option value="sold_out">Sold out</option>
                  <option value="preorder">Pre-order</option>
                  <option value="coming_soon">Coming soon</option>
                </Field>
              </div>
            </Card>

            <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-white/10 bg-charcoal/90 p-3 backdrop-blur">
              <SubmitButton pending={pending}>{p ? 'Save changes' : 'Create product'}</SubmitButton>
            </div>
          </div>
        </>
      )}
    </AdminForm>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-titanium hover:text-paper">
      {children}
    </button>
  );
}
