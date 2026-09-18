"use client";

import { useState } from "react";
import { toDriveEmbedUrl } from "@/lib/validation";
import { useLanguage } from "@/components/LanguageProvider";

export default function VideoPlayer({
  videoUrl,
  label
}: {
  videoUrl: string;
  label?: string;
}) {
  const { language } = useLanguage();
  const isEnglish = language === "English";

  const [expanded, setExpanded] = useState(false);
  const embedUrl = toDriveEmbedUrl(videoUrl);

  const defaultLabel = isEnglish ? "Watch Video" : "영상 보기";
  const displayLabel = label || defaultLabel;

  if (!embedUrl) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary inline-block"
      >
        ▶ {displayLabel.toUpperCase()}
      </a>
    );
  }

  return (
    <div>
      <button
        className="btn-primary"
        onClick={() => setExpanded((v) => !v)}
      >
        ▶{" "}
        {expanded
          ? isEnglish
            ? "HIDE VIDEO"
            : "영상 숨기기"
          : displayLabel.toUpperCase()}
      </button>

      {expanded && (
        <div className="mt-3 aspect-video w-full max-w-2xl overflow-hidden rounded-md border border-line">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="autoplay"
            title={isEnglish ? "Video preview" : "영상 미리보기"}
          />
        </div>
      )}
    </div>
  );
}
