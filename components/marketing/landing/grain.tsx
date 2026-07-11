/**
 * The ~10% grain that sits over every ambient gradient in the system.
 * `id` must be unique per instance so the filters don't collide.
 */
export function Grain({ id, opacity }: { id: string; opacity: number }) {
  return (
    <svg
      className="landing-grain"
      style={{ opacity }}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.82"
          numOctaves={2}
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}
