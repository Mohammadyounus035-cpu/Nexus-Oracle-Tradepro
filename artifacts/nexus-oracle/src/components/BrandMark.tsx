export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-[0_0_8px_rgba(0,212,255,0.8)] ${className}`}
    >
      <path d="M16 2L2 10V22L16 30L30 22V10L16 2Z" stroke="currentColor" strokeWidth="2" className="text-primary" />
      <path d="M16 6L6 12V20L16 26L26 20V12L16 6Z" stroke="currentColor" strokeWidth="1" className="text-accent" />
      <circle cx="16" cy="16" r="3" fill="currentColor" className="text-primary animate-pulse" />
    </svg>
  );
}
