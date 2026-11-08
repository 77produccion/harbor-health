import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type TabsOptions = {
  list: string;
  controls: string;
  panels: string;
  controlKey: string;
  panelKey: string;
  prefix: string;
  onChange?: (id: string, instant: boolean) => void;
};

export function initMotion() {
  const visual = document.querySelector<HTMLElement>('[data-demo-visual]');
  const sheet = document.querySelector<HTMLElement>('[data-demo-document]');
  const visualCards = [...document.querySelectorAll<HTMLElement>('[data-visual-card]')];
  const zoomStage = document.querySelector<HTMLElement>('[data-demo-zoom]');
  let sceneTimeline: gsap.core.Timeline | undefined;
  let zoom = 1;

  const sheetViews: Record<string, gsap.TweenVars> = {
    document: { xPercent: 0, yPercent: 0, rotation: -6, scale: 0.92, opacity: 1 },
    extracted: { xPercent: -8, yPercent: -7, rotation: 0, scale: 1.12, opacity: 1 },
    explanation: { xPercent: -22, yPercent: -8, rotation: -11, scale: 0.78, opacity: 0.43 },
    questions: { xPercent: -26, yPercent: -7, rotation: -13, scale: 0.72, opacity: 0.28 },
  };

  function renderScene(id: string, instant: boolean) {
    if (!visual || !sheet) return;
    visual.classList.add('is-enhanced');
    visual.dataset.view = id;
    sceneTimeline?.kill();
    gsap.killTweensOf([sheet, ...visualCards]);
    const card = visualCards.find((element) => element.dataset.visualCard === id);
    const others = visualCards.filter((element) => element !== card);
    if (instant) {
      gsap.set(sheet, sheetViews[id]);
      gsap.set(others, { autoAlpha: 0, y: 20, scale: 0.94 });
      if (card) gsap.set(card, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
      return;
    }
    sceneTimeline = gsap.timeline({ defaults: { overwrite: 'auto' } });
    sceneTimeline.to(others, { autoAlpha: 0, y: 24, scale: 0.94, duration: 0.23 }, 0);
    sceneTimeline.to(sheet, { ...sheetViews[id], duration: 0.8, ease: 'power4.out' }, 0);
    if (card) {
      sceneTimeline.fromTo(
        card,
        { autoAlpha: 0, y: 74, scale: 0.86, rotation: id === 'questions' ? 4 : -2 },
        { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0.75, ease: 'back.out(1.15)' },
        0.12,
      );
    }
  }

  function enhanceTabs(options: TabsOptions) {
    const list = document.querySelector<HTMLElement>(options.list);
    const controls = [...document.querySelectorAll<HTMLAnchorElement>(options.controls)];
    const panels = [...document.querySelectorAll<HTMLElement>(options.panels)];
    if (!list || !controls.length || !panels.length) return;
    let current: string | undefined;
    list.setAttribute('role', 'tablist');
    list.classList.add('is-enhanced');

    function activate(id: string, moveFocus = false, instant = false) {
      if (!controls.some((control) => control.dataset[options.controlKey] === id)) return;
      const changed = current !== id;
      current = id;
      controls.forEach((control) => {
        const active = control.dataset[options.controlKey] === id;
        control.setAttribute('aria-selected', String(active));
        if (active) control.setAttribute('aria-current', 'true');
        else control.removeAttribute('aria-current');
        control.tabIndex = active ? 0 : -1;
        if (active && moveFocus) control.focus({ preventScroll: true });
      });
      if (!changed && !instant) return;
      panels.forEach((panel) => {
        const active = panel.dataset[options.panelKey] === id;
        panel.hidden = !active;
        gsap.killTweensOf([panel, ...panel.children]);
        if (!active) return;
        if (instant) {
          gsap.set([panel, ...panel.children], { clearProps: 'opacity,visibility,transform' });
        } else if (options.prefix === 'level') {
          gsap.fromTo(
            panel.children,
            { autoAlpha: 0, y: 48 },
            {
              autoAlpha: 1,
              y: 0,
              stagger: 0.09,
              duration: 0.65,
              ease: 'power4.out',
              clearProps: 'opacity,visibility,transform',
            },
          );
        } else {
          gsap.fromTo(
            panel,
            { autoAlpha: 0, x: 62 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.6,
              ease: 'power4.out',
              clearProps: 'opacity,visibility,transform',
            },
          );
        }
      });
      options.onChange?.(id, instant);
    }

    controls.forEach((control, index) => {
      const id = control.dataset[options.controlKey]!;
      const panel = panels.find((element) => element.dataset[options.panelKey] === id)!;
      control.id = `${options.prefix}-control-${id}`;
      control.setAttribute('role', 'tab');
      control.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', control.id);
      panel.tabIndex = 0;
      control.addEventListener('click', (event) => {
        event.preventDefault();
        activate(id);
      });
      control.addEventListener('keydown', (event) => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % controls.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + controls.length) % controls.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = controls.length - 1;
        else if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          activate(id);
          return;
        } else return;
        event.preventDefault();
        activate(controls[next].dataset[options.controlKey]!, true);
      });
    });
    const hash = location.hash.slice(1);
    const fromHash = panels.find((panel) => panel.id === hash)?.dataset[options.panelKey];
    activate(fromHash ?? controls[0].dataset[options.controlKey]!, false, true);
    return {
      get current() {
        return current!;
      },
      refresh: () => activate(current!, false, true),
    };
  }

  enhanceTabs({
    list: '[data-demo-controls]',
    controls: '[data-demo-control]',
    panels: '[data-demo-panel]',
    controlKey: 'demoControl',
    panelKey: 'demoPanel',
    prefix: 'demo',
    onChange: renderScene,
  });

  const zoomIn = document.querySelector<HTMLButtonElement>('[data-zoom-in]');
  const zoomOut = document.querySelector<HTMLButtonElement>('[data-zoom-out]');
  function updateZoom(value: number) {
    zoom = Math.max(0.8, Math.min(1.4, Math.round(value * 10) / 10));
    if (zoomStage)
      gsap.to(zoomStage, {
        scale: zoom,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: true,
      });
    if (zoomIn) zoomIn.disabled = zoom >= 1.4;
    if (zoomOut) zoomOut.disabled = zoom <= 0.8;
  }
  zoomIn?.addEventListener('click', () => updateZoom(zoom + 0.2));
  zoomOut?.addEventListener('click', () => updateZoom(zoom - 0.2));
  document.querySelector('[data-zoom-reset]')?.addEventListener('click', () => updateZoom(1));

  const readingList = document.querySelector<HTMLElement>('[data-reading-controls]');
  const indicator = document.querySelector<HTMLElement>('[data-reading-indicator]');
  function moveReadingIndicator(id: string, instant: boolean) {
    const control = readingList?.querySelector<HTMLElement>(`[data-level-control="${id}"]`);
    if (!control || !indicator) return;
    gsap.to(indicator, {
      x: control.offsetLeft,
      width: control.offsetWidth,
      duration: instant ? 0 : 0.45,
      ease: 'power3.out',
      overwrite: true,
    });
  }
  const levelTabs = enhanceTabs({
    list: '[data-reading-controls]',
    controls: '[data-level-control]',
    panels: '[data-level-panel]',
    controlKey: 'levelControl',
    panelKey: 'levelPanel',
    prefix: 'level',
    onChange: moveReadingIndicator,
  });
  if (readingList && levelTabs) {
    readingList.closest('.levels-section')?.classList.add('is-interactive');
    new ResizeObserver(() => moveReadingIndicator(levelTabs.current, true)).observe(readingList);
  }
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add('all', () => {
    if (!document.querySelector('[data-hero]')) return;

    const opening = gsap.timeline({ defaults: { ease: 'power4.out' } });
    opening.from(
      '.hero-landscape',
      { clipPath: 'inset(8% 7% 8% 7% round 28px)', duration: 1.5 },
      0,
    );
    opening.from(
      '[data-scene-image]',
      { scale: 1.18, xPercent: -3, duration: 1.9, ease: 'power2.out' },
      0,
    );
    opening.from(
      '.hero-line',
      {
        yPercent: 115,
        rotation: 1.5,
        autoAlpha: 0,
        stagger: 0.15,
        duration: 1.2,
        clearProps: 'opacity,visibility,transform',
      },
      0.25,
    );
    opening.from(
      '[data-hero-actions]',
      { y: 56, autoAlpha: 0, duration: 0.8, clearProps: 'opacity,visibility,transform' },
      0.85,
    );
    opening.from(
      '[data-hero-description]',
      { x: 80, autoAlpha: 0, duration: 0.9, clearProps: 'opacity,visibility,transform' },
      0.95,
    );

    const camera = gsap.timeline({
      scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: 0.65 },
    });
    camera.to('[data-hero-camera]', { yPercent: 9, scale: 1.12, ease: 'none' }, 0);
    camera.to('.hero-composition', { y: 105, ease: 'none' }, 0);

    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      const variant = element.dataset.reveal;
      const targets =
        variant === 'heading' && element.tagName === 'DIV' ? element.children : element;
      gsap.from(targets, {
        // Mantener controles en el árbol accesible permite enfocarlos y activar
        // su reveal al llegar por teclado, no solo al desplazar con el ratón.
        opacity: 0,
        y: variant === 'slide-left' || variant === 'slide-right' ? 0 : 86,
        x: variant === 'slide-left' ? -100 : variant === 'slide-right' ? 100 : 0,
        scale: variant === 'heading' ? 0.97 : 1,
        duration: 0.95,
        stagger: 0.12,
        ease: 'power4.out',
        clearProps: 'opacity,visibility,transform',
        scrollTrigger: { trigger: element, start: 'top 80%', once: true },
      });
    });
    gsap.from('[data-workspace]', {
      opacity: 0,
      y: 100,
      scale: 0.88,
      rotationX: 4,
      transformPerspective: 1400,
      duration: 1.1,
      ease: 'back.out(1.1)',
      clearProps: 'opacity,visibility,transform',
      scrollTrigger: { trigger: '[data-workspace]', start: 'top 82%', once: true },
    });
    gsap.from('[data-reading-title] span', {
      y: 95,
      autoAlpha: 0,
      stagger: 0.18,
      duration: 1,
      ease: 'power4.out',
      clearProps: 'opacity,visibility,transform',
      scrollTrigger: { trigger: '[data-reading-title]', start: 'top 78%', once: true },
    });

    document.querySelectorAll<HTMLElement>('[data-image-reveal]').forEach((element) => {
      const image = element.querySelector('img');
      const reveal = gsap.timeline({
        scrollTrigger: { trigger: element, start: 'top 78%', once: true },
      });
      reveal.from(
        element,
        {
          clipPath: 'inset(16% 36% 16% 6% round 24px)',
          duration: 1.25,
          ease: 'power4.out',
          clearProps: 'clipPath',
        },
        0,
      );
      if (image)
        reveal.from(image, { xPercent: 14, scale: 1.18, duration: 1.45, ease: 'power3.out' }, 0);
    });
    document.querySelectorAll('[data-parallax-image]').forEach((element) => {
      gsap.fromTo(
        element,
        { yPercent: -3 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: element.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.65,
          },
        },
      );
    });
    gsap.from('.professional-landscape', {
      clipPath: 'inset(12% 8% 12% 8% round 22px)',
      duration: 1.25,
      ease: 'power4.out',
      clearProps: 'clipPath',
      scrollTrigger: { trigger: '.professionals-section', start: 'top 78%', once: true },
    });
  });

  const header = document.querySelector('.site-header-overlay');
  if (header)
    ScrollTrigger.create({
      start: 65,
      onUpdate: (self) => header.classList.toggle('is-scrolled', self.scroll() > 65),
    });

  const mobileMenu = document.querySelector<HTMLDetailsElement>('.mobile-navigation');
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu?.open) {
      mobileMenu.open = false;
      mobileMenu.querySelector('summary')?.focus();
    }
  });
  mobileMenu?.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => {
      mobileMenu.open = false;
    }),
  );
}
