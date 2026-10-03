import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[#111111]">Add laptop</h1>
      <ProductForm existingId={null} defaults={EMPTY_PRODUCT} />
    </div>
  );
}
