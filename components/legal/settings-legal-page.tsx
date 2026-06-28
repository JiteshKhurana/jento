import { LEGAL_LAST_UPDATED, legalProseClassName } from "@/components/legal/legal-constants";

type SettingsLegalPageProps = {
  title: string;
  children: React.ReactNode;
};

export function SettingsLegalPage({ title, children }: SettingsLegalPageProps) {
  return (
    <div className="max-h-[min(70vh,640px)] overflow-y-auto pr-2">
      <header className="mb-6 border-b border-border pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>
      </header>
      <div className={legalProseClassName}>{children}</div>
    </div>
  );
}
