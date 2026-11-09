import gsap from 'gsap';

export function initCaptureViewers() {
  document.querySelectorAll<HTMLElement>('[data-product-capture]').forEach((figure) => {
    if (figure.dataset.viewerReady) return;
    const dialog =
      figure.nextElementSibling instanceof HTMLDialogElement ? figure.nextElementSibling : null;
    const image = dialog?.querySelector<HTMLImageElement>('[data-capture-full]');
    const stage = dialog?.querySelector<HTMLElement>('.capture-viewer-stage');
    const zoom = dialog?.querySelector<HTMLButtonElement>('[data-capture-zoom]');
    if (!dialog || !image || !stage || !zoom || !dialog.showModal) return;
    figure.dataset.viewerReady = 'true';
    let opener: HTMLElement | null = null;
    let closing = false;
    let previousOverflow = '';
    const setZoom = (enlarged: boolean) => {
      stage.classList.toggle('is-zoomed', enlarged);
      image.style.width = enlarged
        ? `${Math.max(image.naturalWidth, stage.clientWidth * 2)}px`
        : '';
      zoom.setAttribute('aria-pressed', String(enlarged));
      zoom.setAttribute('aria-label', (enlarged ? zoom.dataset.zoomOut : zoom.dataset.zoomIn)!);
      dialog.querySelector('[data-zoom-in-icon]')!.toggleAttribute('hidden', enlarged);
      dialog.querySelector('[data-zoom-out-icon]')!.toggleAttribute('hidden', !enlarged);
      stage.scrollTo(0, 0);
    };
    const close = () => {
      if (closing || !dialog.open) return;
      closing = true;
      gsap.killTweensOf(dialog);
      gsap.to(dialog, {
        opacity: 0,
        scale: 0.98,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => dialog.close(),
      });
    };
    figure.querySelectorAll<HTMLAnchorElement>('[data-capture-open]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        image.src = image.dataset.src!;
        setZoom(false);
        closing = false;
        dialog.showModal();
        previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        gsap.killTweensOf(dialog);
        gsap.fromTo(
          dialog,
          { opacity: 0, scale: 0.96, y: 10 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.28,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          },
        );
      });
    });
    dialog.querySelector('[data-capture-close]')?.addEventListener('click', close);
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        close();
    });
    dialog.addEventListener('close', () => {
      gsap.killTweensOf(dialog);
      gsap.set(dialog, { clearProps: 'transform,opacity' });
      setZoom(false);
      closing = false;
      document.documentElement.style.overflow = previousOverflow;
      opener?.focus({ preventScroll: true });
    });
    const toggleZoom = () => {
      setZoom(zoom.getAttribute('aria-pressed') !== 'true');
      gsap.fromTo(
        image,
        { opacity: 0.55 },
        { opacity: 1, duration: 0.24, ease: 'power2.out', clearProps: 'opacity' },
      );
    };
    zoom.addEventListener('click', toggleZoom);
    image.addEventListener('click', toggleZoom);
    image.addEventListener('load', () => {
      if (dialog.open && !closing) {
        gsap.fromTo(
          image,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.24,
            ease: 'power2.out',
            clearProps: 'opacity',
            overwrite: true,
          },
        );
      }
    });
  });
}
