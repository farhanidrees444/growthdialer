"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookieTimestamp", new Date().toISOString());
    setShowBanner(false);
  };

  const handleManagePreferences = () => {
    localStorage.setItem("cookieConsent", "manage");
    setShowBanner(false);
    // TODO: Open cookie preferences modal
  };

  const handleDismiss = () => {
    localStorage.setItem("cookieConsent", "dismissed");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            <p className="text-sm text-gray-300">
              We use cookies to improve your experience and analyze how you use our site.
              By clicking "Accept All", you consent to our use of cookies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handleManagePreferences}
              variant="outline"
              size="sm"
              className="border-white/20 text-foreground hover:bg-white/5"
            >
              Manage Preferences
            </Button>
            <Button
              onClick={handleAcceptAll}
              size="sm"
              className="bg-[#16a34a] text-white hover:bg-[#15803d]"
            >
              Accept All
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/5 rounded transition-colors"
              aria-label="Dismiss cookie banner"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Privacy info link */}
        <div className="mt-3 text-xs text-gray-500">
          See our <a href="/privacy" className="text-[#16a34a] hover:text-[#15803d] transition-colors">privacy policy</a> for more information about how we use cookies.
        </div>
      </div>
    </div>
  );
}