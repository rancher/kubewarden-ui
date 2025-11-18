interface ImageMetadata {
  registryURI?: string;
  repository?: string;
  tag?: string;
  [key: string]: any;
}

export function constructImageName(imageMetadata: ImageMetadata): string {
  if (imageMetadata?.registryURI && imageMetadata?.repository && imageMetadata?.tag) {
    return `${ imageMetadata.registryURI }/${ imageMetadata.repository }:${ imageMetadata.tag }`;
  }

  return '';
}
