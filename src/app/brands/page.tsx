"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useEditorStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";

export default function BrandsPage() {
  const hydrated = useEditorStore((s) => s.hydrated);
  const brands = useEditorStore((s) => s.brands);
  const addBrand = useEditorStore((s) => s.addBrand);
  const updateBrand = useEditorStore((s) => s.updateBrand);
  const deleteBrand = useEditorStore((s) => s.deleteBrand);

  const [name, setName] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [designSystemNote, setDesignSystemNote] = useState("");
  const [open, setOpen] = useState(false);

  if (!hydrated) {
    return <div className="panel p-10 text-[var(--muted)]">Loading brands…</div>;
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addBrand({
      name: name.trim(),
      driveUrl: driveUrl.trim(),
      notes: [notes.trim(), designSystemNote.trim() && `Design system: ${designSystemNote.trim()}`]
        .filter(Boolean)
        .join("\n"),
    });
    setName("");
    setDriveUrl("");
    setNotes("");
    setDesignSystemNote("");
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Brands</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Keep logos, photos and design-system files in a Google Drive folder and paste the link
            here. No database needed for brand assets — Cursor reads the Drive folder when generating.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add brand
        </Button>
      </div>

      {open && (
        <form onSubmit={onCreate} className="panel space-y-4 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            New brand
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-[var(--muted)]">Name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fungal Dreams" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-[var(--muted)]">Google Drive (logos & photos)</span>
              <Input
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/…"
              />
            </label>
          </div>
          <label className="block space-y-2 text-sm">
            <span className="text-[var(--muted)]">Design system folder (Drive or local note)</span>
            <Input
              value={designSystemNote}
              onChange={(e) => setDesignSystemNote(e.target.value)}
              placeholder="Put tokens.json, Guidelines.md, Logos.md… in the Drive folder above"
            />
            <p className="text-xs text-[var(--muted)]">
              Recommended: one Drive folder per brand with tokens, guidelines, logos and product cutouts.
              Paste that folder URL in Google Drive — no Supabase/upload required for v1.
            </p>
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-[var(--muted)]">Notes</span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tone, forbidden colors, product cutout rules…"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save brand</Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {brands.map((brand) => (
          <article key={brand.id} className="panel space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {brand.name}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Updated {formatRelative(brand.updatedAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${brand.name}`}
                onClick={() => deleteBrand(brand.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              {Object.entries(brand.palette).map(([role, hex]) => (
                <div key={role} className="panel-inset flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="swatch" style={{ background: hex }} />
                  <span className="text-[var(--muted)]">{role}</span>
                  <span className="mono">{hex}</span>
                </div>
              ))}
            </div>

            <label className="block space-y-2 text-sm">
              <span className="text-[var(--muted)]">Google Drive link</span>
              <div className="flex gap-2">
                <Input
                  value={brand.driveUrl ?? ""}
                  onChange={(e) => updateBrand(brand.id, { driveUrl: e.target.value })}
                  placeholder="https://drive.google.com/…"
                />
                {brand.driveUrl ? (
                  <Button asChild variant="secondary" className="shrink-0">
                    <a href={brand.driveUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-[var(--muted)]">Typography</span>
              <Input
                value={brand.typography}
                onChange={(e) => updateBrand(brand.id, { typography: e.target.value })}
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-[var(--muted)]">Notes / design system</span>
              <Textarea
                value={brand.notes ?? ""}
                onChange={(e) => updateBrand(brand.id, { notes: e.target.value })}
              />
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
