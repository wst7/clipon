import { useTranslation } from "react-i18next";
import { Clipboard } from "lucide-react";

const ICON_SIZE = 12;

interface StatusBarProps {
  itemCount: number;
}

export function StatusBar({ itemCount }: StatusBarProps) {
  const { t } = useTranslation();
  return (
    <footer className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t border-border">
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clipboard size={ICON_SIZE} />
        <span>{itemCount}</span>
      </span>
      <span className="text-[11px] text-muted-foreground">{t('copied')}</span>
    </footer>
  );
}
