import React from 'react';

interface CodePanelProps {
  audioFeatures: {
    energy?: number;
    beat?: boolean;
  };
}

const CodePanel: React.FC<CodePanelProps> = ({ audioFeatures }) => {
  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-transparent" style={{ background: 'none', position: 'relative' }}>
      <div className="absolute inset-0 z-0 pointer-events-none select-none flex items-center justify-center">
        <img
          src="/assets/watermark3.svg"
          alt="watermark"
          className="w-96 h-96 watermark-transparent"
          style={{
            opacity: 0.22 + (audioFeatures.energy || 0) * 0.18 + (audioFeatures.beat ? 0.12 : 0),
            filter: `drop-shadow(0 0 40px #2d1b69) drop-shadow(0 0 80px #a259ff) drop-shadow(0 0 120px #ff7edb)`,
            transform: `scale(${1 + (audioFeatures.energy || 0) * 0.10 + (audioFeatures.beat ? 0.06 : 0)})`,
            transition: 'transform 0.2s cubic-bezier(.4,2,.6,1), filter 0.2s cubic-bezier(.4,2,.6,1), opacity 0.2s cubic-bezier(.4,2,.6,1)'
          }}
        />
      </div>
    </div>
  );
};

export default CodePanel; 