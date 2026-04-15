import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import './mermaid.scss';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  er: {
    diagramPadding: 20,
    layoutDirection: 'TB',
    minEntityWidth: 120,
    minEntityHeight: 75,
    entityPadding: 15,
    useMaxWidth: false,
  },
  themeVariables: {
    primaryColor: '#313244',
    primaryTextColor: '#cdd6f4',
    primaryBorderColor: '#6c7086',
    lineColor: '#89b4fa',
    secondaryColor: '#1e1e2e',
    tertiaryColor: '#1e1e2e',
    background: '#1e1e2e',
    mainBkg: '#313244',
    nodeBorder: '#6c7086',
    clusterBkg: '#1e1e2e',
    titleColor: '#cdd6f4',
    edgeLabelBackground: '#1e1e2e',
    attributeBackgroundColorEven: '#45475a',
    attributeBackgroundColorOdd: '#313244',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  securityLevel: 'loose',
});

let _uidCounter = 0;

// Viewbox-based zoom/pan — the SVG is always rendered at native resolution,
// so there is no blurriness at any zoom level.
const Mermaid = ({ chart }) => {
  const svgWrapRef = useRef(null);
  const viewportRef = useRef(null);
  const [error, setError] = useState(null);

  const svgEl = useRef(null);
  const origVB = useRef(null);   // { x, y, w, h } — natural viewBox from mermaid
  const currentVB = useRef(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panStartVB = useRef(null);

  const applyViewBox = useCallback(() => {
    if (!svgEl.current || !currentVB.current) return;
    const { x, y, w, h } = currentVB.current;
    svgEl.current.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }, []);

  const resetViewBox = useCallback(() => {
    if (!origVB.current) return;
    currentVB.current = { ...origVB.current };
    applyViewBox();
  }, [applyViewBox]);

  useEffect(() => {
    if (!svgWrapRef.current || !chart || !chart.trim()) return;

    setError(null);
    svgEl.current = null;
    origVB.current = null;
    currentVB.current = null;

    const uid = `mermaid-${++_uidCounter}`;

    mermaid
      .render(uid, chart)
      .then(({ svg }) => {
        if (!svgWrapRef.current) return;
        svgWrapRef.current.innerHTML = svg;
        const el = svgWrapRef.current.querySelector('svg');
        if (!el) return;

        svgEl.current = el;

        // Parse the viewBox mermaid set on the SVG
        let vbStr = el.getAttribute('viewBox');
        if (!vbStr) {
          const w = parseFloat(el.getAttribute('width')) || 800;
          const h = parseFloat(el.getAttribute('height')) || 600;
          vbStr = `0 0 ${w} ${h}`;
          el.setAttribute('viewBox', vbStr);
        }
        const [vx, vy, vw, vh] = vbStr.trim().split(/[\s,]+/).map(Number);
        origVB.current = { x: vx, y: vy, w: vw, h: vh };
        currentVB.current = { ...origVB.current };

        // Make SVG fill the viewport container so viewBox controls the "camera"
        el.removeAttribute('width');
        el.removeAttribute('height');
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.display = 'block';
      })
      .catch(err => {
        setError('Could not render diagram — check that all table/field names are valid.');
        console.error('Mermaid render error:', err);
      });
  }, [chart]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!currentVB.current || !viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    // Mouse position as fraction of viewport
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    // Zoom in = shrink viewBox; zoom out = expand viewBox
    const factor = e.deltaY < 0 ? 0.88 : 1.14;
    const { x, y, w, h } = currentVB.current;
    const maxW = origVB.current.w * 6;
    const minW = origVB.current.w * 0.08;
    const maxH = origVB.current.h * 6;
    const minH = origVB.current.h * 0.08;

    const newW = Math.min(maxW, Math.max(minW, w * factor));
    const newH = Math.min(maxH, Math.max(minH, h * factor));

    // Anchor the point under the cursor
    const newX = x + mx * (w - newW);
    const newY = y + my * (h - newH);

    currentVB.current = { x: newX, y: newY, w: newW, h: newH };
    applyViewBox();
  }, [applyViewBox]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panStartVB.current = { ...currentVB.current };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current || !currentVB.current || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    // Convert pixel delta to viewBox units
    const dx = ((e.clientX - panStart.current.x) / rect.width) * currentVB.current.w;
    const dy = ((e.clientY - panStart.current.y) / rect.height) * currentVB.current.h;
    currentVB.current = {
      ...panStartVB.current,
      x: panStartVB.current.x - dx,
      y: panStartVB.current.y - dy,
    };
    applyViewBox();
  }, [applyViewBox]);

  const stopPan = useCallback(() => { isPanning.current = false; }, []);

  return (
    <div
      ref={viewportRef}
      className="erd-viewport"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      onDoubleClick={resetViewBox}
    >
      <div ref={svgWrapRef} className="erd-svg-wrap" />
      <div className="erd-hint">scroll to zoom · drag to pan · double-click to reset</div>
      {error && <p className="erd-error">{error}</p>}
    </div>
  );
};

export default Mermaid;
