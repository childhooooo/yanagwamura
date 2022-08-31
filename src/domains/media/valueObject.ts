export type GenerateMediaVariables = {
  name: string;
  url: string;
  size: number;
  mediaType: string;
};

export class Media {
  constructor(
    public readonly name: string,
    public readonly url: string,
    public readonly size: number,
    public readonly mediaType: string
  ) {}

  static generate({
    name,
    url,
    size,
    mediaType,
  }: GenerateMediaVariables): Media {
    return new Media(name, url, size, mediaType);
  }
}
