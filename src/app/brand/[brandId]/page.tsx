import { notFound } from "next/navigation";
import { Builder } from "@/components/builder";
import { getBrandConfig } from "@/lib/brands";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = getBrandConfig(brandId);

  if (!brand) notFound();

  return <Builder brandId={brand.id} />;
}
