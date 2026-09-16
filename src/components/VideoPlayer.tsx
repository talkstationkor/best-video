"use client";

import { useState } from "react";
import { toDriveEmbedUrl } from "@/lib/validation";

export default function VideoPlayer({ videoUrl, label = "Watch Video" }: { videoUrl: string; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const embedUrl = toDriveEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">
        ▶ {label.toUpperCase()}
      </a>
    );
  }

  return (
    <div>
      <button className="btn-primary" onClick={() => setExpanded((v) => !v)}>
        ▶ {expanded ? "HIDE VIDEO" : label.toUpperCase()}
      </button>
      {expanded && (
        <div className="mt-3 aspect-video w-full max-w-2xl overflow-hidden rounded-md border border-line">
          <iframe src={embedUrl} className="h-full w-full" allow="autoplay" title="Video preview" />
        </div>
      )}
    </div>
  );
}
