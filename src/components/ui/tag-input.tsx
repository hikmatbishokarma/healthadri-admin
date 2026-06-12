import { useEffect, useId, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  hint?: string;
}

export function TagInput({
  label,
  value: tags,
  onChange,
  suggestions,
  placeholder = 'Type to search or add new…',
  hint,
}: TagInputProps) {
  const uid = useId();
  const inputId = `tag-input-${uid}`;
  const listboxId = `tag-listbox-${uid}`;

  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside the entire component
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [inputValue]);

  const trimmed = inputValue.trim();

  // Suggestions already added to tags are excluded from the list
  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(trimmed.toLowerCase()) &&
      !tags.some((t) => t.toLowerCase() === s.toLowerCase()),
  );

  // "Add as new" appears only when the typed value doesn't match any suggestion exactly
  const isExactMatch = suggestions.some(
    (s) => s.toLowerCase() === trimmed.toLowerCase(),
  );
  const isAlreadyAdded = tags.some(
    (t) => t.toLowerCase() === trimmed.toLowerCase(),
  );
  const showAddNew = trimmed.length > 0 && !isExactMatch && !isAlreadyAdded;

  // Total navigable options = filtered suggestions + optional "add new" row
  const totalOptions = filtered.length + (showAddNew ? 1 : 0);

  function addTag(val: string) {
    const v = val.trim();
    if (!v) return;
    if (tags.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    onChange([...tags, v]);
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function removeLastTag() {
    if (tags.length === 0) return;
    onChange(tags.slice(0, -1));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { setIsOpen(true); return; }
        setHighlightedIndex((i) => (i + 1) % totalOptions);
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) return;
        setHighlightedIndex((i) => (i <= 0 ? totalOptions - 1 : i - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (!isOpen || totalOptions === 0) {
          // dropdown closed — add whatever is typed as a new value
          if (trimmed) addTag(trimmed);
          return;
        }
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          addTag(filtered[highlightedIndex]);
        } else if (showAddNew && highlightedIndex === filtered.length) {
          addTag(trimmed);
        } else if (trimmed) {
          addTag(trimmed);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue) removeLastTag();
        break;

      default:
        break;
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setIsOpen(true);
  }

  const activeDescendant =
    highlightedIndex >= 0
      ? highlightedIndex < filtered.length
        ? `${listboxId}-opt-${highlightedIndex}`
        : `${listboxId}-opt-new`
      : undefined;

  return (
    <div ref={containerRef} className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>

      {/* ── Tag chips + text input ── */}
      <div
        className="flex flex-wrap gap-2 min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground text-sm font-medium select-none"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : 'Add another…'}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-[180px] bg-transparent text-sm outline-none placeholder:text-muted-foreground py-0.5"
        />
      </div>

      {/* ── Dropdown ── */}
      {isOpen && totalOptions > 0 && (
        <div
          role="listbox"
          id={listboxId}
          aria-label={label}
          className="w-full rounded-md border border-input bg-background shadow-md overflow-hidden"
        >
          {/* Existing suggestions */}
          {filtered.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Select existing
              </p>
              <ul>
                {filtered.map((suggestion, i) => {
                  const isHighlighted = highlightedIndex === i;
                  return (
                    <li
                      key={suggestion}
                      role="option"
                      id={`${listboxId}-opt-${i}`}
                      aria-selected={isHighlighted}
                      onMouseDown={(e) => {
                        e.preventDefault(); // keep input focused
                        addTag(suggestion);
                      }}
                      className={`flex items-center px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                        isHighlighted
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {suggestion}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Divider when both sections are visible */}
          {filtered.length > 0 && showAddNew && (
            <div className="border-t border-border mx-3" />
          )}

          {/* Add as new */}
          {showAddNew && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Add new
              </p>
              <ul>
                <li
                  role="option"
                  id={`${listboxId}-opt-new`}
                  aria-selected={highlightedIndex === filtered.length}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(trimmed);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    highlightedIndex === filtered.length
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Add <span className="font-medium">"{trimmed}"</span>
                  </span>
                </li>
              </ul>
            </div>
          )}

          <div className="pb-1" />
        </div>
      )}

      {/* Hint / helper text */}
      <p className="text-xs text-muted-foreground">
        {hint ?? 'Select from the list or type a new entry and press Enter'}
      </p>
    </div>
  );
}
