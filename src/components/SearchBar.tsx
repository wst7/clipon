/**
 * 搜索栏组件
 */
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const ICON_SIZE = 14;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "搜索...",
}: SearchBarProps) {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Search size={ICON_SIZE} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-10 h-10 rounded-xl bg-background border border-input text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
        >
          <X size={ICON_SIZE} />
        </button>
      )}
    </div>
  );
}
