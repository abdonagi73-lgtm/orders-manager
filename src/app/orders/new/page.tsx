"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, Send, Check } from "lucide-react";

interface UserContext {
  id: string;
  name: string;
  role: string;
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  currency: string;
  commissionRate: number;
}

interface Vendor {
  id: string;
  name: string;
}

interface OrderItem {
  itemCode: string;
  category: string;
  color: string;
  size: string;
  price: number;
}

const CATEGORIES = ["SHIRTS", "T-SHIRTS", "HOODIES", "SWEATERS", "PANTS", "SHORTS", "JACKETS", "ACCESSORIES"];
const COLORS = ["BLACK", "WHITE", "GRAY", "CHARCOAL", "BEIGE", "NAVY", "OLIVE", "RED"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "OS"];

export default function OrderEntryMatrixPage() {
  const router = useRouter();

  // Session context states
  const [userContext, setUserContext] = useState<{
    id: string;
    name: string;
    role: string;
    companyId: string;
    companyName: string;
    logoUrl: string | null;
    currency: string;
    commissionRate: number;
  } | null>(null);

  // Load context
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserContext(data);
        } else {
          router.push("/app");
        }
      } catch (err) {
        console.error("Failed to load user context", err);
        router.push("/app");
      }
    }
    loadSession();
  }, [router]);

  // Vendor list and states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  
  // Matrix entry items
  const [items, setItems] = useState<OrderItem[]>([
    { itemCode: "", category: CATEGORIES[0], color: COLORS[0], size: SIZES[2], price: 0 },
  ]);

  // Load vendors
  useEffect(() => {
    if (!userContext) return;
    async function loadVendors() {
      try {
        const res = await fetch("/api/vendors");
        if (res.ok) {
          const data = await res.json();
          setVendors(data);
          if (data.length > 0) {
            setSelectedVendorId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load vendors", err);
      }
    }
    loadVendors();
  }, [userContext]);

  // Calculation details
  const [totalOrderPrice, setTotalOrderPrice] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    setTotalOrderPrice(total);
    if (userContext) {
      setCalculatedCommission(total * userContext.commissionRate);
    }
  }, [items, userContext]);

  // Log out
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/app");
  };

  // Matrix rows handlers
  const handleItemFieldChange = (index: number, field: keyof OrderItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "price") {
          const num = parseFloat(value);
          return { ...item, [field]: isNaN(num) ? 0 : num };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      { itemCode: "", category: CATEGORIES[0], color: COLORS[0], size: SIZES[2], price: 0 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length === 1) {
      setItems([{ itemCode: "", category: CATEGORIES[0], color: COLORS[0], size: SIZES[2], price: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit Order
  const handleSubmitOrder = async () => {
    if (!selectedVendorId) {
      alert("SELECT A TARGET VENDOR");
      return;
    }
    
    // Validate rows
    const validItems = items.filter((it) => it.itemCode.trim() !== "" && it.price > 0);
    if (validItems.length === 0) {
      alert("ADD AT LEAST ONE VALID ITEM WITH A PRICE");
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          items: validItems.map((v) => ({
            item_code: v.itemCode,
            category: v.category,
            color: v.color,
            size: v.size,
            price: v.price,
          })),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setItems([{ itemCode: "", category: CATEGORIES[0], color: COLORS[0], size: SIZES[2], price: 0 }]);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("Failed to submit order.");
      }
    } catch (err) {
      alert("Submission connection error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!userContext) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-xs text-zinc-500 uppercase tracking-tighter">
        RESOLVING USER SESSION MATRIX...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6 font-sans">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-900 bg-zinc-950 p-4 sm:p-5 mb-6 gap-4">
        <div className="flex items-center gap-4">
          {userContext.logoUrl ? (
            <div className="max-h-9 max-w-24 overflow-hidden border border-zinc-800 p-0.5 bg-zinc-950 flex items-center justify-center">
              <img
                src={userContext.logoUrl}
                alt={userContext.companyName}
                className="max-h-8 max-w-full object-contain grayscale"
              />
            </div>
          ) : (
            <div className="w-2.5 h-2.5 bg-white" />
          )}
          <div>
            <h1 className="text-md sm:text-lg font-black tracking-tighter uppercase leading-none">
              {userContext.companyName} MATRIX CONSOLE
            </h1>
            <p className="text-zinc-500 font-mono text-[9px] tracking-widest mt-1 uppercase">
              OPERATOR: {userContext.name} ({userContext.role})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 border border-zinc-800 hover:border-red-950 hover:text-red-500 bg-black py-1.5 px-3.5 text-[10px] font-mono font-bold transition-all uppercase"
          >
            <LogOut className="w-3 h-3" />
            EXIT MATRIX
          </button>
        </div>
      </header>

      {/* Grid structure */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side columns: Table matrix */}
        <section className="lg:col-span-3 border border-zinc-900 bg-zinc-950 p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-900 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
                PRODUCT ORDER MATRIX
              </h2>
            </div>

            {/* Vendor choice dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap">
                TARGET VENDOR:
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="bg-black border border-zinc-800 text-white rounded-none py-1 px-3 text-[10px] focus:outline-none focus:border-zinc-500 font-mono uppercase w-full sm:w-44"
              >
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix table wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                  <th className="py-2 pr-2 font-medium">ITEM CODE</th>
                  <th className="py-2 px-2 font-medium">CATEGORY</th>
                  <th className="py-2 px-2 font-medium">COLOR</th>
                  <th className="py-2 px-2 font-medium">SIZE</th>
                  <th className="py-2 px-2 font-medium">PRICE</th>
                  <th className="py-2 pl-2 text-right font-medium w-16">REMOVE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/10">
                    {/* Item Code */}
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.itemCode}
                        onChange={(e) => handleItemFieldChange(idx, "itemCode", e.target.value)}
                        placeholder="E.G. ST-SH-001"
                        className="w-full bg-black border border-zinc-900 hover:border-zinc-800 focus:border-zinc-600 text-white rounded-none py-1.5 px-2 text-xs font-mono focus:outline-none uppercase"
                      />
                    </td>
                    {/* Category */}
                    <td className="py-2 px-2">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemFieldChange(idx, "category", e.target.value)}
                        className="w-full bg-black border border-zinc-900 hover:border-zinc-800 focus:border-zinc-600 text-white rounded-none py-1.5 px-2 text-xs font-mono focus:outline-none uppercase"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Color */}
                    <td className="py-2 px-2">
                      <select
                        value={item.color}
                        onChange={(e) => handleItemFieldChange(idx, "color", e.target.value)}
                        className="w-full bg-black border border-zinc-900 hover:border-zinc-800 focus:border-zinc-600 text-white rounded-none py-1.5 px-2 text-xs font-mono focus:outline-none uppercase"
                      >
                        {COLORS.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Size */}
                    <td className="py-2 px-2">
                      <select
                        value={item.size}
                        onChange={(e) => handleItemFieldChange(idx, "size", e.target.value)}
                        className="w-full bg-black border border-zinc-900 hover:border-zinc-800 focus:border-zinc-600 text-white rounded-none py-1.5 px-2 text-xs font-mono focus:outline-none uppercase"
                      >
                        {SIZES.map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Price */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.price || ""}
                        onChange={(e) => handleItemFieldChange(idx, "price", e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-black border border-zinc-900 hover:border-zinc-800 focus:border-zinc-600 text-white rounded-none py-1.5 px-2 text-xs font-mono focus:outline-none text-right"
                      />
                    </td>
                    {/* Remove button */}
                    <td className="py-2 pl-2 text-right">
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-white px-2.5 py-1 text-[10px] font-mono transition-colors"
                      >
                        DEL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleAddRow}
            className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-500 hover:bg-zinc-950 text-zinc-500 hover:text-white font-mono text-xs uppercase transition-all tracking-wider"
          >
            + ADD MATRIX ENTRY ROW
          </button>
        </section>

        {/* Right side: Calculations summary */}
        <section className="lg:col-span-1 border border-zinc-900 bg-zinc-950 p-4 sm:p-5 flex flex-col justify-between min-h-[300px]">
          <div className="flex flex-col gap-4">
            <div className="pb-3 border-b border-zinc-900">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
                BILLING ACCOUNT SUMMARY
              </h2>
            </div>

            <div className="flex flex-col gap-3 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">CLIENT CURRENCY:</span>
                <span className="font-bold">{userContext.currency}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">COMMISSION RATE:</span>
                <span className="font-bold">{(userContext.commissionRate * 100).toFixed(1)}%</span>
              </div>
              
              <div className="border-t border-zinc-900 my-2" />

              <div className="flex justify-between items-baseline">
                <span className="text-zinc-500 text-[10px]">SUBTOTAL PRICE:</span>
                <span className="text-xl font-bold font-sans">
                  {totalOrderPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-baseline text-zinc-400">
                <span className="text-[10px]">EST. SAAS COMMISSION:</span>
                <span className="text-sm font-bold font-sans">
                  {calculatedCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            {success && (
              <div className="bg-emerald-950/20 border border-emerald-900 text-emerald-500 text-[10px] font-mono p-2.5 text-center font-bold uppercase flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                ORDER REGISTERED SUCCESSFULLY
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full bg-white hover:bg-zinc-200 text-black py-3 px-4 text-xs font-mono font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              {submitting ? "RECORDING..." : "COMMIT ORDER"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
