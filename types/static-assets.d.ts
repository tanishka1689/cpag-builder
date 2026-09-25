declare module '*.svg' {
  import type { StaticImageData } from 'next/image';

  const asset: StaticImageData;
  export default asset;
}

declare module '*.png' {
  import type { StaticImageData } from 'next/image';

  const asset: StaticImageData;
  export default asset;
}
