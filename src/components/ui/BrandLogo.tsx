/**
 * Brand logo — renders the site logo from `/brand/logo.svg`.
 *
 * Drop your own SVG/PNG into `public/brand/logo.svg` (or `.png`) and it will
 * be used across the app automatically. See `public/brand/README.md`.
 */
export function BrandLogo({
  className = "h-10 w-10",
  alt = "Safha",
  src = "/brand/logo.svg"
}: {
  className?: string;
  alt?: string;
  src?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`object-contain ${className}`}
    />
  );
}