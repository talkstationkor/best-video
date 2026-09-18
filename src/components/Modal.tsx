"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function Modal({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>

          <button
            onClick={onClose}
            className="text-muted hover:text-ink"
            aria-label={language === "English" ? "Close" : "닫기"}
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
