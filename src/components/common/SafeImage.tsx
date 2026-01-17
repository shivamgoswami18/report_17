"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";
import fallbackPng from "@/assets/images/fallBack.png";

interface SafeImageProps extends ImageProps {
  fallbackSrc?: ImageProps["src"];
}

export default function SafeImage({ src, fallbackSrc = fallbackPng, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<ImageProps["src"]>(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
