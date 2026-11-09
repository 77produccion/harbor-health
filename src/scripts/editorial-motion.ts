import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** One entrance, not a reveal applied indiscriminately to every paragraph.
 * SplitText is included in GSAP; autoSplit preserves wraps when fonts/width change.
 * Call inside a GSAP context/matchMedia so the original markup is restored on exit.
 */
export function enterHero(copy: HTMLElement) {
  const title = copy.querySelector('h1');
  if (!title) return;
  SplitText.create(title, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit(split) {
      return gsap.from(split.lines, {
        yPercent: 105,
        duration: 0.85,
        stagger: { amount: 0.16 },
        ease: 'power3.out',
        clearProps: 'transform',
      });
    },
  });
  const lead = copy.querySelectorAll(':scope > p, .hw-hero-intro > p');
  const actions = copy.querySelector('.hw-actions, .sc-actions');
  const opening = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.65 } });
  if (lead.length) opening.from(lead, { y: 16, clearProps: 'transform' }, 0.25);
  // Controls remain fully opaque and usable throughout the entrance.
  if (actions) opening.from(actions, { y: 12, clearProps: 'transform' }, 0.35);
}

/** A photograph opens into its own frame as the chapter arrives.
 * Text and controls never depend on its progress; native scrolling is untouched.
 */
export function openMedia(frame: HTMLElement, trigger: HTMLElement = frame) {
  return gsap.fromTo(
    frame,
    { clipPath: 'inset(8% 5% 8% 5%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'clamp(top 90%)',
        end: 'clamp(center 55%)',
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
    },
  );
}

/** Refresh for real geometry changes, including lazy media and bfcache return. */
export function refreshOnMedia(root: HTMLElement, cleanup: () => void) {
  const refresh = () => ScrollTrigger.refresh();
  root.querySelectorAll('img').forEach((image) => {
    if (!image.complete) image.addEventListener('load', refresh, { once: true });
  });
  void document.fonts.ready.then(refresh);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) {
      window.removeEventListener('pageshow', refresh);
      root.querySelectorAll('img').forEach((image) => image.removeEventListener('load', refresh));
      cleanup();
    }
  });
}
