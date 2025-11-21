// MoleculeViewer3D.jsx
import React, { useEffect, useRef } from "react";

const MoleculeViewer3D = ({
  molData,
  moleculeName = "",
  highlightAtoms = [],
  animateHighlight = false,
  autoRotate = true,
  fadeIn = true,
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const rotationRef = useRef(null);
  const pulseRef = useRef(null);

  // (1) Init Viewer
  useEffect(() => {
    if (!molData || !window.$3Dmol || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const viewer = window.$3Dmol.createViewer(containerRef.current, {
      backgroundColor: "white",
    });

    viewer.addModel(molData, "mol");
    viewer.setStyle({}, { stick: { radius: 0.18 }, sphere: { scale: 0.28 } });
    viewer.zoomTo();
    viewer.render();

    viewerRef.current = viewer;

    // Fade-in animation
    if (fadeIn) {
      containerRef.current.style.opacity = 0;
      setTimeout(() => {
        containerRef.current.style.transition = "opacity 0.8s ease";
        containerRef.current.style.opacity = 1;
      }, 50);
    }

    return () => {
      clearInterval(rotationRef.current);
      clearInterval(pulseRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [molData]);

  // (2) Auto-Rotate the molecule
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    clearInterval(rotationRef.current);

    if (autoRotate) {
      rotationRef.current = setInterval(() => {
        viewer.rotate(1); // rotates 1 degree per frame
        viewer.render();
      }, 40);
    }
  }, [autoRotate]);

  // (3) Highlight / pulse selected atoms
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    clearInterval(pulseRef.current);

    viewer.setStyle({}, { stick: { radius: 0.18 }, sphere: { scale: 0.28 } });

    if (!highlightAtoms.length) {
      viewer.render();
      return;
    }

    const serials = highlightAtoms.map((i) => i + 1);

    const applyFrame = (pulse) => {
      viewer.setStyle({}, { stick: { radius: 0.18 }, sphere: { scale: 0.28 } });

      viewer.setStyle(
        { not: { serial: serials } },
        { stick: { radius: 0.18, color: "lightgray" }, sphere: { scale: 0.24 } }
      );

      viewer.setStyle(
        { serial: serials },
        {
          stick: {
            radius: pulse ? 0.34 : 0.26,
            color: pulse ? "red" : "orange",
          },
          sphere: {
            scale: pulse ? 0.52 : 0.42,
            color: pulse ? "red" : "orange",
          },
        }
      );
      viewer.render();
    };

    applyFrame(false);

    if (animateHighlight) {
      let pulse = false;
      pulseRef.current = setInterval(() => {
        applyFrame(pulse);
        pulse = !pulse;
      }, 700);
    }

    return () => clearInterval(pulseRef.current);
  }, [highlightAtoms, animateHighlight]);

  return (
    <div style={{ position: "relative" }}>
      {/* Molecule Name Label */}
      {moleculeName && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "12px",
            background: "rgba(0,0,0,0.55)",
            color: "white",
            padding: "4px 8px",
            fontSize: "14px",
            borderRadius: "6px",
            zIndex: 10,
          }}
        >
          {moleculeName}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "350px",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default MoleculeViewer3D;
