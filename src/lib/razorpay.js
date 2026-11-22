"use client";

/**
 * Loads Razorpay Standard Checkout script asynchronously
 */
export function loadRazorpayCheckout() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load secure payment gateway");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Open secure payment modal
 */
export async function openOnlinePayment({
  keyId,
  orderId,
  amount,
  currency = "INR",
  name = "Bhuwneshwari Scientific Vastu",
  description = "Online Payment",
  customer = {},
  notes = {},
  onSuccess,
  onDismiss,
  onError,
}) {
  const isLoaded = await loadRazorpayCheckout();
  if (!isLoaded) {
    const err = new Error("Unable to connect to payment gateway. Please check your network and try again.");
    if (onError) onError(err);
    return;
  }

  const finalKey =
    keyId ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "rzp_test_1DP5mmOlF5G5ag";

  const options = {
    key: finalKey,
    amount: Math.round(Number(amount)),
    currency,
    name,
    description,
    order_id: orderId,
    prefill: {
      name: customer.name || customer.fullName || "",
      email: customer.email || "",
      contact: customer.phone ? String(customer.phone).replace(/\D/g, "").slice(-10) : "",
    },
    notes: {
      ...notes,
    },
    theme: {
      color: "#a56b27",
    },
    handler: function (response) {
      if (onSuccess) {
        onSuccess(response);
      }
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      },
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    if (onError) {
      rzp.on("payment.failed", function (resp) {
        onError(resp.error || new Error("Payment was declined or failed"));
      });
    }
    rzp.open();
  } catch (err) {
    console.error("Error opening online payment:", err);
    if (onError) onError(err);
  }
}
