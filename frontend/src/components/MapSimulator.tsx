import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Compass, ShieldAlert, Cpu } from 'lucide-react';

interface MapSimulatorProps {
  pickupLat?: number;
  pickupLng?: number;
  pickupAddress?: string;
  dropLat?: number;
  dropLng?: number;
  dropAddress?: string;
  driverLat?: number;
  driverLng?: number;
  rideStatus?: string;
  showNearbyDrivers?: boolean;
  vehicleCategory?: string;
  heightClass?: string;
}

export const MapSimulator: React.FC<MapSimulatorProps> = ({
  pickupLat = 28.6139,
  pickupLng = 77.2090,
  pickupAddress = 'Current Location',
  dropLat = 28.5355,
  dropLng = 77.3910,
  dropAddress = 'Destination',
  driverLat,
  driverLng,
  rideStatus = 'REQUESTED',
  showNearbyDrivers = true,
  vehicleCategory = 'MINI',
  heightClass = 'h-[460px]'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0.15);

  // Animation loop simulating live driver movement
  useEffect(() => {
    let animId: number;
    let currentP = 0.1;

    const animate = () => {
      currentP += 0.0018;
      if (currentP > 0.95) currentP = 0.1;
      setProgress(currentP);
      animId = requestAnimationFrame(animate);
    };

    if (rideStatus === 'IN_PROGRESS' || rideStatus === 'ACCEPTED' || rideStatus === 'ARRIVED') {
      animId = requestAnimationFrame(animate);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [rideStatus]);

  // Canvas drawing: Red & Black Cyber AI Map Theme (inspired by microprocessor circuit image)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 600;
    const height = canvas.parentElement?.clientHeight || 460;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 1. Draw Deep Black & Yellow Mobility Map Background
    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, width, height);

    // Grid Circuits
    ctx.strokeStyle = '#16161f';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Circuit Traces in Background
    const drawTrace = (startX: number, startY: number, midX: number, endX: number, endY: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(midX, startY);
      ctx.lineTo(midX + 20, startY + (endY > startY ? 20 : -20));
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Terminal node dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawTrace(width * 0.1, height * 0.15, width * 0.25, width * 0.35, height * 0.08, 'rgba(250, 204, 21, 0.35)');
    drawTrace(width * 0.85, height * 0.8, width * 0.7, width * 0.55, height * 0.9, 'rgba(234, 179, 8, 0.35)');
    drawTrace(width * 0.9, height * 0.2, width * 0.75, width * 0.65, height * 0.15, 'rgba(250, 204, 21, 0.3)');

    // Simulated River / Cyan Metro Transit Line
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.bezierCurveTo(width * 0.4, height * 0.75, width * 0.7, height * 0.45, width, height * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Define Route Path
    const pX = width * 0.22;
    const pY = height * 0.72;
    const dX = width * 0.78;
    const dY = height * 0.25;

    const cp1X = width * 0.35;
    const cp1Y = height * 0.45;
    const cp2X = width * 0.65;
    const cp2Y = height * 0.55;

    // Glowing Yellow Outer Shadow
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(pX, pY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, dX, dY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(pX, pY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, dX, dY);
    ctx.stroke();

    // Core Yellow Route Line
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(pX, pY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, dX, dY);
    ctx.stroke();

    // 3. Draw Nearby Idle Fleet (Dark glowing markers)
    if (showNearbyDrivers) {
      const idleCars = [
        { x: width * 0.18, y: height * 0.42, type: 'Bike' },
        { x: width * 0.45, y: height * 0.78, type: 'Auto' },
        { x: width * 0.62, y: height * 0.32, type: 'Sedan' },
        { x: width * 0.82, y: height * 0.68, type: 'Mini' }
      ];

      idleCars.forEach((c) => {
        ctx.fillStyle = '#141418';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#2d2d38';
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.type[0], c.x, c.y + 3);
      });
    }

    // 4. Pickup Pin (Glowing Neon Cyan node)
    ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
    ctx.beginPath();
    ctx.arc(pX, pY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(pX, pY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pX, pY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Dropoff Pin (Glowing Yellow Mobility Target Node)
    ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.fillRect(dX - 10, dY - 10, 20, 20);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(dX - 6, dY - 6, 12, 12);
    ctx.fillStyle = '#000000';
    ctx.fillRect(dX - 2.5, dY - 2.5, 5, 5);

    // 6. Active Moving Vehicle Marker with Glowing Pulse
    const t = Math.min(Math.max(progress, 0.05), 0.95);
    const u = 1 - t;
    const vX = u * u * u * pX + 3 * u * u * t * cp1X + 3 * u * t * t * cp2X + t * t * t * dX;
    const vY = u * u * u * pY + 3 * u * u * t * cp1Y + 3 * u * t * t * cp2Y + t * t * t * dY;

    // Glowing Radar Waves
    ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.beginPath();
    ctx.arc(vX, vY, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.beginPath();
    ctx.arc(vX, vY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Core Vehicle Pod
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(vX, vY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚗', vX, vY + 3);
  }, [progress, pickupAddress, dropAddress, rideStatus, showNearbyDrivers]);

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden rounded-3xl border border-yellow-500/25 bg-[#07070a] shadow-[0_0_30px_rgba(0,0,0,0.8)]`}>
      <canvas ref={canvasRef} className="h-full w-full block" />

      {/* Floating Info Overlay (Cyber Yellow Glassmorphism) */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0e0e13]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-yellow-500/30 text-xs font-semibold text-gray-200 shadow-neon-yellow-sm">
          <Cpu className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          <span>AI Neural Navigation</span>
          <span className="text-gray-600">|</span>
          <span className="text-yellow-400 font-bold">Delhi NCR Fleet</span>
        </div>

        <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-black px-3.5 py-1.5 rounded-full text-xs font-black shadow-neon-yellow-sm">
          <Navigation className="w-3.5 h-3.5 text-black" />
          <span>ETA: 12 mins</span>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setProgress(0.1)}
          className="p-2.5 bg-[#0e0e13]/90 backdrop-blur hover:bg-[#1a1a24] rounded-xl border border-yellow-500/30 text-yellow-400 shadow-md transition"
          title="Recenter Neural Radar"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Ride progress pill */}
      {rideStatus && rideStatus !== 'COMPLETED' && (
        <div className="absolute bottom-4 left-4 bg-[#0e0e13]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-yellow-500/30 shadow-neon-yellow-sm flex items-center gap-3">
          <div className="p-2 bg-yellow-400/10 border border-yellow-400/40 rounded-xl">
            <MapPin className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xs">
            <p className="font-black text-white capitalize tracking-wide">{rideStatus.replace('_', ' ').toLowerCase()}</p>
            <p className="text-gray-400 truncate max-w-[200px]">{dropAddress}</p>
          </div>
        </div>
      )}
    </div>
  );
};
