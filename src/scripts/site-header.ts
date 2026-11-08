export function initSiteHeader() {
  const header = document.querySelector<HTMLElement>('.harbor-header');
  if (!header || header.dataset.initialized) return;
  header.dataset.initialized = 'true';
  const menu = header.querySelector<HTMLDetailsElement>('.hw-mobile-menu');
  const regions = document.querySelectorAll<HTMLElement>('main, footer');
  const syncMenu = () => {
    regions.forEach((region) => {
      region.inert = Boolean(menu?.open);
    });
    document.body.classList.toggle('hw-menu-visible', Boolean(menu?.open));
  };
  menu?.addEventListener('toggle', syncMenu);
  window.matchMedia('(min-width: 1000px)').addEventListener('change', (event) => {
    if (event.matches && menu) {
      menu.open = false;
      syncMenu();
    }
  });
  menu?.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => {
      menu.open = false;
      syncMenu();
    }),
  );
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      syncMenu();
      menu.querySelector('summary')?.focus();
    }
  });
  const syncScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', syncScroll, { passive: true });
  syncScroll();
}
