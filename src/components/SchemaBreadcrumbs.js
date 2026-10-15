// src/components/SchemaBreadcrumbs.js
// Renders a BreadcrumbList JSON-LD script tag.
// Items: [{ name, url }] — the last item is the current page.
export default function SchemaBreadcrumbs({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...(index === items.length - 1
        ? { name: item.name }
        : { name: item.name, item: item.url }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
