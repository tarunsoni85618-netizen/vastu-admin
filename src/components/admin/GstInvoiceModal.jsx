"use client";

import { useRef, useState, useEffect } from "react";
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

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (typeof onClose === "function") onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
    `INV-${data.reference || data.documentNo || "APT"}`;

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

  const gstin = data.gstin || "08AANCB4727H1ZG";
  const consultationType = data.service || data.type || "Scientific Vastu Consultation";

  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      if (typeof window !== "undefined") {
        const html2canvasProModule = await import("html2canvas-pro");
        const html2canvas = html2canvasProModule.default || html2canvasProModule;
        const { jsPDF } = await import("jspdf");

        const container = printRef.current;
        if (!container) return;

        const pageElements = container.querySelectorAll("[data-invoice-page]");
        const pagesToRender = pageElements && pageElements.length > 0 ? Array.from(pageElements) : [container];

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < pagesToRender.length; i++) {
          const pageEl = pagesToRender[i];
          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.98);
          const imgHeight = (canvas.height * pdfWidth) / canvas.width;

          if (i > 0) {
            pdf.addPage();
          }

          if (imgHeight <= pdfHeight) {
            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight);
          } else {
            const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
            const xOffset = Math.max(0, (pdfWidth - scaledWidth) / 2);
            pdf.addImage(imgData, "JPEG", xOffset, 0, Math.min(pdfWidth, scaledWidth), pdfHeight);
          }
        }

        pdf.save(`${invoiceNo}.pdf`);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      if (typeof window !== "undefined") {
        window.print();
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (typeof onClose === "function") onClose();
        }
      }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        
        {/* Top Action Bar */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-200 bg-[#fffcf7] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f7eedf] text-[#b9843c]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="font-serif text-sm font-bold text-zinc-900 leading-tight">
                Official GST Tax Invoice
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
              className="flex items-center gap-1.5 rounded-xl bg-[#b9843c] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#a2712f] disabled:opacity-60 cursor-pointer"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? "Creating PDF..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof onClose === "function") onClose();
              }}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 shadow-sm"
              aria-label="Close"
            >
              <X size={18} />
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
            {/* PAGE 1: GST TAX INVOICE */}
            <div data-invoice-page="1" className="space-y-5 bg-white text-[#18181b]" style={{ backgroundColor: "#ffffff", color: "#18181b" }}>
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
                  Document Reference: <strong className="font-mono text-[#18181b]">{data.reference || data.documentNo || "BSV-APT"}</strong>
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
                  Payment Gateway: <strong>Online Payment (Verified)</strong>
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

            {/* PAGE BREAK TO PAGE 2 (DO NOT CHANGE PAGE 1) */}
            <div
              className="html2pdf__page-break"
              style={{
                pageBreakBefore: "always",
                breakBefore: "page",
                height: 0,
                margin: 0,
                padding: 0,
              }}
            />

            {/* ======================================================== */}
            {/* PAGE 2: SCIENTIFIC VASTU DECLARATION & INFORMED CONSENT */}
            {/* ======================================================== */}
            <div
              data-invoice-page="2"
              className="pt-6 text-xs leading-relaxed text-[#18181b] space-y-3.5 bg-white"
              style={{ minHeight: "1050px", backgroundColor: "#ffffff", color: "#18181b" }}
            >
              {/* Page 2 Header */}
              <div
                className="flex items-start justify-between pb-3.5"
                style={{ borderBottom: "2px solid #b9843c" }}
              >
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#18181b] tracking-wide uppercase">
                    Bhuwneshwari Scientific Vastu
                  </h2>
                  <p className="text-[10px] text-[#71717a] font-medium">
                    Architectural & Scientific Vastu Consultancy | Ar. Kuldeep Swami (B.Arch)
                  </p>
                  <p className="text-[10px] text-[#71717a]">
                    Vaishali Nagar, Jaipur, Rajasthan - 302021 | Ph: +91 94140 44559 | GSTIN: {gstin}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-[#f7eedf] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c5d23]">
                    Annexure • Page 2 of 3
                  </span>
                  <p className="mt-1 text-[10px] font-mono text-[#71717a]">
                    Ref Inv: <strong className="text-[#18181b]">{invoiceNo}</strong>
                  </p>
                  <p className="text-[10px] text-[#71717a]">Date: {invDate}</p>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="rounded-xl bg-[#faf5ed] border border-[#e8d8c3] p-2.5 text-center">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#633b0a]">
                  Annexure I: Client Declaration & Informed Consent
                </h3>
                <p className="text-[10px] text-[#7d6851] mt-0.5">
                  Governing Terms for Scientific Vastu Consultation, Energy Assessment & Spatial Advisory
                </p>
              </div>

              {/* Consultation Reference Card */}
              <div className="rounded-xl border border-[#e4e4e7] bg-[#fbfbfa] p-2.5 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#71717a] block">Client Name</span>
                  <strong className="text-[#18181b]">{data.name || "Valued Client"}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#71717a] block">Client Phone</span>
                  <span className="font-mono text-[#18181b]">{data.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#71717a] block">Service Type</span>
                  <span className="font-semibold text-[#18181b] truncate block">{consultationType}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#71717a] block">Property Address</span>
                  <span className="text-[#18181b] truncate block" title={data.propertyAddress || data.address || data.residentialAddress}>
                    {data.propertyAddress || data.address || data.residentialAddress || "Jaipur, Rajasthan"}
                  </span>
                </div>
              </div>

              {/* Part II: Terms & Conditions (Clauses 1 to 9 on Page 2) */}
              <div className="space-y-2 text-[10px] leading-relaxed text-[#27272a]">
                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">1. Voluntary Engagement & Nature of Advisory</strong>
                  The Client acknowledges voluntary engagement of Ar. Kuldeep Swami / Bhuwneshwari Scientific Vastu for professional Scientific Vastu consultation. All guidance constitutes spatial, directional, and environmental energy balancing advisory based on architectural and Vedic Vastu principles.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">2. Scope of Aura Scanning & Energy Assessment</strong>
                  Aura scanning, geo-pathic stress detection, and cosmic/telluric energy assessments (utilizing universal scanners, Lecher antennas, or digital frequency sensors) assess subtle environmental and spatial energy vibrations. These procedures are holistic/environmental and do NOT constitute medical, clinical, or diagnostic procedures.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">3. Non-Invasive Spatial Balancing Approach</strong>
                  Bhuwneshwari Scientific Vastu prioritizes non-demolition, non-invasive remedies, room repositioning, elemental alignment, and color-frequency balancers. Any load-bearing structural change or building work proposed must be independently verified and approved by a licensed structural engineer before execution.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">4. Authenticity & Accuracy of Client Submissions</strong>
                  The Client certifies that all site maps, directional layout plans, architectural drawings, and personal/family particulars submitted are authentic, accurate, and complete. Advisory is formulated strictly based on the information and measurements provided.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">5. Health & Professional Counsel Disclaimer</strong>
                  Vastu consultancy is complementary and environmental in scope. It does not replace, supersede, or substitute licensed medical diagnosis, psychiatric care, legal advice, or financial counseling. Clients must continue professional treatments prescribed by certified healthcare professionals.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">6. No Deterministic or Supernatural Guarantees</strong>
                  While recommendations are rooted in deep Vedic architecture and scientific vibrational research, life events, commercial prosperity, and health are governed by individual karmic trajectories, personal diligence, and external factors. Therefore, no supernatural or guaranteed financial/health outcomes are warranted or promised.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">7. Independent Decision & Autonomy</strong>
                  The Client retains sole autonomy and discretion regarding the implementation, partial adoption, or non-adoption of suggested remedies, directional changes, and spatial corrections.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">8. Fee Schedule & Non-Refundability</strong>
                  Consultation fees are paid for expert time, architectural analysis, and directional mapping. Once site visits, document review, or consultation sessions have commenced, consultation fees are strictly non-refundable.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">9. Exclusion of Physical Remedies & Products</strong>
                  The consultation fee strictly covers professional advisory and site assessment services. Physical Vastu remedies, copper/brass rods, energy helixes, pyramids, energized yantras, essential aura oils, and the Electric Harmonized Globe are separate products available independently at additional cost.
                </div>
              </div>

              {/* Page 2 Footer Note */}
              <div className="pt-2 flex justify-between text-[9px] text-[#71717a] border-t border-[#e4e4e7]">
                <span>Document: Bhuwneshwari Scientific Vastu Client Declaration (Part I & II)</span>
                <span>Continued on Page 3 →</span>
              </div>
            </div>

            {/* PAGE BREAK TO PAGE 3 */}
            <div
              className="html2pdf__page-break"
              style={{
                pageBreakBefore: "always",
                breakBefore: "page",
                height: 0,
                margin: 0,
                padding: 0,
              }}
            />

            {/* ======================================================== */}
            {/* PAGE 3: TERMS (CONTD.), EXCLUSION CLAUSE & ACCEPTANCE */}
            {/* ======================================================== */}
            <div
              data-invoice-page="3"
              className="pt-6 text-xs leading-relaxed text-[#18181b] space-y-3.5 bg-white"
              style={{ minHeight: "1050px", backgroundColor: "#ffffff", color: "#18181b" }}
            >
              {/* Page 3 Header */}
              <div
                className="flex items-start justify-between pb-3.5"
                style={{ borderBottom: "2px solid #b9843c" }}
              >
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#18181b] tracking-wide uppercase">
                    Bhuwneshwari Scientific Vastu
                  </h2>
                  <p className="text-[10px] text-[#71717a] font-medium">
                    Architectural & Scientific Vastu Consultancy | Ar. Kuldeep Swami (B.Arch)
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-[#f7eedf] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8c5d23]">
                    Annexure • Page 3 of 3
                  </span>
                  <p className="mt-1 text-[10px] font-mono text-[#71717a]">
                    Ref Inv: <strong className="text-[#18181b]">{invoiceNo}</strong>
                  </p>
                </div>
              </div>

              {/* Part II (Contd.): Clauses 10 to 17 */}
              <div className="space-y-2 text-[10px] leading-relaxed text-[#27272a]">
                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">10. Cancellation & Rescheduling Protocol</strong>
                  Appointment rescheduling requires at least 48 hours advance notice. Bhuwneshwari Scientific Vastu reserves the right to reschedule sessions due to extreme weather, travel exigencies, or force majeure events.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">11. Professional Confidentiality</strong>
                  All client personal information, residential floor plans, aura scan readings, and consultation records are held in strict professional confidence and will never be shared without express written consent.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">12. Scope of Deliverables</strong>
                  Deliverables correspond to the selected consultation package and may encompass on-site directional evaluations, marked architectural plan diagrams, elemental zone charts, and structured advisory notes.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">13. Safe Premises Access & Cooperation</strong>
                  For on-site appointments, the Client guarantees safe, unobstructed, and lawful access to all relevant property zones and premises during the mutually agreed consultation window.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">14. Limitation of Liability</strong>
                  To the maximum extent permitted by law, Bhuwneshwari Scientific Vastu and Ar. Kuldeep Swami shall not be liable for indirect, incidental, consequential, or punitive damages resulting from property changes or third-party implementations.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">15. Exclusive Jurisdiction & Dispute Resolution</strong>
                  Any questions, claims, disputes, or differences arising under or in connection with this advisory shall be amicably resolved, failing which they shall fall under the exclusive jurisdiction of the competent courts in Jaipur, Rajasthan, India.
                </div>

                <div className="p-2 rounded-lg bg-white border border-[#f0f0f0]">
                  <strong className="text-[#18181b] block mb-0.5">16. Entire Understanding</strong>
                  This Declaration and Service Terms represents the entire and integrated agreement between the Client and Bhuwneshwari Scientific Vastu, superseding all previous verbal or written discussions.
                </div>
              </div>

              {/* Part III: Explicit Product Exclusion Notice */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-[10px] text-amber-950">
                <strong className="font-serif block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-800" />
                  <span>Part III: Separate Acknowledgement of Exclusion of Remedies and Products</span>
                </strong>
                <p className="leading-relaxed">
                  The Client explicitly confirms awareness that this invoice and consultation fee does <strong>NOT</strong> include physical Vastu remedy rods, energetic brass/copper plates, pyramids, or the Electric Harmonized Globe. Purchase of any physical harmonizers or remedies is completely optional and handled under a separate quotation or order.
                </p>
              </div>

              {/* Part IV & V: Client Acceptance & Consultant Endorsement */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#e4e4e7] bg-[#fbfbfa] p-3 text-[10.5px]">
                  <span className="text-[9px] uppercase font-bold text-[#71717a] block mb-1">
                    Part IV: Client Digital Consent & Confirmation
                  </span>
                  <div className="space-y-1">
                    <p className="text-[#18181b]">
                      <strong>Client:</strong> {data.name || "Client"}
                    </p>
                    <p className="text-[#18181b]">
                      <strong>Mobile / Auth:</strong> {data.phone || "Verified"}
                    </p>
                    <p className="text-[#18181b]">
                      <strong>Date of Acceptance:</strong> {invDate}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-800 font-semibold text-[10px]">
                      <CheckCircle2 size={13} className="text-emerald-700" />
                      <span>Digitally Confirmed & Accepted by Client</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e4e4e7] bg-[#fbfbfa] p-3 text-[10.5px] text-right sm:text-right">
                  <span className="text-[9px] uppercase font-bold text-[#71717a] block mb-1">
                    Part V: Consultant Endorsement
                  </span>
                  <p className="font-bold text-[#18181b] font-serif">For Bhuwneshwari Scientific Vastu</p>
                  <p className="text-[10px] text-[#71717a]">Ar. Kuldeep Swami (B.Arch)</p>
                  <div className="h-6"></div>
                  <p className="font-semibold text-[10px] text-[#18181b] border-t border-[#d4d4d8] pt-1 inline-block">
                    Chief Scientific Vastu Consultant
                  </p>
                </div>
              </div>

              {/* Bottom Document Stamp */}
              <div className="pt-2 text-center text-[9px] text-[#71717a] border-t border-[#e4e4e7]">
                <span>This multi-page document serves as the combined GST Tax Invoice and Official Scientific Vastu Declaration Annexure.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="shrink-0 flex items-center justify-between border-t border-zinc-200 bg-[#faf8f4] px-6 py-3.5">
          <p className="text-xs text-zinc-500 font-mono">
            Invoice #{invoiceNo}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-xl bg-[#b9843c] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#a2712f] disabled:opacity-60 cursor-pointer"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? "Creating PDF..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof onClose === "function") onClose();
              }}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
