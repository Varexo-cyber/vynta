import { VyntaMark } from "@/components/vynta-brand";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#f7f7f6]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl">
          <VyntaMark size={48} />
          <span className="absolute inset-x-0 bottom-0 h-1 origin-left animate-[loading-line_1s_ease-in-out_infinite] bg-[#f15a37]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#858b94]">Vynta wordt geladen</p>
      </div>
    </div>
  );
}
