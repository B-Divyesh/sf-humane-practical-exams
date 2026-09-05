const origin = 'https://humane-practical-exams.sociobot.in';

type RouteMetadata = { title: string; description: string; canonical: string };

const routes: Record<string, RouteMetadata> = {
  '/': {
    title: 'Humane Practical Exams — Run practical exams',
    description: 'Run timed practical exams with candidate-chosen work evidence and a clear rubric, without webcam or browser monitoring.',
    canonical: '/'
  },
  '/demo': {
    title: 'Demo — Humane Practical Exams',
    description: 'Review a complete sample practical exam without creating or changing real exam data.',
    canonical: '/demo'
  },
  '/create': {
    title: 'Create an exam — Humane Practical Exams',
    description: 'Create a timed practical task, clear rubric, accommodations, and deletion date.',
    canonical: '/create'
  },
  '/privacy': {
    title: 'Privacy — Humane Practical Exams',
    description: 'Read what Humane Practical Exams stores, protects, and deletes.',
    canonical: '/privacy'
  },
  '/terms': {
    title: 'Terms — Humane Practical Exams',
    description: 'Read the terms for using Humane Practical Exams.',
    canonical: '/terms'
  }
};

const fallback: RouteMetadata = {
  title: 'Page not found — Humane Practical Exams',
  description: 'This page does not exist. Return to Humane Practical Exams.',
  canonical: '/404'
};

function setMeta(selector: string, attribute: string, value: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute(attribute, value);
}

export function applyMetadata(path: string): RouteMetadata {
  const examPath = /^\/exam\/[^/]+$/.test(path);
  const metadata = routes[path] ?? (examPath ? {
    title: 'Exam workspace — Humane Practical Exams',
    description: 'Open a practical exam workspace using a complete candidate or assessor link.',
    canonical: path
  } : fallback);
  document.title = metadata.title;
  const canonical = origin + metadata.canonical;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonical);
  setMeta('meta[name="description"]', 'content', metadata.description);
  setMeta('meta[property="og:title"]', 'content', metadata.title);
  setMeta('meta[property="og:description"]', 'content', metadata.description);
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[name="twitter:title"]', 'content', metadata.title);
  setMeta('meta[name="twitter:description"]', 'content', metadata.description);
  return metadata;
}
