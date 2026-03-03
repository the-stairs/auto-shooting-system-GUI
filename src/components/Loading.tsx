import { Loader2 } from "lucide-react";

type LoadingPageProps = {
  message?: string;
};

export default function Loading({ message = "로딩 중..." }: LoadingPageProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
