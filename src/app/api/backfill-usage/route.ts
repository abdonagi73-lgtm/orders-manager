import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, incrementUsage } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin');
  if(pin !== process.env.OWNER_PIN) return NextResponse.json({error:'unauthorized'},{status:401});

  const items = await getAllItems();
  const usageMap: Record<string, Record<string,number>> = {
    vendors:{}, categories:{}, colors:{}, sizes:{}
  };

  items.forEach(item => {
    // Count vendors
    if(item.vendor) usageMap.vendors[item.vendor] = (usageMap.vendors[item.vendor]||0) + 1;
    // Count categories
    if(item.category) usageMap.categories[item.category] = (usageMap.categories[item.category]||0) + 1;
    // Count colors (unique per item)
    const uniqueColors = [...new Set(item.colors||[])];
    uniqueColors.forEach(c => { if(c) usageMap.colors[c] = (usageMap.colors[c]||0) + 1; });
    // Count sizes (unique per item)
    const uniqueSizes = [...new Set((item.sizes||[]).map(String))];
    uniqueSizes.forEach(s => { if(s) usageMap.sizes[s] = (usageMap.sizes[s]||0) + 1; });
  });

  // Build usage items list
  const usageItems: {type:string,name:string}[] = [];
  Object.entries(usageMap).forEach(([type, counts]) => {
    Object.entries(counts).forEach(([name, count]) => {
      for(let i=0; i<count; i++) usageItems.push({type,name});
    });
  });

  await incrementUsage(usageItems);

  return NextResponse.json({
    ok: true,
    items_processed: items.length,
    vendors: Object.keys(usageMap.vendors).length,
    categories: Object.keys(usageMap.categories).length,
    colors: Object.keys(usageMap.colors).length,
    sizes: Object.keys(usageMap.sizes).length,
  });
}
