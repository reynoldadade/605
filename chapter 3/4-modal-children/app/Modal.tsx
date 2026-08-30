// app/Modal.tsx
//
// The only "use client" file in this example. It knows about open and
// closed, and nothing else. It never imports ProductReviews, never
// calls getReviews, and would work identically if `children` were a
// paragraph of static text instead of a Server Component's output.
"use client";

import { useState } from "react";

export default function Modal({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="trigger-btn" onClick={() => setOpen(true)}>
        {trigger}
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            {children}
            <button className="close" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
