import gsap from 'gsap';
import { enterHero, openMedia, refreshOnMedia } from './editorial-motion';

export function initSceneMotion() {
  const root = document.querySelector<HTMLElement>('[data-editorial-page]');
  if (!root) return;
  const media = gsap.matchMedia();

  // Full choreography is the site's default, including when the OS requests
  // reduced motion (owner's explicit direction). This is not an a11y sign-off.
  media.add(
    'all',
    () => {
      const copy = root.querySelector<HTMLElement>('.sc-hero-copy');
      if (copy) enterHero(copy);

      root
        .querySelectorAll<HTMLElement>(
          '.sc-chapter-media, .sc-steps-media, .sc-reference-media, .sc-path-media',
        )
        .forEach((frame) => openMedia(frame));

      // Evidence: the divider connects the two explanations. Both remain readable.
      root.querySelectorAll<HTMLElement>('.sc-compare-grid').forEach((grid) => {
        gsap.fromTo(
          grid,
          { '--evidence-progress': 0 },
          {
            '--evidence-progress': 1,
            ease: 'none',
            scrollTrigger: { trigger: grid, start: 'top 85%', end: 'bottom 60%', scrub: 0.6 },
          },
        );
      });

      // Professional reference: each rule fills as that question is read, rather
      // than making eight identical cards fade in.
      root.querySelectorAll<HTMLElement>('.sc-reference-list article').forEach((item) => {
        gsap.fromTo(
          item,
          { '--question-progress': 0 },
          {
            '--question-progress': 1,
            ease: 'none',
            scrollTrigger: { trigger: item, start: 'top 80%', end: 'bottom 55%', scrub: 0.4 },
          },
        );
      });
    },
    root,
  );

  media.add(
    '(min-width: 1000px) and (min-height: 800px)',
    () => {
      root.querySelectorAll<HTMLElement>('.sc-steps').forEach((scene) => {
        const stage = scene.querySelector<HTMLElement>('.sc-steps-stage');
        const steps = [...scene.querySelectorAll<HTMLElement>('.sc-step')];
        if (!stage || !steps.length) return;
        // Never force long translations or zoomed text into a clipped viewport.
        if (stage.scrollHeight > window.innerHeight - 140) return;
        scene.classList.add('is-scroll-story');
        const story = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: `steps-${scene.id}`,
            trigger: scene,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });
        steps.forEach((step, index) => {
          story.fromTo(
            step,
            { '--step-progress': 0 },
            {
              '--step-progress': 1,
              duration: 1,
            },
            index,
          );
        });
      });
      return () =>
        root.querySelectorAll('.is-scroll-story').forEach((scene) => {
          scene.classList.remove('is-scroll-story');
        });
    },
    root,
  );

  refreshOnMedia(root, () => media.revert());
}
