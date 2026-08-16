"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Réduit automatiquement la taille de police d'un texte pour qu'il ne déborde jamais de son
 * conteneur direct (largeur et hauteur), en partant de `maxFontSizePx` et en descendant par pas
 * jusqu'à `minFontSizePx`. Le conteneur parent doit avoir une largeur/hauteur déterminée (flex
 * stretch, dimensions fixes…) pour que la mesure soit fiable.
 */
export function FitText({ children, maxFontSizePx, minFontSizePx = 8, className, style, singleLine = true }: {
  children: ReactNode;
  maxFontSizePx: number;
  minFontSizePx?: number;
  className?: string;
  style?: CSSProperties;
  singleLine?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSizePx);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const parent = container?.parentElement;
    if (!container || !parent) return;
    const parentStyle = window.getComputedStyle(parent);
    const availableWidth = parent.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight);
    const availableHeight = parent.clientHeight - parseFloat(parentStyle.paddingTop) - parseFloat(parentStyle.paddingBottom);
    let size = maxFontSizePx;
    container.style.fontSize = `${size}px`;
    const fits = () => container.scrollWidth <= availableWidth && container.scrollHeight <= availableHeight;
    while (size > minFontSizePx && !fits()) {
      size = Math.max(minFontSizePx, size - 2);
      container.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, [children, maxFontSizePx, minFontSizePx, singleLine]);

  return <div ref={containerRef} className={className} style={{ ...style, fontSize, whiteSpace: singleLine ? "nowrap" : "normal", lineHeight: 1.05, overflow: "hidden" }}>{children}</div>;
}
