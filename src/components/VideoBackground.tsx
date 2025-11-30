import React, { useRef, useEffect } from 'react';
import './VideoBackground.css';

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  poster,
  className = '',
  overlay = true,
  overlayOpacity = 0.6,
  children
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Video autoplay failed - this is normal in many browsers
        console.log('Video autoplay was prevented');
      });
    }
  }, []);

  return (
    <div className={`video-background ${className}`}>
      <video
        ref={videoRef}
        className="background-video"
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
      >
        <source src={src} type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        <div className="video-fallback">
          {poster && <img src={poster} alt="Coffee background" />}
        </div>
      </video>
      
      {overlay && (
        <div 
          className="video-overlay"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {children && (
        <div className="video-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default VideoBackground;