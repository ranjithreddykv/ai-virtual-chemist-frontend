import { useEffect, useRef } from "react";
import initRDKit from "@rdkit/rdkit"; // adjust import path per package

const RDKitViewer = ({ smiles, width = 300, height = 200 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    initRDKit().then((RDKit) => {
      if (!mounted) return;
      try {
        const mol = RDKit.get_mol(smiles);
        const svg = mol.get_svg(); // returns an SVG string
        if (containerRef.current) containerRef.current.innerHTML = svg;
        mol.delete();
      } catch (err) {
        console.error("RDKit render error:", err);
        if (containerRef.current)
          containerRef.current.innerHTML = "<div>Invalid SMILES</div>";
      }
    });
    return () => {
      mounted = false;
    };
  }, [smiles]);

  return <div ref={containerRef} style={{ width, height }} />;
};
export default RDKitViewer