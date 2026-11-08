// Recursos aportados por el responsable; son ilustrativos, no capturas clínicas.
export type EditorialMediaEntry = {
  hero: string;
  detail: string;
  accent: string;
  closing: string;
  video?: string;
};

export const editorialMedia: Record<string, EditorialMediaEntry> = {
  'health.how-it-works': {
    hero: '/images/home-preparation-1536.webp',
    detail: '/images/editorial-notes-1400.webp',
    accent: '/images/home-documents-1400.webp',
    closing: '/images/editorial-ocean-1600.webp',
  },
  'health.trust': {
    hero: '/images/home-documents-1400.webp',
    detail: '/images/editorial-writing-1400.webp',
    accent: '/images/editorial-clinician-1000.webp',
    closing: '/images/editorial-ocean-1600.webp',
  },
  'health.professionals': {
    hero: '/images/home-clinician-poster-1600.webp',
    detail: '/images/editorial-clinician-1000.webp',
    accent: '/images/editorial-writing-1400.webp',
    closing: '/images/editorial-ocean-1600.webp',
    video: '/videos/harbor-line-visual%20(1).mp4',
  },
  'health.demo': {
    hero: '/images/editorial-questions-1400.webp',
    detail: '/images/home-documents-1400.webp',
    accent: '/images/editorial-writing-1400.webp',
    closing: '/images/editorial-ocean-1600.webp',
  },
  'health.access': {
    hero: '/images/home-professional-900.webp',
    detail: '/images/home-preparation-1536.webp',
    accent: '/images/editorial-questions-1400.webp',
    closing: '/images/editorial-ocean-1600.webp',
  },
};
