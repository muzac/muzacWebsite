export const checkOrigin = (referer: string): boolean => {
  const allowedDomains = [
    'https://muzac.com.tr',
    'https://www.muzac.com.tr',
    'http://localhost:3000',
  ];
  return allowedDomains.some((domain) => referer.startsWith(domain));
};

export const getCorsHeaders = (referer: string) => {
  let origin = 'https://muzac.com.tr';

  if (
    referer.startsWith('https://muzac.com.tr') ||
    referer.startsWith('https://www.muzac.com.tr')
  ) {
    origin = referer.split('/').slice(0, 3).join('/');
  } else if (referer.startsWith('http://localhost:3000')) {
    origin = 'http://localhost:3000';
  }

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
};
