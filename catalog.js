/* ====== Lab-Logistics — catalog.js ====== */

document.addEventListener('DOMContentLoaded', () => {

  const pills = document.querySelectorAll('.cat-pill');
  const blocks = document.querySelectorAll('.cat-block');

  // Click filter pill → scroll to block
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const target = pill.dataset.target;
      const el = document.getElementById(target);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 130;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Highlight active pill on scroll. If no block has been reached yet
  // (i.e. user is at the very top), keep the first pill active.
  const setActive = () => {
    const scrollPos = window.scrollY + 200;
    let current = '';
    blocks.forEach(block => {
      if (block.offsetTop <= scrollPos) current = block.id;
    });
    if (!current && blocks.length) current = blocks[0].id;
    pills.forEach(p => {
      p.classList.toggle('active', p.dataset.target === current);
    });
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        setActive();
        ticking = false;
      });
      ticking = true;
    }
  });

  setActive();

});