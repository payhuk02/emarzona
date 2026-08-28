import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

export function PremiumHeroGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    let width = 0;

    if (!canvasRef.current) return;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 1000 * 2,
      height: 1000 * 2,
      phi: 0,
      theta: 0.3,
      dark: 1, // 1 for dark mode
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.15],
      markerColor: [0.78, 0.63, 0.15], // Gold (#c9a227 approx)
      glowColor: [0.48, 0.36, 1], // Purple (#7c5cff approx)
      markers: [
        { location: [48.8566, 2.3522], size: 0.05 }, // Paris
        { location: [40.7128, -74.006], size: 0.1 }, // NY
        { location: [35.6895, 139.6917], size: 0.05 }, // Tokyo
        { location: [51.5074, -0.1278], size: 0.05 }, // London
        { location: [1.3521, 103.8198], size: 0.05 }, // Singapore
        { location: [14.6928, -17.4467], size: 0.05 }, // Dakar
      ],
      onRender: state => {
        // Rotate the globe continuously
        state.phi = phi;
        phi += 0.003;

        // Update width / height for responsiveness
        if (canvasRef.current) {
          state.width = canvasRef.current.offsetWidth * 2;
          state.height = canvasRef.current.offsetWidth * 2;
        }
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[30%] sm:-translate-x-1/4 lg:-translate-x-[20%] w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] lg:w-[1200px] lg:h-[1200px] z-[0] opacity-70 pointer-events-none mix-blend-screen"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', contain: 'layout paint size' }}
      />
    </div>
  );
}
