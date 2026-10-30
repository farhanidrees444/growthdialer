"use client";

import { useMemo, useState } from "react";
import { loadWhop } from "@whop/elements";
import { Checkout, CheckoutElement, WhopElements } from "@whop/elements-react";

type Props = {
  configurationId: string;
  sandbox: boolean;
  returnUrl?: string;
  onComplete?: () => void;
};

function LiveCheckout({ configurationId, returnUrl, onComplete }: Props) {
  const elements = useMemo(() => loadWhop(), []);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  return (
    <WhopElements elements={elements} environment="production"
      appearance={{ theme: { appearance: "dark", accentColor: "cyan" } }}
      onLoadError={(_error, tryAgain) => setRetry(() => tryAgain)}>
      {retry ? <div role="alert" className="rounded-xl border border-white/10 p-5">
        <p>Secure payment could not load. Your subscription has not been confirmed.</p>
        <button type="button" className="mt-4 rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-zinc-950" onClick={() => { setRetry(null); retry(); }}>Retry secure payment</button>
      </div> : null}
      <Checkout key={configurationId} checkoutConfiguration={configurationId} returnUrl={returnUrl}
        onComplete={(completion) => { if (completion.result === "payment") onComplete?.(); }}>
        <CheckoutElement />
      </Checkout>
    </WhopElements>
  );
}

export function SecureCheckout(props: Props) {
  if (props.sandbox) {
    // Whop's current Elements sandbox is unavailable. Never send sandbox
    // configuration IDs or test card details to the production elements host.
    return <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-6">
      <h3 className="text-lg font-semibold">Complete your test purchase securely.</h3>
      <p className="mt-3 text-sm leading-relaxed opacity-70">Test payments open in a secure sandbox page. No real money moves. Return here after completing the test and refresh your subscription status.</p>
      <a className="mt-5 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-zinc-950" target="_blank" rel="noopener noreferrer"
        href={`https://sandbox.whop.com/checkout/${encodeURIComponent(props.configurationId)}/`}>Open test checkout</a>
    </div>;
  }
  return <LiveCheckout {...props} />;
}
