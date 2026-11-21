"use client";

import { useRef, useState } from "react";
import { X, Download, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useStoreSettings } from "@/lib/settings";

const money = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

export default function GstInvoiceModal({ isOpen = true, onClose, consultation, invoiceData }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const { supportPhone, supportEmail, fullAddress, gstin: storeGstin } = useStoreSettings();
  const data = consultation || invoiceData;

  if (!isOpen || !data) return null;

  const total = Number(data.amount || data.fee || 0);
  const gstRate = Number(data.gstRate !== undefined ? data.gstRate : 18);
  
  let taxable = 0;
  let totalGst = 0;
  if (gstRate > 0) {
    taxable = Math.round((total / (1 + gstRate / 100)) * 100) / 100;
    totalGst = Math.round((total - taxable) * 100) / 100;
  } else {
    taxable = total;
    totalGst = 0;
  }
  const halfGst = Math.round((totalGst / 2) * 100) / 100;

  // Rajasthan is seller state (State Code 08).
  // Intra-state (within Rajasthan) => CGST + SGST
  // Inter-state (outside Rajasthan) => IGST
  const clientState = String(data.state || "Rajasthan").trim();
  const isIntraState = !clientState || clientState.toLowerCase().includes("rajasthan");

  const invoiceNo =
    data.invoiceNumber ||
    `INV-${data.reference || data.documentNo || data._id || "APT"}`;

  const invDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const gstin = data.gstin || storeGstin || "08ABCDE1234F1Z5";
  const consultationType = data.service || data.type || "Scientific Vastu Consultation";

  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      if (typeof window !== "undefined") {
        const html2pdfModule = await import("html2pdf.js");
        const html2pdf = html2pdfModule.default || html2pdfModule;
        const element = printRef.current;

        const opt = {
          margin: [8, 8, 8, 8],
          filename: `${invoiceNo}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            onclone: (clonedDoc) => {
              // 1. Sanitize all style tags in cloned document to remove any lab/oklab colors
              const styles = clonedDoc.querySelectorAll("style");
              styles.forEach((s) => {
                if (s.textContent && (s.textContent.includes("lab(") || s.textContent.includes("oklab("))) {
                  s.textContent = s.textContent
                    .replace(/oklab\([^)]+\)/g, "rgb(24, 24, 27)")
                    .replace(/lab\([^)]+\)/g, "rgb(24, 24, 27)");
                }
              });

              // 2. Set explicit standard background & color on root elements
              clonedDoc.documentElement.style.backgroundColor = "#ffffff";
              clonedDoc.documentElement.style.color = "#18181b";
              clonedDoc.body.style.backgroundColor = "#ffffff";
              clonedDoc.body.style.color = "#18181b";

              // 3. Normalize any computed lab/oklab colors on all cloned DOM elements
              const canvas = document.createElement("canvas");
              canvas.width = 1;
              canvas.height = 1;
              const ctx = canvas.getContext("2d");

              function toSafeColor(colorStr, fallback = "#18181b") {
                if (!colorStr) return "transparent";
                if (!colorStr.includes("lab") && !colorStr.includes("oklab") && !colorStr.includes("color(") && !colorStr.includes("lch")) {
                  return colorStr;
                }
                try {
                  ctx.fillStyle = "rgba(0,0,0,0)";
                  ctx.fillStyle = colorStr;
                  const res = ctx.fillStyle;
                  if (res && !res.includes("lab") && !res.includes("oklab")) {
                    return res;
                  }
                } catch {}
                return fallback;
              }

              const colorProps = [
                "color",
                "backgroundColor",
                "borderColor",
                "borderTopColor",
                "borderRightColor",
                "borderBottomColor",
                "borderLeftColor",
                "outlineColor"
              ];

              const allElements = clonedDoc.querySelectorAll("*");
              allElements.forEach((el) => {
                try {
                  const comp = window.getComputedStyle(el);
                  for (const prop of colorProps) {
                    const val = comp[prop];
                    if (val && (val.includes("lab") || val.includes("oklab") || val.includes("color(") || val.includes("lch"))) {
                      const fallback = prop === "backgroundColor" ? "#ffffff" : "#18181b";
                      el.style[prop] = toSafeColor(val, fallback);
                    }
                  }
                } catch {}
              });
            },
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        await html2pdf().set(opt).from(element).save();
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Top Action Bar (ONLY Download PDF and Close X) */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-200 bg-[#fffcf7] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f7eedf] text-[#b9843c]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="font-serif text-sm font-bold text-zinc-900 leading-tight">
                Official GST Tax Invoice (Master Record)
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Invoice No: <span className="font-bold text-zinc-800">{invoiceNo}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-xl bg-[#b9843c] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#a2712f] disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? "Creating PDF..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable/Exportable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-[#18181b]">
          <div
            ref={printRef}
            className="p-6 sm:p-8 bg-white text-[#18181b] text-xs leading-relaxed space-y-5"
            style={{ backgroundColor: "#ffffff", color: "#18181b" }}
          >
            {/* Header */}
            <div
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5"
              style={{ borderBottom: "2px solid #18181b" }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#a56b27]">
                  Scientific Vastu Consultancy
                </span>
                <h1 className="font-serif text-2xl font-black text-[#18181b] tracking-tight sm:text-3xl">
                  Bhuwneshwari Scientific Vastu
                </h1>
                <p className="text-[#52525b] mt-1 max-w-sm">
                  Head Office: {fullAddress}<br />
                  Phone: {supportPhone} • Email: {supportEmail}
                </p>
                <div
                  className="mt-2.5 inline-flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-[11px] font-bold text-[#18181b]"
                  style={{ backgroundColor: "#f4f4f5", border: "1px solid #d4d4d8" }}
                >
                  <span>GSTIN: {gstin}</span>
                  <span className="text-[#a1a1aa]">|</span>
                  <span>State: Rajasthan (08)</span>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span
                  className="inline-block rounded-md px-3 py-1 font-serif text-xs font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: "#21150c" }}
                >
                  {gstRate > 0 ? "Tax Invoice" : "Bill of Supply"}
                </span>
                <div className="mt-3 space-y-1 font-mono text-[11px]">
                  <p><span className="text-[#71717a]">Invoice No:</span> <strong>{invoiceNo}</strong></p>
                  <p><span className="text-[#71717a]">Date:</span> <strong>{invDate}</strong></p>
                  <p><span className="text-[#71717a]">Place of Supply:</span> <strong>{clientState} {isIntraState ? "(Intra-state)" : "(Inter-state)"}</strong></p>
                  <p><span className="text-[#71717a]">Reverse Charge:</span> <strong>No</strong></p>
                </div>
              </div>
            </div>

            {/* Client & Billed-To Particulars */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl p-4"
              style={{ border: "1px solid #e4e4e7", backgroundColor: "#faf8f4" }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#a1a1aa]">
                  Billed To (Client Particulars)
                </span>
                <p className="font-serif text-sm font-bold text-[#18181b] mt-0.5">
                  {data.name || "Client"}
                </p>
                <p className="text-[#52525b] mt-0.5">
                  {data.residentialAddress || data.address || "Address as per consultation record"}
                </p>
                <p className="mt-1 font-semibold text-[#18181b]">
                  State: <span className="font-bold text-[#b9843c]">{clientState}</span>
                </p>
                <p className="mt-1 font-mono text-[#3f3f46]">
                  Phone: <strong>{data.phone || data.userPhone || "—"}</strong>
                  {data.email && <span> • {data.email}</span>}
                </p>
                <p className="mt-0.5 text-[#71717a] text-[11px]">
                  Client ID: <strong className="font-mono text-[#18181b]">{data.clientId || "CLT-VASTU"}</strong>
                </p>
                {data.clientGstin ? (
                  <p className="mt-1.5 font-mono text-[11px] font-bold text-[#18181b] bg-[#fdf3e5] px-2 py-0.5 rounded border border-[#edd7b6] inline-block">
                    <span>Buyer GSTIN (ITC): </span>
                    <strong className="text-[#965c19]">{data.clientGstin}</strong>
                  </p>
                ) : null}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#a1a1aa]">
                  Consulted Property Particulars
                </span>
                <p className="font-semibold text-[#18181b] mt-0.5">
                  Property Address: {data.propertyAddress || data.address || "As inspected on site"}
                </p>
                {data.propertyType && (
                  <p className="text-[#52525b] mt-0.5">
                    Type: <strong>{data.propertyType}</strong>
                    {data.approximateArea && <span> • Area: {data.approximateArea}</span>}
                  </p>
                )}
                <p className="mt-1 text-[#52525b]">
                  Mode: <strong className="capitalize">{String(data.consultationMode || data.mode || "Site Visit").replace(/_/g, " ")}</strong>
                  {data.distanceTier && (
                    <span> ({String(data.distanceTier).replace(/_/g, " ")})</span>
                  )}
                </p>
                <p className="mt-0.5 text-[#71717a] text-[11px]">
                  Document Reference: <strong className="font-mono text-[#18181b]">{data.reference || data.documentNo || data._id || "BSV-APT"}</strong>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    className="text-[11px] font-bold uppercase tracking-wider text-[#3f3f46]"
                    style={{ borderBottom: "2px solid #18181b", backgroundColor: "#f4f4f5" }}
                  >
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Service Description</th>
                    <th className="py-2.5 px-3 text-center">SAC Code</th>
                    <th className="py-2.5 px-3 text-right">Taxable Val</th>
                    <th className="py-2.5 px-3 text-right">GST Rate</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e4e4e7" }}>
                    <td className="py-3 px-3 font-semibold text-[#a1a1aa]">1</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-[#18181b]">
                        {consultationType}
                      </p>
                      <p className="text-[11px] text-[#71717a] mt-0.5">
                        Mode: {String(data.consultationMode || data.mode || "Site Visit").replace(/_/g, " ")}
                        {data.distanceTier && ` • Location Tier: ${data.distanceTier.replace(/_/g, " ")}`}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-[#3f3f46]">998399</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#18181b]">{money(taxable)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-[#3f3f46]">{gstRate}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#18181b]">{money(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax Breakdown & Totals */}
            <div
              className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4"
              style={{ borderTop: "2px solid #18181b" }}
            >
              {/* Payment Details */}
              <div className="space-y-1.5 text-[11px]">
                <span className="font-bold text-[#18181b] uppercase tracking-wider block">Payment Information</span>
                <p className="text-[#52525b]">
                  Payment Gateway: <strong>PayU India (Online)</strong>
                </p>
                <p className="text-[#52525b]">
                  Transaction ID: <strong className="font-mono text-[#18181b]">{data?.txnid || data?.paymentReference || "N/A"}</strong>
                </p>
                <div className="flex items-center gap-1.5 font-bold mt-1" style={{ color: "#047857" }}>
                  <CheckCircle2 size={14} />
                  <span>Payment Verified & Received in Full</span>
                </div>
              </div>

              {/* Calculations Box */}
              <div className="w-full sm:w-80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#52525b]">
                  <span>Taxable Amount:</span>
                  <span className="font-bold text-[#18181b]">{money(taxable)}</span>
                </div>
                {gstRate > 0 ? (
                  isIntraState ? (
                    <>
                      <div className="flex justify-between text-[#52525b]">
                        <span>CGST ({gstRate / 2}%):</span>
                        <span>{money(halfGst)}</span>
                      </div>
                      <div className="flex justify-between text-[#52525b]">
                        <span>SGST ({gstRate / 2}%):</span>
                        <span>{money(halfGst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[#52525b]">
                      <span>IGST ({gstRate}%):</span>
                      <span>{money(totalGst)}</span>
                    </div>
                  )
                ) : (
                  <div className="flex justify-between text-[#52525b]">
                    <span>GST (0% Exempted):</span>
                    <span>₹0</span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-2 text-sm font-bold text-[#18181b] font-serif"
                  style={{ borderTop: "2px solid #18181b" }}
                >
                  <span>Grand Total Paid:</span>
                  <span className="font-mono text-base text-[#b9843c]">{money(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer & Signature */}
            <div
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 text-[10px] text-[#71717a]"
              style={{ borderTop: "1px solid #e4e4e7" }}
            >
              <div>
                <p className="font-semibold text-[#3f3f46]">Terms & Conditions:</p>
                <p className="mt-0.5 max-w-sm">
                  1. This is a computer-generated tax invoice and requires no physical signature.<br />
                  2. Consultation fees are non-refundable once site visit or analysis has commenced.<br />
                  3. Subject to Jaipur jurisdiction.
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-[#18181b] text-xs font-serif">For Bhuwneshwari Scientific Vastu</p>
                <div className="h-10"></div>
                <p
                  className="pt-1 font-semibold text-[#18181b]"
                  style={{ borderTop: "1px solid #a1a1aa" }}
                >
                  Ar. Kuldeep Swami (Chief Vastu Consultant)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
