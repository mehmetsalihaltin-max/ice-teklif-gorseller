import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Yeni Ürün</h1>
      <ProductForm />
    </div>
  );
}
