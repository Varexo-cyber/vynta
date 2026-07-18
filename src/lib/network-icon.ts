import {
  Sprout,
  Hammer,
  Leaf,
  Banknote,
  Warehouse,
  UtensilsCrossed,
  ArrowLeftRight,
  Factory,
  ShoppingBag,
  Monitor,
  Truck,
  Building,
  Package,
  HeartPulse,
  MapPin,
  Map,
  Globe,
  type LucideIcon,
} from "lucide-react";

export function networkIcon(name: string, type: string): LucideIcon {
  const n = name.toLowerCase();
  if (type === "national") return Globe;
  if (type === "province") return Map;
  if (type === "municipality") return MapPin;
  if (n.includes("agrarisch")) return Sprout;
  if (n.includes("bouw")) return Hammer;
  if (n.includes("energie") || n.includes("duurzaamheid")) return Leaf;
  if (n.includes("financieel")) return Banknote;
  if (n.includes("groothandel")) return Warehouse;
  if (n.includes("horeca") || n.includes("food")) return UtensilsCrossed;
  if (n.includes("import") || n.includes("export")) return ArrowLeftRight;
  if (n.includes("productie")) return Factory;
  if (n.includes("retail")) return ShoppingBag;
  if (n.includes("technologie")) return Monitor;
  if (n.includes("transport") || n.includes("logistiek")) return Truck;
  if (n.includes("vastgoed")) return Building;
  if (n.includes("verpakkingen")) return Package;
  if (n.includes("zakelijke dienstverlening")) return Building;
  if (n.includes("zorg")) return HeartPulse;
  return Building;
}
