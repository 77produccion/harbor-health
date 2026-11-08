type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function initEditorialVideos() {
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  document.querySelectorAll<HTMLElement>('[data-editorial-video]').forEach((frame) => {
    if (frame.dataset.videoInitialized) return;
    frame.dataset.videoInitialized = 'true';
    const video = frame.querySelector<HTMLVideoElement>('video');
    const control = frame.querySelector<HTMLButtonElement>('[data-video-control]');
    if (!video || !control) return;
    let visible = false;
    let manuallyPaused = false;
    let requestedPlayback = false;
    let failed = false;
    // Autoplay silenciado también en móvil. La carga sigue diferida a la escena
    // visible; no se descargan todos los clips al abrir la página.
    const mayAutoplay = () =>
      !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType ?? '');
    const syncControl = () => {
      const playing = !video.paused && !video.ended;
      control.setAttribute(
        'aria-label',
        playing ? control.dataset.pauseLabel! : control.dataset.playLabel!,
      );
      frame.dataset.playing = String(playing);
      frame.querySelector('[data-video-play-icon]')?.toggleAttribute('hidden', playing);
      frame.querySelector('[data-video-pause-icon]')?.toggleAttribute('hidden', !playing);
    };
    const start = async () => {
      if (failed) return;
      if (!video.hasAttribute('src')) {
        video.muted = true;
        video.src = video.dataset.videoSrc!;
      }
      try {
        await video.play();
      } catch {
        syncControl();
      } // Autoplay bloqueado: se conserva el poster y el botón.
      if (!visible || document.hidden || manuallyPaused) video.pause();
    };
    const applyPolicy = () => {
      if (!visible || document.hidden || manuallyPaused || (!mayAutoplay() && !requestedPlayback))
        video.pause();
      else void start();
    };
    control.hidden = false;
    control.addEventListener('click', () => {
      if (video.paused) {
        manuallyPaused = false;
        requestedPlayback = true;
        void start();
      } else {
        manuallyPaused = true;
        video.pause();
      }
    });
    video.addEventListener('playing', () => {
      frame.classList.add('has-video-frame');
      syncControl();
    });
    video.addEventListener('pause', syncControl);
    video.addEventListener('error', () => {
      failed = true;
      video.pause();
      frame.classList.remove('has-video-frame');
      control.hidden = true;
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        applyPolicy();
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(frame);
    document.addEventListener('visibilitychange', applyPolicy);
    connection?.addEventListener('change', applyPolicy);
    window.addEventListener('pagehide', () => video.pause());
    window.addEventListener('pageshow', applyPolicy);
  });
}
