import { Request } from '@frontastic/extension-types';

export const getPath = (request: Request): string | null => {
  return getHeader(request, 'frontastic-path');
};

export const getLocale = (request: Request): string | null => {
  return getHeader(request, 'frontastic-locale');
};

const getHeader = (request: Request, header: string): string | null => {
  if (header in request.headers) {
    const foundHeader = request.headers[header];
    if (Array.isArray(foundHeader)) {
      return foundHeader[0];
    }
    return foundHeader;
  }

  return null;
};
