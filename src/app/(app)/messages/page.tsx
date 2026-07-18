import { MessageSquare } from "lucide-react";

export default function MessagesIndex() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-4 text-center lg:flex">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-surface-2 text-muted shadow-inner">
        <MessageSquare size={32} />
      </div>
      <div>
        <p className="text-xl font-semibold">Jouw gesprekken</p>
        <p className="mt-1 text-sm text-muted">Kies een gesprek om zaken te doen.</p>
      </div>
    </div>
  );
}
