"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, MapPin, Briefcase, ArrowUpRight, Users, UserCheck, Globe, ChevronRight } from "lucide-react";
import { useApp } from "@/components/app-store";
import { CompanyAvatar } from "@/components/ui/primitives";
import { networkIcon } from "@/lib/network-icon";
import { VyntaPromoCarousel } from "@/components/vynta-promo-carousel";
import { NL_PROVINCES } from "@/lib/dutch-networks";
import type { Company } from "@/lib/types";

const DUTCH_PROVINCE_NAMES = new Set<string>(NL_PROVINCES.map((p) => p.name));

function isDutch(c: Company) {
  if (!c.country) return false;
  const normalized = c.country.toLowerCase().trim();
  const dutchCountry = ["nederland", "netherlands", "nl"].includes(normalized);
  const dutchProvince = !!c.province && DUTCH_PROVINCE_NAMES.has(c.province);
  return dutchCountry && dutchProvince && !!c.city;
}

function sharesNetwork(c: Company, me: Company) {
  if (c.id === me.id) return false;
  const sameMunicipality =
    !!me.municipalityId && !!c.municipalityId && c.municipalityId === me.municipalityId;
  const sameCity =
    !sameMunicipality && !!me.city && !!c.city && c.city.toLowerCase() === me.city.toLowerCase();
  const sameProvince =
    !!me.province && !!c.province && c.province.toLowerCase() === me.province.toLowerCase();
  const sameIndustry =
    !!me.industry && !!c.industry && c.industry.toLowerCase() === me.industry.toLowerCase();
  return sameMunicipality || sameCity || sameProvince || sameIndustry;
}

export function FeedRightColumn() {
  const { me, companies, myNetworks, followingIds } = useApp();
  const companyList = Object.values(companies).filter(isDutch);

  const followedCompanies = Array.from(followingIds)
    .map((id) => companies[id])
    .filter((c): c is Company => !!c && c.id !== me.id && isDutch(c))
    .slice(0, 4);

  const inMunicipality = companyList.filter(
    (c) => c.id !== me.id && c.municipalityId && c.municipalityId === me.municipalityId
  ).slice(0, 4);

  const inProvince = companyList.filter(
    (c) =>
      c.id !== me.id &&
      c.province === me.province &&
      c.municipalityId !== me.municipalityId
  ).slice(0, 4);

  const inSector = companyList.filter(
    (c) =>
      c.id !== me.id &&
      c.industry === me.industry &&
      c.municipalityId !== me.municipalityId &&
      c.province !== me.province
  ).slice(0, 4);

  const newInNetwork = companyList
    .filter((c) => sharesNetwork(c, me))
    .sort((a, b) => new Date(b.memberSince).getTime() - new Date(a.memberSince).getTime())
    .slice(0, 4);

  const shownNetworks = myNetworks.slice(0, 5);

  return (
    <div className="border-l border-border bg-surface px-5 py-7">
      {followedCompanies.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <UserCheck size={14} /> Gevolgde bedrijven
          </h3>
          <div className="flex flex-col gap-2">
            {followedCompanies.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/company/${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                >
                  <CompanyAvatar name={c.name} color={c.logoColor} logoUrl={c.logoUrl} website={c.website} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.industry} · {c.city}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </Link>
              </motion.div>
            ))}
          </div>
          <Link
            href="/following"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-foreground"
          >
            Bekijk alle gevolgde bedrijven <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {newInNetwork.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <Users size={14} /> Nieuwe bedrijven in jouw netwerk
          </h3>
          <div className="flex flex-col gap-2">
            {newInNetwork.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/company/${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                >
                  <CompanyAvatar name={c.name} color={c.logoColor} logoUrl={c.logoUrl} website={c.website} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.industry} · {c.city}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {inMunicipality.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <MapPin size={14} /> Actief in jouw gemeente
          </h3>
          <div className="flex flex-col gap-2">
            {inMunicipality.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/company/${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                >
                  <CompanyAvatar name={c.name} color={c.logoColor} logoUrl={c.logoUrl} website={c.website} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.industry} · {c.city}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {inProvince.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <Building2 size={14} /> Populair in jouw provincie
          </h3>
          <div className="flex flex-col gap-2">
            {inProvince.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/company/${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                >
                  <CompanyAvatar name={c.name} color={c.logoColor} logoUrl={c.logoUrl} website={c.website} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.industry} · {c.city}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {inSector.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <Briefcase size={14} /> Relevant voor jouw sector
          </h3>
          <div className="flex flex-col gap-2">
            {inSector.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/company/${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                >
                  <CompanyAvatar name={c.name} color={c.logoColor} logoUrl={c.logoUrl} website={c.website} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.city} · {c.industry}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-muted" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {shownNetworks.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <Globe size={14} /> Jouw netwerken
          </h3>
          <div className="flex flex-col gap-2">
            {shownNetworks.map((n, i) => {
              const NetIcon = networkIcon(n.name, n.type);
              return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/networks/${n.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-muted">
                    <NetIcon size={20} strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{n.name}</p>
                    <p className="truncate text-xs text-muted">
                      {n.type === "municipality" ? "Gemeente" : n.type === "province" ? "Provincie" : n.type === "industry" ? "Branche" : "Landelijk"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          </div>
          <Link
            href="/networks/joined"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-foreground"
          >
            Bekijk al jouw netwerken <ChevronRight size={14} />
          </Link>
        </div>
      )}

      <div className="mt-6">
        <VyntaPromoCarousel variant="sidebar" />
      </div>
    </div>
  );
}

