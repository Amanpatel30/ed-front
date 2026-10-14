"use client";

import { CatalogContent } from "@/components/catalog/catalog-content";

export default function CatalogClient() {
  return <CatalogContent variant="public" loginRedirectPath="/catalog" />;
}
