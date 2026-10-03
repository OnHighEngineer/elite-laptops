"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { saveProduct, type SaveState } from "@/app/admin/actions";
import { CATEGORIES, MAX_IMAGES } from "@/lib/admin-product";

const INPUT =
  "w-full min-h-11 px-4 py-3 border border-[#E5E5E5] rounded-xl text-base text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:ring-1 focus:ring-[#111111] bg-white";
const LABEL = "block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2";

export interface FormDefaults {
  name: string; brand: string; category: string; condition: string; price: string; originalPrice: string;
  stock: string; stockStatus: string; description: string; warrantyMonths: string; serviceMonths: string;
  warrantyNote: string; spec_processor: string; spec_ram: string; spec_storage: string; spec_graphics: string;
  spec_screen: string; spec_os: string; spec_battery: string; specsExtra: string; images: string; featured: boolean;
}

export const EMPTY_PRODUCT: FormDefaults = {
  name: "", brand: "HP", category: "Everyday", condition: "refurbished", price: "", originalPrice: "",
  stock: "1", stockStatus: "in_stock", description: "", warrantyMonths: "3", serviceMonths: "12",
  warrantyNote: "", spec_processor: "", spec_ram: "", spec_storage: "", spec_graphics: "",
  spec_screen: "", spec_os: "", spec_battery: "", specsExtra: "", images: "", featured: false,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 border border-[#E5E5E5] rounded-2xl p-5">
      <legend className="px-2 text-sm font-semibold text-[#111111]">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ProductForm({ existingId, defaults }: { existingId: string | null; defaults: FormDefaults }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProduct.bind(null, existingId), undefined);
  const [images, setImages] = useState<string[]>(defaults.images ? defaults.images.split("\n").filter(Boolean) : []);
  const [upload, setUpload] = useState<{ busy: boolean; error?: string }>({ busy: false });
  const err = state?.errors ?? {};

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUpload({ busy: true });
    const added: string[] = [];
    for (const file of files.slice(0, MAX_IMAGES - images.length)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setImages((cur) => [...cur, ...added]);
          setUpload({ busy: false, error: data.error ?? "Upload failed." });
          return;
        }
        added.push(data.url);
      } catch {
        setImages((cur) => [...cur, ...added]);
        setUpload({ busy: false, error: "Upload failed." });
        return;
      }
    }
    setImages((cur) => [...cur, ...added]);
    setUpload({ busy: false, error: files.length > MAX_IMAGES - images.length ? `Only ${MAX_IMAGES} photos are allowed.` : undefined });
  };

  const makeCover = (i: number) => setImages((cur) => [cur[i], ...cur.filter((_, j) => j !== i)]);
  const remove = (i: number) => setImages((cur) => cur.filter((_, j) => j !== i));

  const field = (
    name: keyof FormDefaults,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label htmlFor={name} className={LABEL}>{label}</label>
      <input id={name} name={name} defaultValue={String(defaults[name])} className={INPUT} {...props} />
      {err[name] && <p role="alert" className="mt-1.5 text-xs text-[#B00020]">{err[name]}</p>}
    </div>
  );

  const select = (name: keyof FormDefaults, label: string, options: [string, string][]) => (
    <div>
      <label htmlFor={name} className={LABEL}>{label}</label>
      <select id={name} name={name} defaultValue={String(defaults[name])} className={INPUT}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {err[name] && <p role="alert" className="mt-1.5 text-xs text-[#B00020]">{err[name]}</p>}
    </div>
  );

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      <Section title="Basics">
        {field("name", "Product name", { required: true, maxLength: 120, placeholder: "HP EliteBook 840 G8" })}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {field("brand", "Brand", { required: true, maxLength: 40, list: "brands" })}
          <datalist id="brands"><option>HP</option><option>Dell</option><option>Lenovo</option><option>Asus</option></datalist>
          {select("category", "Category", CATEGORIES.map((c) => [c, c]))}
          {select("condition", "Condition", [["new", "New"], ["refurbished", "Certified Refurbished"], ["open-box", "Open Box"]])}
        </div>
        <div>
          <label htmlFor="description" className={LABEL}>Description</label>
          <textarea id="description" name="description" rows={3} defaultValue={defaults.description} className={INPUT} />
          {err.description && <p role="alert" className="mt-1.5 text-xs text-[#B00020]">{err.description}</p>}
        </div>
      </Section>

      <Section title="Price and stock">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field("price", "Selling price (₹)", { inputMode: "numeric", required: true })}
          {field("originalPrice", "Original price (₹, optional)", { inputMode: "numeric" })}
          {field("stock", "Quantity", { inputMode: "numeric", required: true })}
          {select("stockStatus", "Stock status", [["in_stock", "In stock"], ["out_of_stock", "Out of stock"], ["coming_soon", "Coming soon"]])}
        </div>
      </Section>

      <Section title="Specifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field("spec_processor", "Processor", { required: true, placeholder: "Intel Core i5-1135G7" })}
          {field("spec_ram", "RAM", { required: true, placeholder: "16GB DDR4" })}
          {field("spec_storage", "Storage", { required: true, placeholder: "512GB NVMe SSD" })}
          {field("spec_graphics", "Graphics", { placeholder: "Intel Iris Xe" })}
          {field("spec_screen", "Screen", { required: true, placeholder: '14" FHD IPS' })}
          {field("spec_os", "Operating system", { placeholder: "Windows 11 Pro" })}
          {field("spec_battery", "Battery", { placeholder: "Up to 8 hours" })}
        </div>
        <div>
          <label htmlFor="specsExtra" className={LABEL}>Other features (one per line, optional)</label>
          <textarea id="specsExtra" name="specsExtra" rows={3} defaultValue={defaults.specsExtra} className={INPUT}
            placeholder={"Backlit keyboard\nFingerprint reader"} />
          {err.specsExtra && <p role="alert" className="mt-1.5 text-xs text-[#B00020]">{err.specsExtra}</p>}
        </div>
      </Section>

      <Section title="Warranty">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field("warrantyMonths", "Full warranty (months)", { inputMode: "numeric", required: true })}
          {field("serviceMonths", "Service warranty (months)", { inputMode: "numeric", required: true })}
        </div>
        <div>
          <label htmlFor="warrantyNote" className={LABEL}>Warranty policy (what is covered)</label>
          <textarea id="warrantyNote" name="warrantyNote" rows={3} defaultValue={defaults.warrantyNote} className={INPUT}
            placeholder="Covers hardware faults. Does not cover physical or liquid damage." />
          {err.warrantyNote && <p role="alert" className="mt-1.5 text-xs text-[#B00020]">{err.warrantyNote}</p>}
        </div>
      </Section>

      <Section title="Photos">
        <input type="hidden" name="images" value={images.join("\n")} />
        {images.length > 0 && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((src, i) => (
              <li key={src} className="space-y-2">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#E5E5E5] bg-[#F5F5F5]">
                  <Image src={src} alt={`Photo ${i + 1}`} fill sizes="200px" className="object-cover" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#111111] text-white text-[10px] font-semibold">Cover</span>}
                </div>
                <div className="flex gap-1.5">
                  {i !== 0 && (
                    <button type="button" onClick={() => makeCover(i)} className="flex-1 min-h-11 border border-[#E5E5E5] rounded-lg text-xs hover:bg-[#F5F5F5]">Make cover</button>
                  )}
                  <button type="button" onClick={() => remove(i)} className="flex-1 min-h-11 border border-[#E5E5E5] rounded-lg text-xs text-[#B00020] hover:bg-[#F5F5F5]">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {images.length < MAX_IMAGES && (
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFiles}
            className="block w-full text-sm min-h-11 file:mr-3 file:min-h-11 file:px-4 file:rounded-lg file:border-0 file:bg-[#111111] file:text-white" />
        )}
        <p className="text-xs text-[#666666]">Up to {MAX_IMAGES} photos. The first one is the cover shown in the shop.</p>
        {upload.busy && <p className="text-xs text-[#666666]">Uploading…</p>}
        {(upload.error || err.images) && <p role="alert" className="text-xs text-[#B00020]">{upload.error ?? err.images}</p>}
        <label className="flex items-center gap-2.5 min-h-11 text-sm text-[#111111]">
          <input type="checkbox" name="featured" defaultChecked={defaults.featured} className="w-4 h-4 accent-[#111111]" />
          Show on the home page (featured)
        </label>
      </Section>

      {state?.error && <p role="alert" className="text-sm text-[#B00020]">{state.error}</p>}
      <button type="submit" disabled={pending || upload.busy}
        className="min-h-12 px-8 bg-[#111111] text-white text-sm font-semibold rounded-xl disabled:opacity-50">
        {pending ? "Saving…" : existingId ? "Save changes" : "Add laptop"}
      </button>
    </form>
  );
}
