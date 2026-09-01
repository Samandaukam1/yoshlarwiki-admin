import Image from "next/image";
import type { Metadata } from "next";
import { FolderOpen, Trash2 } from "lucide-react";

import { deleteMedia } from "./actions";
import { MediaUploader } from "./uploader";
import { BUCKETS, BUCKET_LABELS } from "./types";
import { Card, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { canWrite, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Media" };
export const dynamic = "force-dynamic";

type StoredFile = { name: string; path: string; url: string; size: number };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MediaPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const writable = canWrite(admin);

  /** Bucket ichidagi papkalarni bir daraja aylanib chiqadi. */
  async function listBucket(bucket: string): Promise<StoredFile[]> {
    const { data: roots } = await supabase.storage.from(bucket).list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

    const files: StoredFile[] = [];

    for (const entry of roots ?? []) {
      if (entry.id) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(entry.name);
        files.push({
          name: entry.name,
          path: entry.name,
          url: data.publicUrl,
          size: (entry.metadata?.size as number) ?? 0,
        });
        continue;
      }

      // Papka — ichidagi fayllarni olamiz.
      const { data: nested } = await supabase.storage.from(bucket).list(entry.name, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

      for (const child of nested ?? []) {
        if (!child.id) continue;
        const path = `${entry.name}/${child.name}`;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        files.push({
          name: child.name,
          path,
          url: data.publicUrl,
          size: (child.metadata?.size as number) ?? 0,
        });
      }
    }

    return files;
  }

  const buckets = await Promise.all(
    BUCKETS.map(async (bucket) => ({
      bucket,
      files: await listBucket(bucket),
    })),
  );

  const total = buckets.reduce((sum, entry) => sum + entry.files.length, 0);

  return (
    <>
      <PageHeader
        title="Media"
        description={`Supabase Storage — ${total} ta fayl. Yuklangan havolani nomzod formasiga qoʻying.`}
      />

      <div className="mt-7 space-y-5">
        <MediaUploader buckets={BUCKETS} disabled={!writable} />

        {total === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Hali fayl yuklanmagan"
            description="Yuqoridagi forma orqali birinchi faylni yuklang."
          />
        ) : (
          buckets
            .filter((entry) => entry.files.length > 0)
            .map((entry) => (
              <Card key={entry.bucket}>
                <CardTitle>
                  {BUCKET_LABELS[entry.bucket] ?? entry.bucket} ({entry.files.length})
                </CardTitle>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {entry.files.map((file) => (
                    <li
                      key={file.path}
                      className="overflow-hidden rounded-card border border-line"
                    >
                      <div className="relative aspect-square bg-surface-2">
                        {/\.(mp4|webm)$/i.test(file.name) ? (
                          <span className="grid size-full place-items-center text-[12px] text-ink-3">
                            video
                          </span>
                        ) : (
                          <Image
                            src={file.url}
                            alt={file.name}
                            fill
                            sizes="200px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-[12px] font-medium text-ink" title={file.name}>
                          {file.name}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[11px] text-ink-3">
                            {formatSize(file.size)}
                          </span>
                          {writable ? (
                            <form action={deleteMedia}>
                              <input type="hidden" name="bucket" value={entry.bucket} />
                              <input type="hidden" name="path" value={file.path} />
                              <button
                                type="submit"
                                aria-label={`${file.name} faylini oʻchirish`}
                                className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-danger-soft hover:text-danger"
                              >
                                <Trash2 className="size-3.5" strokeWidth={1.9} />
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))
        )}
      </div>
    </>
  );
}
