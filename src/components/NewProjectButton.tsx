"use client";

import { useState } from "react";
import NewProjectModal from "./NewProjectModal";

export default function NewProjectButton({ canCreate }: { canCreate: boolean }) {
  const [open, setOpen] = useState(false);
  if (!canCreate) return null;
  return (
    <>
      <button className="btn-primary whitespace-nowrap" onClick={() => setOpen(true)}>
        + New Project
      </button>
      {open && <NewProjectModal onClose={() => setOpen(false)} />}
    </>
  );
}
