import React from 'react';

interface NeonCityReactiveBackgroundProps {
  audioFeatures: {
    energy?: number;
    beat?: boolean;
  };
}

const NeonCityReactiveBackground: React.FC<NeonCityReactiveBackgroundProps> = ({ audioFeatures }) => {
  const energy = audioFeatures?.energy || 0;
  const beat = audioFeatures?.beat ? 1 : 0;
  const scale = 1 + energy * 0.18 + beat * 0.08;
  const opacity = 0.18 + energy * 0.22 + beat * 0.12;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none select-none"
      style={{
        background: 'none',
        mixBlendMode: 'screen',
        transition: 'opacity 0.2s, transform 0.2s, filter 0.2s',
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(16px)`
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 60% 60%, #ff2e97 0%, transparent 70%),
            radial-gradient(circle at 40% 40%, #42c6ff 0%, transparent 70%),
            radial-gradient(circle at 50% 50%, #7984d1 0%, transparent 80%)
          `,
          width: '100%',
          height: '100%',
          opacity: 1,
        }}
      />
    </div>
  );
};

export default NeonCityReactiveBackground; 