import React, { useState, useEffect } from 'react';

interface BackgroundImageSlideshowProps {
  audioFeatures?: {
    bpm?: number;
    energy?: number;
    beat?: boolean;
  };
}

const BackgroundImageSlideshow: React.FC<BackgroundImageSlideshowProps> = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [photoboothImages, setPhotoboothImages] = useState<string[]>([]);

  // Load all JPEG images from the assets folder
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Use all available JPEG images from the assets folder
        const imageList = [
          '/assets/9447E52C-5508-4FA6-9746-2A8A79693D2F_1_102_o.jpeg',
          '/assets/2AC08C88-8765-414B-8B55-E0BD9ECA1FA3_1_102_o.jpeg',
          '/assets/BSKY611B635C-297F-4077-8344-6B13B255AA22_1_105_c.jpeg',
          '/assets/bsky1CD25554-5C00-430F-8B35-DB5F9511F28B_1_105_c.jpeg',
          '/assets/BSKYBAF933DF-FF11-468C-B18F-73D57AD51B29_1_105_c.jpeg',
          '/assets/63FF8E71-7E86-4EFD-A517-B3CE25B6594C_1_102_o.jpeg',
          '/assets/BSKYAE8163FF-C228-4B10-83BD-00CCDB6FAE09_1_105_c.jpeg',
          '/assets/7E5388E1-75B0-4159-BC3A-522436CF9FF2_1_102_o.jpeg',
          '/assets/3A507A72-5DDB-4666-AD90-37D07ACC32DC_4_5005_c.jpeg',
          '/assets/BSKYAFA97133-09C0-4920-9C1E-E811CA252438_1_105_c.jpeg',
          '/assets/A725F8A8-9D51-4F45-B699-9033D972BC03_1_102_o.jpeg',
          '/assets/33B7E71B-E736-4FA0-8329-A3AAB5C78EB6_1_102_o.jpeg',
          '/assets/9355C2FB-56CA-4CBC-9135-393D1A37043E_1_102_o.jpeg',
          '/assets/BSKYD3371870-9579-4229-A9D7-C6F514E6FCD3_1_102_o.jpeg',
          '/assets/BSKYFBB05F62-F957-496C-A8E3-E79C76F8AF63.jpeg',
          '/assets/0AEFADB0-C04B-4DE1-B5F9-630F77FA9F38_1_102_o.jpeg',
          '/assets/BSKYD29AD23A-0F1E-420D-8E4B-2E8B047AC0A5_4_5005_c.jpeg',
          '/assets/9853FE0D-6B26-461E-B581-7E203EFC689C_1_102_o.jpeg',
          '/assets/60F44EE5-D162-47A2-9839-2202F0DBBD61_4_5005_c.jpeg',
          '/assets/AEC8782A-E93B-4339-8C2A-45BF0E105095_1_102_o.jpeg',
          '/assets/209F5EAC-B079-43B4-A724-98E48791CC4B_1_102_o.jpeg',
          '/assets/E5D9C0B3-74B9-4421-9A00-18E97266134B_1_102_o.jpeg',
          '/assets/DA53CA08-BE6D-46D7-8B50-61D97ED0E56E_1_102_o.jpeg',
          '/assets/DBF14154-820C-4AD8-90EE-BD74A2DBAA8B_1_102_o.jpeg',
          '/assets/BSKYD64CA4D1-C7C5-463D-B78A-AA3B410D370D_1_105_c.jpeg',
          '/assets/BSKYFB856743-944E-4CF5-A080-EAA238D0ADF4_1_105_c.jpeg',
          '/assets/BSKYD14DC0DA-D5B0-4B2E-92B4-8A6422D1D05B_1_105_c.jpeg',
          '/assets/BSKYC0520CDE-F009-43FA-9153-2B3DCA914689_1_105_c.jpeg',
          '/assets/BSKYBFBE13ED-7964-42BF-A678-309BDCF48426_1_105_c.jpeg',
          '/assets/BSKYB85FBA28-4DDA-4339-A071-ED4140D64D4E_1_105_c.jpeg',
          '/assets/BSKYBA3E71CC-90C2-46CB-8C4C-8FCFCBD9E0E5_1_105_c.jpeg',
          '/assets/BSKYA88FFF1A-1280-418A-999D-B36B4C4D7F5A_1_105_c.jpeg',
          '/assets/BSKY951D1048-9C48-4E6C-B764-C7281C37D5A6_1_105_c.jpeg',
          '/assets/BSKY7E7BA97A-22EA-4CE2-B24B-C7D63F6470DD_1_105_c.jpeg',
          '/assets/BSKY874464D6-7CFC-49C0-9CC8-1AF01B51C7C7_1_105_c.jpeg',
          '/assets/BSKY6DCC9D76-50AA-41EE-9CFF-6440AFCDCA23_1_105_c.jpeg',
          '/assets/BSKY58600325-7F01-4054-9592-A4E757963D49_1_105_c.jpeg',
          '/assets/BSKY458FC694-D7E5-44AD-A24B-7D9C1A4F91F0_1_105_c.jpeg',
          '/assets/BSKY4750B409-2EAE-40A7-951E-BB1037705162_1_105_c.jpeg',
          '/assets/BSKY20B9CF18-2E51-4875-8C73-15E75D3AA24F_1_105_c.jpeg',
          '/assets/BSKY3442D88E-A7A8-4E7A-81FC-BC9E99A659DD_4_5005_c.jpeg',
          '/assets/BSKY3E25E9B2-A586-41A5-B283-2C8ECD2653E1_1_105_c.jpeg',
          '/assets/BSKY1E6D8F5E-982F-4910-AE51-BEE6D62BCE49_4_5005_c.jpeg',
          '/assets/BSKY0923E51B-105F-483E-BDE7-D6426CECC1AF_1_105_c.jpeg',
          '/assets/B6752934-CB42-4DB7-8B2F-4E93C5B591DD_4_5005_c.jpeg',
          '/assets/BD546364-0EFB-41CC-872C-A159AF5217D6_1_102_o.jpeg',
          '/assets/AF7C42C6-1F0D-4F03-9DFB-9CE03BDA923A_1_102_o.jpeg',
          '/assets/A590E9EA-6C6E-47BB-8D92-A49D56451311_1_102_o.jpeg',
          '/assets/748406B0-6FF1-4578-A699-92D6945ECFD9_1_102_o.jpeg',
          '/assets/7C15E7CC-9C32-42BE-8C7D-71AE4B10DB38_1_102_o.jpeg',
          '/assets/704FB5C2-AFEC-4E73-93F9-96BD902146FD_1_102_o.jpeg',
          '/assets/6C7C4C42-B999-40EF-96F9-DC74299E2D9E_1_102_o.jpeg',
          '/assets/5D8F5D19-1626-42AC-8220-ABF58769B9EC_1_102_o.jpeg',
          '/assets/5DA8AF60-BF30-4F6E-A56E-D5AF5BF7DF13_1_102_o.jpeg',
          '/assets/51E39AD0-B009-44BE-9D84-B96DEEA41D10_1_102_o.jpeg',
          '/assets/44491F82-DA89-40E0-AD83-EB7CBD56B2F2_1_102_o.jpeg',
          '/assets/4997D791-ACDD-4A20-A52E-471A5DDE95B1_1_102_o.jpeg',
          '/assets/2D55A891-D9AD-462F-B724-2C2DD8B2A827_1_102_o.jpeg',
          '/assets/2EAE4DF8-CBB6-4D67-85E9-4C8DC1BC19BA_1_102_o.jpeg',
          '/assets/19CE3610-48D3-4C5E-94FB-AA8B0C0BC04F_1_102_o.jpeg',
          '/assets/281093D4-165C-4AA9-B794-6323F03ABEAE_1_102_o.jpeg',
          '/assets/046043D3-3EC3-4EFE-98E5-4B64CC2C07C7_1_102_o.jpeg',
        ];
        setImages(imageList);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    loadImages();
  }, []);

  // Handle photobooth transitions - 10 seconds show, 10 seconds hide
  useEffect(() => {
    if (images.length === 0) return;

    const showDuration = 10000; // 10 seconds showing photobooth strip
    const hideDuration = 10000; // 10 seconds no image
    let isShowing = true;

    const interval = setInterval(() => {
      if (isShowing) {
        // Hide the photobooth strip
        setIsTransitioning(true);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 500); // Fade out duration
        isShowing = false;
      } else {
        // Show next set of 3 images
        setCurrentImageIndex((prevIndex) => (prevIndex + 3) % images.length);
        setIsTransitioning(false);
        isShowing = true;
      }
    }, isShowing ? showDuration : hideDuration);

    return () => clearInterval(interval);
  }, [images.length]);

  // Update photobooth images when currentImageIndex changes
  useEffect(() => {
    if (images.length === 0) return;
    
    const newPhotoboothImages = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentImageIndex + i) % images.length;
      newPhotoboothImages.push(images[index]);
    }
    setPhotoboothImages(newPhotoboothImages);
  }, [currentImageIndex, images]);

  if (images.length === 0 || photoboothImages.length === 0) return null;

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
      <div 
        className={`transition-opacity duration-500 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-30'
        }`}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '80vw',
          maxHeight: '80vh',
        }}
      >
        {/* Photobooth strip container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'rgba(0,0,0,0.8)',
          padding: '16px 12px',
          borderRadius: '8px',
          boxShadow: '0 0 15px rgba(147, 51, 234, 0.4), 0 8px 25px rgba(0,0,0,0.5)',
        }}>
          {photoboothImages.map((image, index) => {
            const isBSKY = image.toLowerCase().includes('bsky');
            
            return (
              <div key={index} style={{ position: 'relative' }}>
                {isBSKY ? (
                  // BSKY images: Polaroid border + film reel effect
                  <div 
                    style={{
                      background: 'rgba(0,0,0,0.9)',
                      padding: '6px 6px 30px 6px', // Smaller padding for photobooth
                      borderRadius: '6px',
                      boxShadow: '0 0 6px rgba(147, 51, 234, 0.6), 0 0 8px rgba(59, 130, 246, 0.4)',
                      transform: 'rotate(-0.5deg)',
                      position: 'relative',
                    }}
                  >
                    {/* Film reel holes on top and bottom */}
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0 15px',
                      zIndex: 2,
                    }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }} />
                      ))}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0 15px',
                      zIndex: 2,
                    }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }} />
                      ))}
                    </div>
                    <img
                      src={image}
                      alt="Background"
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '3px',
                        display: 'block',
                      }}
                      onError={(e) => {
                        console.warn('Failed to load image:', image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Text area at bottom like real Polaroid */}
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        right: '6px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {/* Optional: Add text here if needed */}
                    </div>
                  </div>
                ) : (
                  // Regular images: Just film reel effect (no Polaroid border)
                  <div
                    style={{
                      position: 'relative',
                      padding: '12px 6px',
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: '3px',
                      boxShadow: '0 0 6px rgba(236, 72, 153, 0.5), 0 0 8px rgba(147, 51, 234, 0.3)',
                    }}
                  >
                    {/* Film reel holes on top */}
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0 15px',
                      zIndex: 2,
                    }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }} />
                      ))}
                    </div>
                    {/* Film reel holes on bottom */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100%',
                      height: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0 15px',
                      zIndex: 2,
                    }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }} />
                      ))}
                    </div>
                    <img
                      src={image}
                      alt="Background"
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '2px',
                        display: 'block',
                      }}
                      onError={(e) => {
                        console.warn('Failed to load image:', image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BackgroundImageSlideshow; 