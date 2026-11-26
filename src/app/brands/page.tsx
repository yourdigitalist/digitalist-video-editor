"use client";

import { useState } from "react";
import { ExternalLink, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { extractDriveFolderId } from "@/lib/drive";
import { MAX_BRAND_COLORS, normalizePalette } from "@/lib/palette";
import { useEditorStore } from "@/lib/store";
import { formatRelative } from "@/lib/utils";
import type { BrandColor } from "@/lib/types";

export default function BrandsPage() {
  const hydrated = useEditorStore((s) => s.hydrated);
  const brands = useEditorStore((s) => s.brands);
  const addBrand = useEditorStore((s) => s.addBrand);
  const updateBrand = useEditorStore((s) => s.updateBrand);
  const deleteBrand = useEditorStore((s) => s.deleteBrand);

  const [name, setName] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!hydrated) {
    return <div className="panel p-10 text-[var(--muted)]">Loading brands…</div>;
  }

  async function importDesignSystem(brandId: string, url: string, brandName: string) {
    setImportingId(brandId);
    setImportMessage(null);
    try {
      const res = await fetch("/api/drive/import-design-system", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ driveUrl: url, brandName }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok: boolean;
        error?: string;
        warning?: string;
        palette?: BrandColor[];
        typography?: string;
        typographyFallback?: boolean;
        source?: string;
        colorCount?: number;
        tokenFileName?: string;
      } | null;
      if (!data?.ok || !data.palette?.length) {
        setImportMessage(
          data?.error ||
            (res.ok ? "Could not import design system" : `Import failed (${res.status} ${res.statusText})`),
        );
        return;
      }
      const nextPalette = normalizePalette(data.palette).slice(0, MAX_BRAND_COLORS);
      const nextTypography =
        data.typography && !data.typographyFallback ? data.typography : undefined;
      updateBrand(brandId, {
        palette: nextPalette,
        ...(nextTypography ? { typography: nextTypography } : {}),
        notes: notesFromImport(brandId, data.source),
      });
      const hexPreview = nextPalette.map((c) => c.hex).join(", ");
      const typePart = nextTypography ? ` · Typography: ${nextTypography}` : "";
      const base =
        data.source === "google-drive"
          ? `Pulled ${nextPalette.length} colors from ${data.tokenFileName || "Drive"}: ${hexPreview}${typePart}`
          : `Loaded sample design-system tokens: ${hexPreview}${typePart}`;
      setImportMessage(data.warning ? `${base} — ${data.warning}` : base);
    } catch {
      setImportMessage("Import failed");
    } finally {
      setImportingId(null);
    }
  }

  function notesFromImport(brandId: string, source?: string) {
    const brand = brands.find((b) => b.id === brandId);
    const stamp = `Design system imported (${source ?? "unknown"}) at ${new Date().toLocaleString()}`;
    if (!brand?.notes?.trim()) return stamp;
    const withoutOld = brand.notes
      .split("\n")
      .filter((line) => !line.startsWith("Design system imported"))
      .join("\n")
      .trim();
    return withoutOld ? `${withoutOld}\n${stamp}` : stamp;
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const brand = addBrand({
      name: name.trim(),
      driveUrl: driveUrl.trim(),
      notes: notes.trim(),
    });
    setName("");
    setDriveUrl("");
    setNotes("");
    setOpen(false);
    if (driveUrl.trim() || name.trim()) {
      void importDesignSystem(brand.id, driveUrl.trim(), name.trim());
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Brands</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Point each brand at a Google Drive folder with tokens.json (and logos/assets). Colors and
            typography pull from that design system first — edit manually only when needed.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add brand
        </Button>
      </div>

      {importMessage ? (
        <div className="panel-inset px-4 py-3 text-sm text-[var(--muted)]">{importMessage}</div>
      ) : null}

      {open && (
        <form onSubmit={onCreate} className="panel space-y-4 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            New brand
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-[var(--muted)]">Name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fungal Dreams"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-[var(--muted)]">Google Drive folder</span>
              <Input
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/…"
              />
            </label>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Recommended layout: tokens.json, Guidelines.md, Logos.md, product cutouts. Saving will try
            to import colors/typography automatically.
          </p>
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
          <article key={brand.id} className="panel space-y-4 overflow-hidden p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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

            <div className="space-y-2">
              <div className="swatch-row">
                {brand.palette.slice(0, MAX_BRAND_COLORS).map((color) => (
                  <label key={color.id} className="swatch-chip cursor-pointer">
                    <span className="swatch shrink-0" style={{ background: color.hex }} />
                    <span className="truncate text-[var(--muted)]">{color.role}</span>
                    <input
                      className="mono w-[6.5rem] bg-transparent outline-none"
                      value={color.hex}
                      onChange={(e) => {
                        const hex = e.target.value;
                        updateBrand(brand.id, {
                          palette: brand.palette.map((c) =>
                            c.id === color.id ? { ...c, hex } : c,
                          ),
                        });
                      }}
                      aria-label={`${color.role} hex`}
                    />
                  </label>
                ))}
              </div>
              <p className="text-xs text-[var(--muted)]">
                {brand.palette.length} color{brand.palette.length === 1 ? "" : "s"} — edit hex values
                here, or pull again after fixing tokens.json / tokens.css in Drive.
              </p>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="text-[var(--muted)]">Google Drive link</span>
              <div className="flex gap-2">
                <Input
                  className="font-mono text-xs"
                  value={brand.driveUrl ?? ""}
                  onChange={(e) => updateBrand(brand.id, { driveUrl: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/…"
                  title={brand.driveUrl || undefined}
                />
                {brand.driveUrl ? (
                  <Button asChild variant="secondary" className="shrink-0">
                    <a href={brand.driveUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
              {extractDriveFolderId(brand.driveUrl ?? "") ? (
                <p className="break-all font-mono text-[11px] text-[var(--muted)]">
                  folder {extractDriveFolderId(brand.driveUrl ?? "")}
                </p>
              ) : null}
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={importingId === brand.id}
                onClick={() =>
                  void importDesignSystem(brand.id, brand.driveUrl ?? "", brand.name)
                }
              >
                <RefreshCw className={`h-3.5 w-3.5 ${importingId === brand.id ? "animate-spin" : ""}`} />
                Pull from design system
              </Button>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="text-[var(--muted)]">Typography</span>
              <Input
                value={brand.typography}
                onChange={(e) => updateBrand(brand.id, { typography: e.target.value })}
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="text-[var(--muted)]">Notes</span>
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
