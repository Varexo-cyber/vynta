import type { Network } from "./types";

export function networkEmoji(network: Network): string {
  if (network.type === "national") return "🇳🇱";
  if (network.type === "province") return "🗺️";
  if (network.type === "municipality") return "📍";
  const name = network.name.toLowerCase();
  if (name.includes("bouw")) return "🏗️";
  if (name.includes("horeca") || name.includes("food")) return "🍽️";
  if (name.includes("productie")) return "🏭";
  if (name.includes("retail")) return "🛍️";
  if (name.includes("technologie")) return "💻";
  if (name.includes("transport") || name.includes("logistiek")) return "🚚";
  if (name.includes("verpakkingen")) return "📦";
  if (name.includes("zorg")) return "🏥";
  if (name.includes("import") || name.includes("export")) return "↔️";
  if (name.includes("financieel")) return "💼";
  if (name.includes("agrarisch")) return "🌾";
  if (name.includes("vastgoed")) return "🏢";
  if (name.includes("zakelijke dienstverlening")) return "🧾";
  if (name.includes("groothandel")) return "🏬";
  if (name.includes("energie") || name.includes("duurzaamheid")) return "🌱";
  return "🌐";
}
