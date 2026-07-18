"use client";

import { useEffect, useReducer, useRef } from "react";
import { cn } from "@/lib/utils";

export type AddressSuggestion = {
  id: string;
  street: string;
  number: string;
  postcode: string;
  city: string;
  province: string;
  municipality: string;
  display: string;
  shortAddress: string;
};

type PDOKDoc = {
  id?: string;
  type?: string;
  straatnaam?: string;
  postcode?: string;
  huisnummer?: string | number;
  huisletter?: string;
  huisnummer_toevoeging?: string;
  woonplaatsnaam?: string;
  provincienaam?: string;
  gemeentenaam?: string;
  weergavenaam?: string;
};

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  className?: string;
};

type State = {
  suggestions: AddressSuggestion[];
  open: boolean;
  loading: boolean;
};

type Action =
  | { type: "start" }
  | { type: "set"; suggestions: AddressSuggestion[] }
  | { type: "clear" }
  | { type: "close" }
  | { type: "open" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      return { ...state, loading: true };
    case "set":
      return { suggestions: action.suggestions, open: action.suggestions.length > 0, loading: false };
    case "clear":
      return { suggestions: [], open: false, loading: false };
    case "close":
      return { ...state, open: false };
    case "open":
      return { ...state, open: true };
    default:
      return state;
  }
}

function formatPostcode(pc: string) {
  return pc.replace(/^(\d{4})([A-Z]{2})$/i, "$1 $2").toUpperCase();
}

function makeShortAddress(display: string) {
  return display.split(", ")[0] ?? display;
}

export function AddressAutocomplete({ value, onChange, onSelect, className }: AddressAutocompleteProps) {
  const [{ suggestions, open, loading }, dispatch] = useReducer(reducer, {
    suggestions: [],
    open: false,
    loading: false,
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 3) {
      dispatch({ type: "clear" });
      return;
    }
    const timeout = setTimeout(async () => {
      dispatch({ type: "start" });
      try {
        const res = await fetch(
          `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(value)}&rows=5`,
          { headers: { Accept: "application/json" } }
        );
        if (!res.ok) throw new Error("PDOK error");
        const data = await res.json();
        const docs = (data?.response?.docs ?? []).filter(
          (doc: PDOKDoc) => doc.type === "adres" && doc.straatnaam && doc.postcode
        );
        const mapped: AddressSuggestion[] = docs.map((doc: PDOKDoc) => {
          const numberParts = [doc.huisnummer, doc.huisletter, doc.huisnummer_toevoeging]
            .filter(Boolean)
            .map(String);
          const number = numberParts.join("").replace(/\s+/g, "");
          const display = doc.weergavenaam ?? "";
          return {
            id: doc.id ?? Math.random().toString(),
            street: doc.straatnaam ?? "",
            number,
            postcode: formatPostcode(doc.postcode ?? ""),
            city: doc.woonplaatsnaam ?? "",
            province: doc.provincienaam ?? "",
            municipality: doc.gemeentenaam ?? doc.woonplaatsnaam ?? "",
            display,
            shortAddress: makeShortAddress(display),
          };
        });
        dispatch({ type: "set", suggestions: mapped });
      } catch {
        dispatch({ type: "clear" });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        dispatch({ type: "close" });
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length >= 3 && suggestions.length > 0 && dispatch({ type: "open" })}
        placeholder="Adres"
        className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
      />
      {loading && (
        <span className="absolute right-4 top-4 text-xs text-muted">laden…</span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-surface-2 shadow-lg ring-1 ring-border">
          {suggestions.map((s: AddressSuggestion) => (
            <li
              key={s.id}
              onClick={() => {
                onSelect(s);
                onChange(s.shortAddress);
                dispatch({ type: "close" });
              }}
              className="cursor-pointer px-4 py-3 text-sm text-foreground hover:bg-surface-3"
            >
              {s.display}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
