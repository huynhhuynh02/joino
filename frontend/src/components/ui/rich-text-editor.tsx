'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const execCmd = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className,
  autoFocus,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync value → DOM on mount / external prop change, but avoid cursor jump while typing
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      isInternalChange.current = true;
      editorRef.current.innerHTML = value || '';
      isInternalChange.current = false;
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isInternalChange.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  // Renders a toolbar button; onMouseDown (not onClick) preserves editor focus
  const ToolbarBtn = ({
    cmd,
    icon,
    val,
  }: {
    cmd: string;
    icon: React.ReactNode;
    val?: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
      onMouseDown={(e) => {
        e.preventDefault();
        execCmd(cmd, val);
        handleInput();
      }}
    >
      {icon}
    </Button>
  );

  return (
    <div
      className={cn(
        'border border-border rounded-lg focus-within:ring-1 focus-within:ring-primary focus-within:border-primary overflow-hidden bg-background',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-border bg-muted/30">
        <ToolbarBtn cmd="bold" icon={<Bold className="w-3.5 h-3.5" />} />
        <ToolbarBtn cmd="italic" icon={<Italic className="w-3.5 h-3.5" />} />
        <ToolbarBtn cmd="strikeThrough" icon={<Strikethrough className="w-3.5 h-3.5" />} />
        <div className="w-[1px] h-4 bg-border/50 mx-1" />
        <ToolbarBtn cmd="insertUnorderedList" icon={<List className="w-3.5 h-3.5" />} />
        <ToolbarBtn cmd="insertOrderedList" icon={<ListOrdered className="w-3.5 h-3.5" />} />
        <div className="w-[1px] h-4 bg-border/50 mx-1" />
        <ToolbarBtn cmd="formatBlock" val="blockquote" icon={<Quote className="w-3.5 h-3.5" />} />
        <ToolbarBtn cmd="formatBlock" val="pre" icon={<Code className="w-3.5 h-3.5" />} />
      </div>

      {/* Editable content area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose-custom focus:outline-none min-h-[100px] p-3 text-sm text-foreground bg-background"
      />
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
