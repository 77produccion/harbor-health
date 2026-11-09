import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { enterHero, openMedia, refreshOnMedia } from './editorial-motion';
import { track } from './marketing';
import type spanishUI from '../../content/home-ui.es.json';

export function initHome() {
  const product = JSON.parse(
    document.querySelector('#harbor-product-ui')?.textContent ?? '{}',
  ) as typeof spanishUI.product;
  const ui = { product };
  gsap.registerPlugin(ScrollTrigger);
  const frame = document.querySelector<HTMLElement>('[data-product-window]');
  const panels = [...document.querySelectorAll<HTMLElement>('[data-product-panel]')];
  let category = 'laboratory';
  let level = 'l1';
  let mode = 'documents';
  let syncJourneyScroll: ((value: string) => void) | undefined;
  const journey = document.querySelector<HTMLElement>('[data-big-scene="product-journey"]');
  journey?.classList.add('is-interactive');

  function animatePanel(panel: HTMLElement, id: string) {
    gsap.killTweensOf(panel);
    gsap.fromTo(
      panel,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'opacity',
        overwrite: true,
      },
    );
    const detail =
      id === 'consultation'
        ? panel.querySelectorAll('.hw-question-choice > span')
        : id === 'levels'
          ? panel.querySelectorAll('.hw-reading-sheet > div:not([hidden])')
          : panel.querySelectorAll('.hw-original-sheet > div:not([hidden])');
    if (detail.length)
      gsap.fromTo(
        detail,
        { autoAlpha: 0, y: 26 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.07,
          delay: 0.1,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
          overwrite: true,
        },
      );
  }

  function setMode(value: string, manual = false) {
    if (!frame || !['documents', 'levels', 'consultation'].includes(value)) return;
    const changed = mode !== value;
    mode = value;
    frame.dataset.mode = mode;
    if (journey) journey.dataset.currentMode = mode;
    const chapter = document.querySelector<HTMLElement>(`[data-journey-chapter="${mode}"]`);
    if (changed && chapter) {
      const copy = chapter.querySelectorAll('h2, p, .hw-journey-topics > span');
      gsap.fromTo(
        copy,
        { autoAlpha: 0, y: 38 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.06,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
          overwrite: true,
        },
      );
    }
    document.querySelectorAll<HTMLElement>('[data-chapter-choice]').forEach((link) => {
      if (link.dataset.chapterChoice === mode) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    document
      .querySelectorAll<HTMLElement>('[data-product-mode]')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.productMode === mode)),
      );
    panels.forEach((panel) => {
      const active = panel.dataset.productPanel === mode;
      panel.hidden = !active;
      if (active && changed) animatePanel(panel, mode);
      else if (active) {
        gsap.killTweensOf(panel);
        gsap.set(panel, { clearProps: 'opacity,visibility,transform' });
      }
    });
    if (changed) {
      const body = frame.querySelector<HTMLElement>('.hw-product-body');
      if (body) body.scrollTop = 0;
    }
    if (manual) {
      syncJourneyScroll?.(mode);
      track('product_mode_change', { mode });
    }
  }
  document
    .querySelectorAll<HTMLElement>('[data-product-mode]')
    .forEach((button) =>
      button.addEventListener('click', () => setMode(button.dataset.productMode!, true)),
    );
  document.querySelectorAll<HTMLElement>('[data-chapter-choice]').forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      setMode(link.dataset.chapterChoice!, true);
    }),
  );
  if (['documents', 'levels', 'consultation'].includes(location.hash.slice(1)))
    setMode(location.hash.slice(1));
  document.querySelectorAll<HTMLElement>('[data-category]').forEach((button) =>
    button.addEventListener('click', () => {
      category = button.dataset.category!;
      document
        .querySelectorAll<HTMLElement>('[data-category]')
        .forEach((control) =>
          control.setAttribute('aria-pressed', String(control.dataset.category === category)),
        );
      document.querySelectorAll<HTMLElement>('[data-category-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.categoryPanel !== category;
      });
      const sheet = document.querySelector('[data-original-sheet]');
      if (sheet)
        gsap.fromTo(
          sheet,
          { x: 65, opacity: 0.2 },
          {
            x: 0,
            opacity: 1,
            duration: 0.65,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
            overwrite: true,
          },
        );
      track('document_category_change', { category });
    }),
  );
  document.querySelectorAll<HTMLElement>('[data-reading-level]').forEach((button) =>
    button.addEventListener('click', () => {
      level = button.dataset.readingLevel!;
      document
        .querySelectorAll<HTMLElement>('[data-reading-level]')
        .forEach((control) =>
          control.setAttribute('aria-pressed', String(control.dataset.readingLevel === level)),
        );
      document.querySelectorAll<HTMLElement>('[data-reading-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.readingPanel !== level;
        if (!panel.hidden)
          gsap.fromTo(
            panel,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: 'power3.out',
              clearProps: 'opacity,transform',
              overwrite: true,
            },
          );
      });
      track('reading_level_change', { level });
    }),
  );
  const choices = [...document.querySelectorAll<HTMLInputElement>('[data-question-choice]')];
  const selected = () => choices.filter((choice) => choice.checked);
  const pdfButton = document.querySelector<HTMLButtonElement>('[data-download-pdf]');
  function updateSelection() {
    const count = selected().length;
    const output = document.querySelector('[data-selected-count]');
    if (output) output.textContent = String(count);
    if (pdfButton) pdfButton.disabled = !count;
    track('consultation_selection_change', { count });
  }
  choices.forEach((choice) => choice.addEventListener('change', updateSelection));
  pdfButton?.addEventListener('click', async () => {
    const questions = selected();
    if (!questions.length) return;
    const error = document.querySelector<HTMLElement>('[data-pdf-error]');
    const label = pdfButton.querySelector('span')!;
    if (error) error.hidden = true;
    pdfButton.disabled = true;
    label.textContent = ui.product.downloading;
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595, 842]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      page.drawText('Harbor Health', { x: 50, y: 780, size: 24, font, color: rgb(0.02, 0.1, 0.2) });
      page.drawText(ui.product.pdfTitle, { x: 50, y: 735, size: 18, font });
      let y = 680;
      for (const choice of questions) {
        const text = choice.closest('label')!.querySelector('span')!.textContent!.trim();
        const lines: string[] = [];
        let line = '';
        for (const word of text.split(' ')) {
          if (font.widthOfTextAtSize(`${line} ${word}`, 12) > 480) {
            lines.push(line);
            line = word;
          } else line = `${line} ${word}`.trim();
        }
        if (line) lines.push(line);
        for (const value of lines) {
          page.drawText(value, { x: 50, y, size: 12, font });
          y -= 21;
        }
        y -= 20;
      }
      page.drawText(ui.product.pdfNote, { x: 50, y: 65, size: 8, maxWidth: 490, font });
      const bytes = await pdf.save();
      track('pdf_example_generated', { count: questions.length });
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = ui.product.pdfFile;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch {
      if (error) error.hidden = false;
    } finally {
      pdfButton.disabled = !selected().length;
      label.textContent = ui.product.download;
    }
  });

  const media = gsap.matchMedia();

  media.add('all', () => {
    // La primera escena no pasa por setMode (ya está seleccionada).
    // Revelar su copy y papel, nunca el ancestro de los controles.
    const firstChapter = document.querySelector('[data-journey-chapter="documents"]');
    if (firstChapter) {
      gsap.from(firstChapter.querySelectorAll('h2, p, .hw-journey-topics > span'), {
        y: 38,
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.85,
        stagger: 0.07,
        ease: 'power3.out',
        clearProps: 'clipPath,transform',
        scrollTrigger: { trigger: journey, start: 'top 78%', once: true },
      });
    }
    const original = document.querySelector('[data-original-sheet]');
    if (original)
      gsap.from(original, {
        y: 38,
        duration: 0.9,
        ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: { trigger: journey, start: 'top 78%', once: true },
      });
    const heroCopy = document.querySelector<HTMLElement>('[data-hero-copy]');
    if (heroCopy) enterHero(heroCopy);

    // Distinct chapter treatments, not the same fade/slide on every block.
    document
      .querySelectorAll<HTMLElement>(
        '.hw-knowledge-visual > [data-photo-frame], .hw-professional-portrait',
      )
      .forEach((visual) => openMedia(visual));
    document.querySelectorAll<HTMLElement>('[data-knowledge-node]').forEach((node) => {
      gsap.fromTo(
        node,
        { '--node-progress': 0 },
        {
          '--node-progress': 1,
          ease: 'none',
          scrollTrigger: { trigger: node, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
        },
      );
    });
  });

  // Native details work without JS; refresh measurements after their geometry changes.
  const disclosures = [...document.querySelectorAll<HTMLDetailsElement>('.hw-faq details')];
  const refreshDisclosure = () => ScrollTrigger.refresh();
  disclosures.forEach((details) => details.addEventListener('toggle', refreshDisclosure));

  media.add('(min-width: 1000px) and (min-height: 600px)', () => {
    if (!journey) return;
    journey.classList.add('is-live');
    // Only the product sticks. Copy keeps its natural height, so a long
    // translation or photograph cannot silently disable the scroll journey.
    const chapters = [...journey.querySelectorAll<HTMLElement>('[data-journey-chapter]')];
    const syncFromScroll = () => {
      let current = chapters[0];
      for (const chapter of chapters) {
        if (chapter.getBoundingClientRect().top <= Math.max(160, innerHeight * 0.35))
          current = chapter;
      }
      const nextMode = current?.dataset.journeyChapter;
      if (nextMode && mode !== nextMode) setMode(nextMode);
    };
    ScrollTrigger.create({
      trigger: journey,
      start: 'top 80%',
      end: 'bottom top',
      invalidateOnRefresh: true,
      onRefresh: syncFromScroll,
      onUpdate: (self) => {
        journey.style.setProperty('--journey-progress', String(self.progress));
        syncFromScroll();
      },
    });
    // Una selección manual debe llevar también el scroll a su capítulo.
    // Antes quedaban dos estados independientes (activeChapter y mode).
    syncJourneyScroll = (value) => {
      const chapter = chapters.find((item) => item.dataset.journeyChapter === value);
      if (!chapter) return;
      const target = chapter.getBoundingClientRect().top + scrollY - 120;
      window.scrollTo({ top: target, behavior: 'instant' });
      ScrollTrigger.update();
    };
    return () => {
      syncJourneyScroll = undefined;
      journey.classList.remove('is-live');
      journey.style.removeProperty('--journey-progress');
    };
  });

  refreshOnMedia(document.body, () => {
    disclosures.forEach((details) => details.removeEventListener('toggle', refreshDisclosure));
    media.revert();
  });
}
