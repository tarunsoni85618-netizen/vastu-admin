"use client";

import { useRef, useState, useEffect } from "react";
import { X, Download, ShieldCheck, CheckCircle2, Loader2, Package } from "lucide-react";
import { useStoreSettings } from "@/lib/settings";

const money = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

export default function OrderGstInvoiceModal({ isOpen = true, onClose, order }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const { supportPhone, supportEmail, fullAddress, gstin: storeGstin } = useStoreSettings();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (typeof onClose === "function") onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !order) return null;

  const total = Number(order.total || 0);
  const subtotal = Number(order.subtotal || total);
  const discount = Number(order.discount || 0);
  const shipping = Number(order.shipping || 0);

  // 18% GST calculation
  const gstRate = Number(order.gstRate !== undefined ? order.gstRate : 18);
  const taxable = Number(
    order.taxableAmount !== undefined
      ? order.taxableAmount
      : Math.max(0, subtotal - discount)
  );
  const gstAmount = Number(
    order.gstAmount !== undefined
      ? order.gstAmount
      : Math.round(taxable * 0.18)
  );
  const halfGst = Math.round((gstAmount / 2) * 100) / 100;

  // Rajasthan is seller state (State Code 08).
  const addr = order.shippingAddress || order.customerSnapshot || order.customer || {};
  const clientState = String(addr.state || "Rajasthan").trim();
  const isIntraState = !clientState || clientState.toLowerCase().includes("rajasthan");

  const invoiceNo =
    order.invoiceNumber ||
    `INV-${order.orderNumber || order.id || "ORD"}`;

  const invDate = (order.deliveredAt || order.createdAt || order.date)
    ? new Date(order.deliveredAt || order.createdAt || order.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const sellerGstin = "08AANCB4727H1ZG";
  const buyerGstin = order.buyerGstin || addr.buyerGstin || addr.gstin || order.customerSnapshot?.buyerGstin || "";
  const customerName = order.customer || order.customerSnapshot?.name || addr.fullName || addr.name || "Valued Customer";
  const customerPhone = order.phone || order.customerSnapshot?.phone || addr.phone || "";
  const customerEmail = order.email || order.customerSnapshot?.email || addr.email || "";

  const addressLine = [
    addr.address || addr.line1 || addr.addressLine1,
    addr.landmark || addr.line2,
    addr.city,
    addr.state,
    addr.pincode || addr.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const items = Array.isArray(order.items) ? order.items : [];

  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      if (typeof window !== "undefined") {
        const html2canvasProModule = await import("html2canvas-pro");
        const html2canvas = html2canvasProModule.default || html2canvasProModule;
        const { jsPDF } = await import("jspdf");
        const element = printRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (imgHeight <= pdfHeight) {
          pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight);
        } else {
          const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
          const xOffset = Math.max(0, (pdfWidth - scaledWidth) / 2);
          pdf.addImage(imgData, "JPEG", xOffset, 0, Math.min(pdfWidth, scaledWidth), pdfHeight);
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "850px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "94vh",
        }}
      >
        {/* Modal Top Control Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderBottom: "1px solid #e4e4e7",
            backgroundColor: "#fbfbfa",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#fef3c7",
                color: "#b45309",
                display: "grid",
                placeItems: "center",
              }}
            >
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#18181b" }}>
                Official GST Tax Invoice (Delivered Order)
              </h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#71717a" }}>
                Invoice No: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{invoiceNo}</span>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#b45309",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: downloading ? "not-allowed" : "pointer",
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{downloading ? "Generating PDF..." : "Download PDF"}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close invoice"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "1px solid #e4e4e7",
                backgroundColor: "#ffffff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#71717a",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Viewport */}
        <div style={{ overflowY: "auto", padding: "20px", backgroundColor: "#f4f4f5" }}>
          <div
            ref={printRef}
            style={{
              backgroundColor: "#ffffff",
              padding: "36px",
              borderRadius: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              color: "#18181b",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #18181b", paddingBottom: "18px" }}>
              <div>
                <p style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "#b45309", textTransform: "uppercase" }}>
                  AUTHENTIC VASTU PRODUCTS STORE
                </p>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#18181b", letterSpacing: "-0.5px" }}>
                  Bhuwneshwari Scientific Vastu
                </h1>
                <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#52525b" }}>
                  Head Office: {fullAddress}
                </p>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#52525b" }}>
                  Phone: {supportPhone} • Email: {supportEmail}
                </p>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7" }}>
                    GSTIN: {sellerGstin}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px", backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7" }}>
                    State: Rajasthan (08)
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-block", backgroundColor: "#18181b", color: "#ffffff", padding: "4px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 800, letterSpacing: "1px", marginBottom: "8px" }}>
                  TAX INVOICE
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#71717a" }}>
                  Invoice No: <strong style={{ color: "#18181b" }}>{invoiceNo}</strong>
                </p>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#71717a" }}>
                  Delivered Date: <strong style={{ color: "#18181b" }}>{invDate}</strong>
                </p>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#71717a" }}>
                  Place of Supply: <strong style={{ color: "#18181b" }}>{clientState} ({isIntraState ? "Intra-state" : "Inter-state"})</strong>
                </p>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#71717a" }}>
                  Reverse Charge: <strong style={{ color: "#18181b" }}>No</strong>
                </p>
              </div>
            </div>

            {/* Billed To & Shipping Address Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px", padding: "16px", backgroundColor: "#fafafa", borderRadius: "12px", border: "1px solid #f4f4f5" }}>
              <div>
                <p style={{ margin: "0 0 6px 0", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "#71717a", textTransform: "uppercase" }}>
                  BILLED TO (BUYER DETAILS)
                </p>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, color: "#18181b" }}>
                  {customerName}
                </h4>
                <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#52525b" }}>
                  Phone: {customerPhone || "—"} • Email: {customerEmail || "—"}
                </p>
                <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#52525b" }}>
                  State: <strong style={{ color: "#b45309" }}>{clientState}</strong>
                </p>
                {buyerGstin ? (
                  <div style={{ marginTop: "6px", display: "inline-block", padding: "3px 8px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46" }}>
                      Buyer GSTIN: {buyerGstin} (Input Tax Credit Eligible)
                    </span>
                  </div>
                ) : (
                  <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#a1a1aa" }}>
                    GSTIN: Unregistered Consumer (B2C)
                  </p>
                )}
              </div>

              <div>
                <p style={{ margin: "0 0 6px 0", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "#71717a", textTransform: "uppercase" }}>
                  SHIPPING & FULFILLMENT PARTICULARS
                </p>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#18181b" }}>
                  <strong>Shipping Address:</strong> {addressLine || "Standard Delivery"}
                </p>
                <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#52525b" }}>
                  Order Reference: <strong style={{ fontFamily: "monospace" }}>{order.orderNumber || order.id}</strong>
                </p>
                <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#52525b" }}>
                  Fulfillment Status: <strong style={{ color: "#059669" }}>✓ Delivered</strong>
                </p>
                {order.trackingNumber && (
                  <p style={{ margin: "0 0 3px 0", fontSize: "11px", color: "#71717a" }}>
                    Dispatch Tracking: {order.trackingNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div style={{ marginTop: "24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e4e4e7", textAlign: "left", color: "#71717a" }}>
                    <th style={{ padding: "8px 4px", width: "30px" }}>#</th>
                    <th style={{ padding: "8px 8px" }}>ITEM DESCRIPTION</th>
                    <th style={{ padding: "8px 8px", textAlign: "center" }}>HSN CODE</th>
                    <th style={{ padding: "8px 8px", textAlign: "center" }}>QTY</th>
                    <th style={{ padding: "8px 8px", textAlign: "right" }}>UNIT PRICE</th>
                    <th style={{ padding: "8px 8px", textAlign: "right" }}>TAXABLE VAL</th>
                    <th style={{ padding: "8px 8px", textAlign: "center" }}>GST RATE</th>
                    <th style={{ padding: "8px 8px", textAlign: "right" }}>TOTAL (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr style={{ borderBottom: "1px solid #f4f4f5" }}>
                      <td style={{ padding: "12px 4px" }}>1</td>
                      <td style={{ padding: "12px 8px" }}>Vastu Energy Harmonizer Products</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>6802</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>{money(taxable)}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>{money(taxable)}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>18%</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>{money(total)}</td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const itemName = item.title || item.name || "Vastu Product";
                      const itemQty = Number(item.quantity || 1);
                      const unitPrice = Number(item.price || item.unitPrice || 0);
                      const lineTaxable = unitPrice * itemQty;
                      const lineGst = Math.round(lineTaxable * 0.18);
                      const lineTotal = lineTaxable + lineGst;

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #f4f4f5" }}>
                          <td style={{ padding: "12px 4px" }}>{idx + 1}</td>
                          <td style={{ padding: "12px 8px" }}>
                            <strong style={{ color: "#18181b" }}>{itemName}</strong>
                            {item.sku && <span style={{ fontSize: "10px", color: "#a1a1aa", display: "block" }}>SKU: {item.sku}</span>}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "center", color: "#52525b" }}>6802</td>
                          <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 600 }}>{itemQty}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", color: "#52525b" }}>{money(unitPrice)}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>{money(lineTaxable)}</td>
                          <td style={{ padding: "12px 8px", textAlign: "center", color: "#52525b" }}>18%</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700 }}>{money(lineTotal)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginTop: "24px", paddingTop: "18px", borderTop: "2px solid #18181b" }}>
              <div>
                <p style={{ margin: "0 0 6px 0", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "#71717a", textTransform: "uppercase" }}>
                  PAYMENT INFORMATION
                </p>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#52525b" }}>
                  Payment Method: <strong>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</strong>
                </p>
                <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#52525b" }}>
                  Transaction Reference: <strong style={{ fontFamily: "monospace" }}>{order.paymentReference || "VERIFIED-SETTLED"}</strong>
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", color: "#059669", fontSize: "12px", fontWeight: 700 }}>
                  <CheckCircle2 size={16} />
                  <span>Order Delivered & Payment Settled</span>
                </div>
              </div>

              <div>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#52525b" }}>Items Subtotal:</td>
                      <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{money(subtotal)}</td>
                    </tr>

                    {discount > 0 && (
                      <tr style={{ color: "#065f46" }}>
                        <td style={{ padding: "4px 0" }}>Coupon Discount ({order.coupon || "Promo"}):</td>
                        <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>- {money(discount)}</td>
                      </tr>
                    )}

                    <tr>
                      <td style={{ padding: "4px 0", color: "#52525b" }}>Taxable Amount:</td>
                      <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{money(taxable)}</td>
                    </tr>

                    {isIntraState ? (
                      <>
                        <tr>
                          <td style={{ padding: "4px 0", color: "#52525b" }}>CGST (9%):</td>
                          <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{money(halfGst)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0", color: "#52525b" }}>SGST (9%):</td>
                          <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{money(halfGst)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td style={{ padding: "4px 0", color: "#52525b" }}>IGST (18% Inter-state):</td>
                        <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{money(gstAmount)}</td>
                      </tr>
                    )}

                    <tr>
                      <td style={{ padding: "4px 0", color: "#52525b" }}>Shipping & Handling:</td>
                      <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>
                        {shipping > 0 ? money(shipping) : "FREE"}
                      </td>
                    </tr>

                    <tr style={{ borderTop: "2px solid #18181b", fontSize: "14px", fontWeight: 800 }}>
                      <td style={{ padding: "10px 0 4px 0", color: "#18181b" }}>Grand Total Paid:</td>
                      <td style={{ padding: "10px 0 4px 0", textAlign: "right", color: "#b45309", fontSize: "16px" }}>
                        {money(total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms and Signature */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #e4e4e7" }}>
              <div style={{ fontSize: "10px", color: "#71717a", maxWidth: "420px", lineHeight: "1.5" }}>
                <strong>Terms & Conditions:</strong>
                <ol style={{ margin: "4px 0 0 16px", padding: 0 }}>
                  <li>This is a computer-generated tax invoice issued upon successful delivery of goods.</li>
                  <li>All products are energized according to authentic Vastu principles.</li>
                  <li>Subject to Jaipur jurisdiction.</li>
                </ol>
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 28px 0", fontSize: "11px", fontWeight: 700, color: "#18181b" }}>
                  For Bhuwneshwari Scientific Vastu
                </p>
                <div style={{ borderTop: "1px solid #18181b", width: "180px", margin: "0 auto", paddingTop: "4px" }}>
                  <span style={{ fontSize: "10px", color: "#52525b" }}>Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Control Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderTop: "1px solid #e4e4e7",
            backgroundColor: "#faf8f4",
          }}
        >
          <span style={{ fontSize: "11px", color: "#71717a", fontFamily: "monospace" }}>
            Invoice #{invoiceNo}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#b45309",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: downloading ? "not-allowed" : "pointer",
                opacity: downloading ? 0.7 : 1,
              }}
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{downloading ? "Generating PDF..." : "Download PDF"}</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof onClose === "function") onClose();
              }}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "1px solid #d4d4d8",
                backgroundColor: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                color: "#27272a",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
