'use client';

import { saveCategory } from '@/actions/admin/products';
import type { Category } from '@/lib/db/schema';
import { AdminForm, Field, SubmitButton, Toggle } from './ui';

export function CategoryForm({ category }: { category?: Category }) {
  const c = category;
  return (
    <AdminForm action={saveCategory} className="grid gap-4 sm:grid-cols-2">
      {(pending) => (
        <>
          <input type="hidden" name="id" value={c?.id ?? ''} />
          <Field label="Name" name="name" defaultValue={c?.name} required />
          <Field label="URL slug" name="slug" defaultValue={c?.slug} hint="Leave blank to generate" />
          <Field className="sm:col-span-2" as="textarea" rows={2} label="Description" name="description" defaultValue={c?.description ?? ''} />
          <Field as="select" label="Products in this collection" name="rule" defaultValue={c?.rule ?? 'manual'}>
            <option value="manual">Products assigned to it</option>
            <option value="on_sale">Automatic — products on sale</option>
            <option value="new_arrival">Automatic — new arrivals</option>
            <option value="bestseller">Automatic — bestsellers</option>
            <option value="featured">Automatic — featured</option>
          </Field>
          <Field label="Sort order" name="sortOrder" type="number" min={0} defaultValue={c?.sortOrder ?? 0} />
          <Field label="Image URL" name="imageUrl" defaultValue={c?.imageUrl ?? ''} hint="Or upload a new image below" />
          <Field label="Image description (alt text)" name="imageAlt" defaultValue={c?.imageAlt ?? ''} />
          <div className="sm:col-span-2">
            <label className="label" htmlFor="cat-image">
              Upload image
            </label>
            <input id="cat-image" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" className="text-sm text-silver file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-paper" />
          </div>
          <Field label="Meta title" name="seoTitle" defaultValue={c?.seoTitle ?? ''} />
          <Field label="Meta description" name="seoDescription" defaultValue={c?.seoDescription ?? ''} />
          <Toggle label="Show on homepage" name="showOnHomepage" defaultChecked={c?.showOnHomepage ?? true} />
          <Toggle label="Placeholder content" name="isPlaceholder" defaultChecked={c?.isPlaceholder ?? false} />
          <div className="sm:col-span-2">
            <SubmitButton pending={pending}>{c ? 'Save collection' : 'Create collection'}</SubmitButton>
          </div>
        </>
      )}
    </AdminForm>
  );
}
