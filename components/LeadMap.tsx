"use client";

import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, MapPinned, Phone, Sparkles } from "lucide-react";
import { Lead } from "@/lib/types";
import { Badge, IssueBadge, ScorePill } from "@/components/ui";

function getMarkerTone(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

function hasCoordinates(lead: Lead) {
  return Number.isFinite(lead.coordinates.latitude) && Number.isFinite(lead.coordinates.longitude) && lead.coordinates.latitude !== 0 && lead.coordinates.longitude !== 0;
}

export function LeadMap({
  leads,
  activeLeadId,
  onSelectLead,
  onViewLead
}: {
  leads: Lead[];
  activeLeadId?: string;
  onSelectLead?: (lead: Lead) => void;
  onViewLead?: (lead: Lead) => void;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<MapboxMarker[]>([]);
  const markerNodesRef = useRef(new Map<string, HTMLButtonElement>());
  const onSelectLeadRef = useRef(onSelectLead);
  const boundsKeyRef = useRef<string | null>(null);
  const validLeads = useMemo(() => leads.filter(hasCoordinates), [leads]);
  const [focusedLead, setFocusedLead] = useState<Lead | null>(validLeads[0] ?? leads[0] ?? null);

  useEffect(() => {
    onSelectLeadRef.current = onSelectLead;
  }, [onSelectLead]);

  useEffect(() => {
    if (!validLeads.length && leads.length) {
      setFocusedLead(leads[0]);
      return;
    }

    if (activeLeadId) {
      const nextLead = leads.find((lead) => lead.id === activeLeadId);
      if (nextLead) {
        setFocusedLead(nextLead);
      }
      return;
    }

    if (validLeads.length) {
      setFocusedLead((current) => current ?? validLeads[0]);
    }
  }, [activeLeadId, leads, validLeads]);

  useEffect(() => {
    let isCancelled = false;

    if (!token || !mapContainerRef.current || !validLeads.length) {
      return;
    }

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (isCancelled) {
        return;
      }

      mapboxgl.accessToken = token;

      if (!mapRef.current) {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          attributionControl: false
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
      }

      const map = mapRef.current;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      markerNodesRef.current.clear();

      const bounds = new mapboxgl.LngLatBounds();
      const boundsKey = validLeads
        .map((lead) => `${lead.id}:${lead.coordinates.latitude}:${lead.coordinates.longitude}`)
        .join("|");

      validLeads.forEach((lead) => {
        bounds.extend([lead.coordinates.longitude, lead.coordinates.latitude]);

        const markerNode = document.createElement("button");
        markerNode.type = "button";
        markerNode.className = "lead-map-marker";
        markerNode.style.setProperty("--marker-color", getMarkerTone(lead.leadScore));
        markerNode.setAttribute("aria-label", `${lead.businessName} marker`);
        markerNode.onclick = () => {
          setFocusedLead(lead);
          onSelectLeadRef.current?.(lead);
        };
        markerNodesRef.current.set(lead.id, markerNode);

        const marker = new mapboxgl.Marker({ element: markerNode, anchor: "center" })
          .setLngLat([lead.coordinates.longitude, lead.coordinates.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });

      if (!bounds.isEmpty() && boundsKeyRef.current !== boundsKey) {
        map.fitBounds(bounds, {
          padding: 64,
          maxZoom: 12,
          duration: 0
        });
        boundsKeyRef.current = boundsKey;
      }
    };

    void initMap();

    return () => {
      isCancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [token, validLeads]);

  useEffect(() => {
    markerNodesRef.current.forEach((node, leadId) => {
      node.classList.toggle("is-active", leadId === focusedLead?.id);
    });
  }, [focusedLead]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerNodesRef.current.clear();
    };
  }, []);

  const fallbackPositions = useMemo(() => {
    if (!validLeads.length) {
      return [];
    }

    const latitudes = validLeads.map((lead) => lead.coordinates.latitude);
    const longitudes = validLeads.map((lead) => lead.coordinates.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return validLeads.map((lead) => {
      const x = ((lead.coordinates.longitude - minLng) / Math.max(maxLng - minLng, 0.0001)) * 74 + 10;
      const y = ((maxLat - lead.coordinates.latitude) / Math.max(maxLat - minLat, 0.0001)) * 68 + 14;

      return { lead, x, y };
    });
  }, [validLeads]);

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.78fr)]">
      <div className="map-stage overflow-hidden rounded-[24px] border border-white/8">
        {token && validLeads.length ? (
          <div ref={mapContainerRef} className="h-[420px] w-full md:h-[520px] xl:h-[620px] 2xl:h-[680px]" />
        ) : (
          <div className="lead-map-fallback">
            <div className="lead-map-fallback__header">
              <div>
                <p className="eyebrow">Lead geography</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Market coverage map</h3>
              </div>
              <Badge tone="info">Mapbox ready</Badge>
            </div>
            <div className="lead-map-fallback__canvas">
              {fallbackPositions.map(({ lead, x, y }) => (
                <button
                  key={lead.id}
                  type="button"
                  className={`lead-map-fallback__marker ${focusedLead?.id === lead.id ? "is-active" : ""}`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    backgroundColor: getMarkerTone(lead.leadScore)
                  }}
                  onClick={() => {
                    setFocusedLead(lead);
                    onSelectLeadRef.current?.(lead);
                  }}
                >
                  <span>{lead.businessName}</span>
                </button>
              ))}
              <div className="lead-map-fallback__legend">
                <span><i style={{ backgroundColor: "#22c55e" }} /> High</span>
                <span><i style={{ backgroundColor: "#f59e0b" }} /> Medium</span>
                <span><i style={{ backgroundColor: "#f43f5e" }} /> Low</span>
              </div>
            </div>
            <p className="px-5 pb-5 text-sm text-slate-300">
              Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to enable the live Mapbox canvas with pan, zoom, and native markers.
            </p>
          </div>
        )}
      </div>

      <aside className="surface-primary rounded-[24px] p-5 2xl:sticky 2xl:top-[104px]">
        {focusedLead ? (
          <div className="grid gap-5">
            <div className="grid gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">Selected lead</p>
                  <h3 className="mt-2 text-xl font-semibold leading-tight text-white">{focusedLead.businessName}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{focusedLead.address}</p>
                </div>
                <ScorePill score={focusedLead.leadScore} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{focusedLead.opportunityType}</Badge>
                <Badge>{focusedLead.reviewCount} reviews</Badge>
              </div>
            </div>

            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Opportunity angle</p>
              <p className="mt-2 text-sm leading-6 text-white">{focusedLead.opportunityInsight}</p>
            </div>

            <div className="grid gap-3">
              <p className="meta-text text-slate-400">Detected issues</p>
              <div className="flex flex-wrap gap-2">
                {focusedLead.issueLabels.map((issue) => (
                  <IssueBadge key={issue} issue={issue} />
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cyan-300" />
                <span>{focusedLead.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-cyan-300" />
                <span className="break-all">{focusedLead.website}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinned className="h-4 w-4 text-cyan-300" />
                <span>{focusedLead.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>{focusedLead.pitch.serviceSuggestion}</span>
              </div>
            </div>

            {onViewLead ? (
              <button
                type="button"
                onClick={() => onViewLead(focusedLead)}
                className="glass-button inline-flex h-[46px] items-center justify-center rounded-full border border-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
              >
                Open full lead detail
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid h-full place-items-center rounded-[20px] border border-dashed border-white/10 px-6 py-12 text-center text-slate-400">
            No mapped leads available for this scan.
          </div>
        )}
      </aside>
    </div>
  );
}
