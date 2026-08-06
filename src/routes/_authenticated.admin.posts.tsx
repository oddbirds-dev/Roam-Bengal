import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AdminButton,
  Badge,
  Card,
  DeleteButton,
  ErrorBanner,
  PageHeader,
  SavedNote,
  Table,
  Td,
  useAction,
} from "@/components/admin/admin-ui";
import {
  NumberField,
  RelatedContentField,
  StringListField,
  TextArea,
  TextField,
  Toggle,
} from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-upload";
import { invalidateLinkTargets } from "@/components/admin/link-picker";
import {
  adminDeletePost,
  adminListPosts,
  adminUpsertPost,
} from "@/lib/admin-content.functions";

export const Route = createFileRoute("/_authenticated/admin/posts")({
  loader: () => adminListPosts(),
  component: PostsScreen,
});

function blank() {
  return {
    slug: "",
    title: "",
    excerpt: "",
    body: [] as string[],
    category: "",
    date_label: "",
    read_time: "",
    cover_image: "",
    author_name: "",
    author_role: "",
    author_avatar: "",
    related_slugs: [] as string[],
    is_featured: false,
    is_published: true,
    sort_order: 0,
  };
}

type PostForm = ReturnType<typeof blank>;

function PostsScreen() {
  const posts = Route.useLoaderData();
  const { run, busy, error, saved } = useAction();
  const [editing, setEditing] = useState<{ id?: string; form: PostForm } | null>(null);

  async function save() {
    if (!editing) return;
    const form = { ...editing.form, slug: editing.form.slug.trim() || slugify(editing.form.title) };
    const ok = await run(() =>
      adminUpsertPost({ data: { ...(editing.id ? { id: editing.id } : {}), post: form as never } }),
    );
    if (ok) {
      // The link picker caches its list per session; `router.invalidate()` doesn't reach it.
      invalidateLinkTargets();
      setEditing(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Blog"
        subtitle={`${posts.length} post${posts.length === 1 ? "" : "s"}, drafts included`}
        actions={
          <AdminButton onClick={() => setEditing({ form: blank() })}>+ New post</AdminButton>
        }
      />

      <ErrorBanner error={error} />

      {editing ? (
        <div className="mb-6">
          <Card title={editing.id ? "Edit post" : "New post"}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Title"
                required
                value={editing.form.title}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, title: v } })}
              />
              <TextField
                label="Slug"
                mono
                hint="Leave blank to derive from the title."
                placeholder={slugify(editing.form.title)}
                value={editing.form.slug}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, slug: v } })}
              />
              <TextField
                label="Category"
                placeholder="Wildlife"
                value={editing.form.category}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, category: v } })}
              />
              <TextField
                label="Read time"
                placeholder="5 min read"
                value={editing.form.read_time}
                onChange={(v) => setEditing({ ...editing, form: { ...editing.form, read_time: v } })}
              />
              <TextField
                label="Author"
                value={editing.form.author_name}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, author_name: v } })
                }
              />
              <TextField
                label="Author role"
                placeholder="Lead Guide"
                value={editing.form.author_role}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, author_role: v } })
                }
              />
              <TextField
                label="Date label"
                placeholder="Jan 2026"
                value={editing.form.date_label}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, date_label: v } })
                }
              />
              <NumberField
                label="Sort order"
                min={0}
                value={editing.form.sort_order}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, sort_order: v ?? 0 } })
                }
              />
            </div>

            <TextArea
              label="Excerpt"
              rows={3}
              value={editing.form.excerpt}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, excerpt: v } })}
            />

            <ImageField
              label="Cover image"
              value={editing.form.cover_image}
              onChange={(v) =>
                setEditing({ ...editing, form: { ...editing.form, cover_image: v } })
              }
            />

            <StringListField
              label="Body paragraphs"
              hint="One entry per paragraph."
              multiline
              values={editing.form.body}
              onChange={(v) => setEditing({ ...editing, form: { ...editing.form, body: v } })}
            />

            <RelatedContentField
              label="Related posts"
              hint="Shown in the sidebar. Leave empty to pick automatically."
              kind="post"
              values={editing.form.related_slugs}
              onChange={(v) =>
                setEditing({ ...editing, form: { ...editing.form, related_slugs: v } })
              }
            />

            <div className="flex flex-wrap gap-8">
              <Toggle
                label="Published"
                checked={editing.form.is_published}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, is_published: v } })
                }
              />
              <Toggle
                label="Featured"
                hint="The large card at the top of /blog."
                checked={editing.form.is_featured}
                onChange={(v) =>
                  setEditing({ ...editing, form: { ...editing.form, is_featured: v } })
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <AdminButton onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save post"}
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <SavedNote show={saved && !error} />
            </div>
          </Card>
        </div>
      ) : null}

      <Table head={["Title", "Category", "Author", "Status", ""]} empty={posts.length === 0}>
        {posts.map((post) => (
          <tr key={post.id}>
            <Td>
              <button
                type="button"
                onClick={() => setEditing({ id: post.id, form: hydrate(post) })}
                className="text-left font-semibold text-green-dark hover:text-green hover:underline"
              >
                {post.title}
              </button>
              <span className="mt-0.5 block font-mono text-[0.72rem] text-muted">/{post.slug}</span>
            </Td>
            <Td className="text-muted">{post.category ?? "—"}</Td>
            <Td className="text-muted">{post.author_name ?? "—"}</Td>
            <Td>
              <span className="flex flex-wrap gap-1.5">
                {post.is_published ? (
                  <Badge tone="green">Published</Badge>
                ) : (
                  <Badge tone="muted">Draft</Badge>
                )}
                {post.is_featured ? <Badge tone="orange">Featured</Badge> : null}
              </span>
            </Td>
            <Td className="text-right">
              <DeleteButton
                disabled={busy}
                onConfirm={() => run(() => adminDeletePost({ data: { id: post.id } }))}
              />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function hydrate(row: Record<string, unknown>): PostForm {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    slug: text(row.slug),
    title: text(row.title),
    excerpt: text(row.excerpt),
    body: Array.isArray(row.body) ? (row.body as string[]) : [],
    category: text(row.category),
    date_label: text(row.date_label),
    read_time: text(row.read_time),
    cover_image: text(row.cover_image),
    author_name: text(row.author_name),
    author_role: text(row.author_role),
    author_avatar: text(row.author_avatar),
    related_slugs: Array.isArray(row.related_slugs) ? (row.related_slugs as string[]) : [],
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
