// src/lib/pricing.ts
// Mirrors the logic from the existing square_inventory_tool.tsx exactly.

import type { OrderItem, SessionSettings } from './types';

const WEIGHT_TABLE: Record<string, number> = {
  't-shirts': 0.25, 't-shirt': 0.25,
  'shirts': 0.33,   'shirt': 0.33,
  'pants': 0.55,
  'shorts': 0.45,
  'jeans': 0.80,
  'jacket': 0.60,
  'hoodie': 1.20,
  'sweater': 0.80,
  'knitwear': 0.95,
};
const FALLBACK_WEIGHT = 0.5;

export function getWeight(category: string): number {
  return WEIGHT_TABLE[category.toLowerCase().trim()] ?? FALLBACK_WEIGHT;
}

export function calcUnitCost(price: number, category: string, s: SessionSettings): number {
  const tax     = price * (s.tax / 100);
  const shipping = getWeight(category) * s.shipping;
  return price + tax + shipping;
}

export function calcRetailPrice(price: number, category: string, s: SessionSettings): number {
  const cost = calcUnitCost(price, category, s);
  const raw  = cost * s.markup;
  return Math.floor(raw) + 0.99;
}

function getVendorAbbr(vendor: string): string {
  const words = vendor.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase();
}

export interface SquareRow {
  'Item Name': string;
  'Variation Name': string;
  'SKU': string;
  'Description': string;
  'Categories': string;
  'Item Type': string;
  'Price': string;
  'Default Unit Cost': string;
  'Weight': string;
  'Sellable': string;
  'Stockable': string;
  'Option Name 1': string;
  'Option Value 1': string;
  'Option Name 2': string;
  'Option Value 2': string;
  'Default Vendor Name': string;
  'Default Vendor Code': string;
  'New Quantity': string;
  'Stock Alert Enabled': string;
}

export function itemToSquareRows(
  item: OrderItem,
  vendorCode: number,
  settings: SessionSettings
): SquareRow[] {
  const abbr      = getVendorAbbr(item.vendor);
  const itemName  = `${abbr}-${item.code} ${item.category}`;
  const weight    = getWeight(item.category);
  const unitCost  = calcUnitCost(item.price, item.category, settings);
  const retail    = calcRetailPrice(item.price, item.category, settings);

  const rows: SquareRow[] = [];

  // Count occurrences of each color and size (arrays may have duplicates for multi-packs)
  const colorCounts: Record<string, number> = {};
  const sizeCounts:  Record<string, number> = {};
  item.colors.forEach(c => { colorCounts[c] = (colorCounts[c] || 0) + 1; });
  item.sizes.forEach(s  => { sizeCounts[s]  = (sizeCounts[s]  || 0) + 1; });

  // Get unique colors and sizes preserving order of first appearance
  const uniqueColors = item.colors.filter((c, i) => item.colors.indexOf(c) === i);
  const uniqueSizes  = item.sizes.filter((s, i)  => item.sizes.indexOf(s)  === i);

  for (const color of uniqueColors) {
    for (const size of uniqueSizes) {
      const colorSlug = color.substring(0, 3).toUpperCase().replace(/\s/g, '');
      const sizeSlug  = String(size).toUpperCase().replace(/\s/g, '');
      const sku       = `${abbr}-${item.code}-${colorSlug}-${sizeSlug}`;
      // Variant qty = count of this color × count of this size
      const variantQty = (colorCounts[color] || 1) * (sizeCounts[size] || 1);

      rows.push({
        'Item Name':                          itemName,
        'Variation Name':                     `${color}, ${size}`,
        'SKU':                                sku,
        'Description':                        item.code,
        'Categories':                         item.category,
        'Item Type':                          'Physical',
        'Price':                              retail.toFixed(2),
        'Default Unit Cost':                  unitCost.toFixed(2),
        'Weight':                             String(weight),
        'Sellable':                           'Y',
        'Stockable':                          'Y',
        'Option Name 1':                      'Color',
        'Option Value 1':                     color,
        'Option Name 2':                      'Size',
        'Option Value 2':                     size,
        'Default Vendor Name':                item.vendor,
        'Default Vendor Code':                String(vendorCode),
        'New Quantity':                       String(variantQty),
        'Stock Alert Enabled':                'N',
      });
    }
  }

  return rows;
}

export function rowsToCSV(rows: SquareRow[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]) as (keyof SquareRow)[];
  const escape  = (v: string) =>
    v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n');
}
