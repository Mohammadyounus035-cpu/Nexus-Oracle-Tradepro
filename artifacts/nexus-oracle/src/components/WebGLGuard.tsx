import { useEffect, useState, type ReactNode } from "react";

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

interface WebGLGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function WebGLGuard({ children, fallback }: WebGLGuardProps) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(detectWebGL());
  }, []);

  if (supported === null) {
    return null;
  }

  if (!supported) {
    return (
      <>
        {fallback ?? (
          <div
            className="flex h-full w-full items-center justify-center"
            data-testid="webgl-fallback"
          >
            <div className="text-center font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/70">
              <div className="mb-2 text-cyan-300">3D LATTICE</div>
              <div className="text-[10px] text-cyan-400/40">
                WEBGL CONTEXT UNAVAILABLE
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
