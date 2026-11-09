export function localRequest(request: Request, mutation = false) {
  try {
    const url = new URL(request.url);
    const host = request.headers.get('host') ?? url.host;
    const local = new URL(`${url.protocol}//${host}`);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(local.hostname))
      return false;
    if (mutation && request.headers.get('origin') !== local.origin)
      return false;
    return true;
  } catch {
    return false;
  }
}
