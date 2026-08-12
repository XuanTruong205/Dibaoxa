import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

export default function CatalogMediaHero({
  titleId,
  title,
  description,
  mediaType = 'image',
  src,
  poster,
  alt,
  variant,
  children,
}) {
  const reduceMotion = useReducedMotion();
  const mediaMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 1.025 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <section
      className={`catalog-media-hero catalog-media-hero--${variant}`}
      aria-labelledby={titleId}
    >
      <div className="catalog-media-hero__media">
        {mediaType === 'video' ? (
          <motion.video
            src={src}
            poster={poster}
            aria-label={alt}
            autoPlay={!reduceMotion}
            loop
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
            {...mediaMotion}
          />
        ) : (
          <motion.img src={src} alt={alt} loading="eager" {...mediaMotion} />
        )}
        <div className="catalog-media-hero__shade" aria-hidden="true" />
      </div>

      <div className="catalog-media-hero__panel">
        <header className="catalog-media-hero__heading">
          <h1 id={titleId}>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
      </div>
    </section>
  );
}
