"use client";

import * as React from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minHeight?: string;
}

interface MenuBarProps {
  editor: Editor | null;
}

function MenuBar({ editor }: MenuBarProps) {
  const [linkUrl, setLinkUrl] = React.useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = React.useState(false);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
      setIsLinkPopoverOpen(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="border-b border-input bg-background/50 p-2 flex flex-wrap gap-1 items-center">
      {/* Text Formatting */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(editor.isActive("bold") && "bg-accent")}
        title="Bold"
      >
        <Bold className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(editor.isActive("italic") && "bg-accent")}
        title="Italic"
      >
        <Italic className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn(editor.isActive("strike") && "bg-accent")}
        title="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={cn(editor.isActive("code") && "bg-accent")}
        title="Code"
      >
        <Code className="size-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Headings */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          editor.isActive("heading", { level: 1 }) && "bg-accent"
        )}
        title="Heading 1"
      >
        <Heading1 className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          editor.isActive("heading", { level: 2 }) && "bg-accent"
        )}
        title="Heading 2"
      >
        <Heading2 className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          editor.isActive("heading", { level: 3 }) && "bg-accent"
        )}
        title="Heading 3"
      >
        <Heading3 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive("bulletList") && "bg-accent")}
        title="Bullet List"
      >
        <List className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive("orderedList") && "bg-accent")}
        title="Ordered List"
      >
        <ListOrdered className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive("blockquote") && "bg-accent")}
        title="Blockquote"
      >
        <Quote className="size-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Link */}
      <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(editor.isActive("link") && "bg-accent")}
            title="Add Link"
          >
            <LinkIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsLinkPopoverOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={addLink}>
                Add Link
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {editor.isActive("link") && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={removeLink}
          title="Remove Link"
        >
          <Unlink className="size-4" />
        </Button>
      )}

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Undo"
      >
        <Undo className="size-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Redo"
      >
        <Redo className="size-4" />
      </Button>
    </div>
  );
}

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start typing...",
  className,
  editable = true,
  minHeight = "200px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer",
        },
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3",
          `min-h-[${minHeight}]`
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  return (
    <div
      className={cn(
        "border border-input rounded-md bg-background shadow-xs overflow-hidden",
        className
      )}
    >
      {editable && <MenuBar editor={editor} />}
      <EditorContent
        editor={editor}
        className={cn("overflow-y-auto", `min-h-[${minHeight}]`)}
      />
    </div>
  );
}
