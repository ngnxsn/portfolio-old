document.addEventListener('DOMContentLoaded', () => {
  const applyRevealStagger = (elements, baseDelay = 0.04, step = 0.08) => {
    elements.forEach((el, index) => {
      if (!el.classList.contains('reveal-on-scroll')) el.classList.add('reveal-on-scroll');
      const delay = baseDelay + (index * step);
      el.style.transitionDelay = `${Math.min(delay, 0.42)}s`;
    });
  };

  const dragAreas = document.querySelectorAll('[data-drag-scroll]');
  dragAreas.forEach((el) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      el.classList.add('active-drag');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });

    ['mouseleave', 'mouseup'].forEach((evt) => {
      el.addEventListener(evt, () => {
        isDown = false;
        el.classList.remove('active-drag');
      });
    });

    el.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.2;
      el.scrollLeft = scrollLeft - walk;
    });
  });

  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -6;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  const showcaseArrows = document.querySelectorAll('[data-scroll-target]');
  showcaseArrows.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.scrollTarget);
      if (!target) return;
      const dir = btn.dataset.direction === 'left' ? -1 : 1;
      target.scrollBy({ left: dir * 360, behavior: 'smooth' });
    });
  });

  applyRevealStagger(Array.from(document.querySelectorAll('.intro-section .card, .intro-section .panel-card')), 0.02, 0.08);
  applyRevealStagger(Array.from(document.querySelectorAll('#strengthCardsList .feature-card')), 0.04, 0.08);
  applyRevealStagger(Array.from(document.querySelectorAll('.tool-panels .card')), 0.04, 0.08);
  applyRevealStagger(Array.from(document.querySelectorAll('#experienceCardsList .exp-card')), 0.04, 0.08);
  applyRevealStagger(Array.from(document.querySelectorAll('#educationCardsList .edu-card')), 0.06, 0.08);
  applyRevealStagger(Array.from(document.querySelectorAll('.contact-box')), 0.02, 0.08);

  const projectsSection = document.querySelector('#projects');
  if (projectsSection) {
    projectsSection.classList.remove('reveal-on-scroll');
    projectsSection.classList.add('is-visible');
  }

  document.querySelectorAll('#unifiedShowcaseList .project-card, #unifiedShowcaseList .video-card').forEach((el) => {
    el.classList.remove('reveal-on-scroll');
    el.classList.add('is-visible');
    el.style.transitionDelay = '0s';
  });

  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -56px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = Array.from(navLinks)
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const setActiveNav = () => {
    const offset = 140;
    let currentId = '';
    sections.forEach(section => {
      const top = section.offsetTop - offset;
      const bottom = top + section.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bottom) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      const target = link.getAttribute('href').slice(1);
      link.classList.toggle('active', target === currentId);
    });
  };

  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();
});
