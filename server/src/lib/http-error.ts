export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: unknown = null
  ) {
    super(message);
    this.name = "HttpError";
  }
}
