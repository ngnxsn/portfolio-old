(function () {
  const CONTENT_URL = 'content.json';
  const defaults = window.PORTFOLIO_DEFAULTS || {};

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
  }

  function setHref(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.href = value;
  }

  function setMail(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.href = 'mailto:' + value;
  }

  function setTel(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.href = 'tel:' + value;
  }

  function setImg(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.src = value;
  }

  function setPortraitTransform(id, x, y, zoom) {
    const el = document.getElementById(id);
    if (!el) return;
    const posX = Number.isFinite(Number(x)) ? Number(x) : 50;
    const posY = Number.isFinite(Number(y)) ? Number(y) : 50;
    const scale = Number.isFinite(Number(zoom)) ? Number(zoom) / 100 : 1;
    el.style.objectPosition = `${posX}% ${posY}%`;
    el.style.transform = `scale(${scale})`;
  }

  function setListFromLines(id, value) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.innerHTML = '';
    (value || '').split(/\n+/).filter(Boolean).forEach(item => {
      const el = document.createElement('span');
      el.textContent = item.trim();
      wrap.appendChild(el);
    });
  }

  function setSoftwareGrid(id, value) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.innerHTML = '';
    (value || '').split(/\n+/).filter(Boolean).forEach(item => {
      const parts = item.split('|').map(s => s.trim());
      const short = parts[0] || 'Ai';
      const label = parts[1] || parts[0] || '';
      const klass = (parts[2] || 'ps').toLowerCase();
      const row = document.createElement('div');
      row.className = 'software-item';
      row.innerHTML = `<span class="icon-circle ${klass}">${short}</span><b>${label}</b>`;
      wrap.appendChild(row);
    });
  }

  function setHeroStats(id, value) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.innerHTML = '';
    (value || '').split(/\n+/).filter(Boolean).forEach(item => {
      const parts = item.split('|').map(s => s.trim());
      const title = parts[0] || '';
      const desc = parts[1] || '';
      const row = document.createElement('div');
      row.className = 'stat glass-lite hover-rise';
      row.innerHTML = `<strong>${title}</strong><span>${desc}</span>`;
      wrap.appendChild(row);
    });
  }

  function setStrengthCards(id, value) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.innerHTML = '';
    (value || '').split(/\n+/).filter(Boolean).forEach(item => {
      const parts = item.split('|').map(s => s.trim());
      const no = parts[0] || '';
      const title = parts[1] || '';
      const desc = parts[2] || '';
      const row = document.createElement('article');
      row.className = 'card glass intense feature-card hover-rise tilt-card';
      row.innerHTML = `<span class="feature-no">${no}</span><h3>${title}</h3><p>${desc}</p>`;
      wrap.appendChild(row);
    });
  }

  function setExperienceCards(id, value) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.innerHTML = '';
    (value || '').split(/\n+/).filter(Boolean).forEach(item => {
      const parts = item.split('|').map(s => s.trim());
      const period = parts[0] || '';
      const tag = parts[1] || '';
      const company = parts[2] || '';
      const role = parts[3] || '';
      const desc = parts[4] || '';
      const row = document.createElement('article');
      row.className = 'card glass intense exp-card wide-card hover-rise';
      row.innerHTML = `<div class="exp-top"><span class="period">${period}</span><span class="role-tag">${tag}</span></div><h3>${company}</h3><p class="exp-role">${role}</p><p>${desc}</p>`;
      wrap.appendChild(row);
    });
  }

  function setEducationCards(id, value) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    wrap.innerHTML = '';
    (value || '').split(/\n+/).filter(Boolean).forEach((item, idx) => {
      const parts = item.split('|').map(s => s.trim());
      const title = parts[0] || '';
      const desc = parts[1] || '';
      const row = document.createElement('article');
      row.className = `card glass ${idx === 0 ? 'intense' : ''} edu-card wide-card hover-rise${idx > 0 ? ' edu-placeholder' : ''}`;
      row.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
      wrap.appendChild(row);
    });
  }

  function applyContent(data) {
    setText('logoName', data.name);
    setText('heroEyebrow', data.eyebrow);
    setText('heroTitleMain', data.headline);
    setText('heroTitleHighlight', data.headlineHighlight);
    setText('heroLead', data.lead);
    setText('heroPrimaryCta', data.heroPrimaryCtaText);
    setText('heroSecondaryCta', data.heroSecondaryCtaText);
    setHref('heroSecondaryCta', data.heroSecondaryCtaLink);
    setText('heroVideoCta', data.heroVideoCtaText);
    setHref('heroVideoCta', data.heroVideoCtaLink);
    setImg('heroPortrait', data.portraitUrl);
    setPortraitTransform('heroPortrait', data.portraitPositionX, data.portraitPositionY, data.portraitZoom);
    setText('positioningLabel', data.positioningLabel);
    setText('positioningTitle', data.positioningTitle);
    setText('positioningText', data.positioning);
    setHeroStats('heroStatsList', data.heroStats);

    setText('aboutEyebrowText', data.aboutEyebrow);
    setText('aboutTitleText', data.aboutTitle);
    setText('aboutText1Node', data.aboutText1);
    setText('aboutText2Node', data.aboutText2);
    setText('touchTitleText', data.touchTitle);
    setHref('behanceLink', data.behance);
    setHref('websiteLink', data.website);
    setHref('driveLink', data.drive);
    setHref('miniGameLink', data.miniGameLink);

    const behanceText = document.getElementById('behanceLink');
    if (behanceText && data.behance) {
      behanceText.textContent = `Behance /${(data.behance.split('/').filter(Boolean).pop() || 'ngnxsn')}`;
    }

    const driveText = document.getElementById('driveLink');
    if (driveText) {
      driveText.textContent = data.driveText || 'Google Drive Portfolio';
      driveText.style.display = data.drive ? '' : 'none';
    }

    const miniGameText = document.getElementById('miniGameLink');
    if (miniGameText) {
      miniGameText.textContent = data.miniGameText || 'Chơi thử mini game';
      miniGameText.style.display = data.miniGameLink ? '' : 'none';
    }

    const websiteText = document.getElementById('websiteLink');
    if (websiteText) {
      if (data.website) {
        websiteText.style.display = '';
        try {
          websiteText.textContent = new URL(data.website).host;
        } catch {
          websiteText.textContent = data.website;
        }
      } else {
        websiteText.style.display = 'none';
      }
    }

    const touchNote = document.getElementById('touchNoteText');
    if (touchNote) {
      if (data.touchNote) {
        touchNote.style.display = '';
        touchNote.textContent = data.touchNote;
      } else {
        touchNote.style.display = 'none';
      }
    }

    setText('projectsEyebrowText', data.projectsEyebrow);
    setText('projectsTitleText', data.projectsTitle);
    const showcaseLabel = document.getElementById('showcaseLabelText');
    if (showcaseLabel) showcaseLabel.style.display = 'none';
    const unifiedShowcaseList = document.getElementById('unifiedShowcaseList');
    if (unifiedShowcaseList) {
      unifiedShowcaseList.innerHTML = '';
      unifiedShowcaseList.style.justifyContent = 'flex-start';
      const combined = [];
      (data.behanceProjects || '').split(/\n+/).filter(Boolean).forEach(item => {
        const parts = item.split('|').map(s => s.trim());
        combined.push({ type: 'image', title: parts[0] || 'Project', thumb: parts[1] || '', link: parts[2] || '#' });
      });
      (data.driveVideos || '').split(/\n+/).filter(Boolean).forEach(item => {
        const parts = item.split('|').map(s => s.trim());
        combined.push({ type: 'video', title: parts[0] || 'Video Preview', preview: parts[1] || '' });
      });

      combined.forEach((item) => {
        if (item.type === 'image') {
          const card = document.createElement('a');
          card.className = 'project-card project-card-compact glass hover-rise';
          card.href = item.link;
          card.target = '_blank';
          card.rel = 'noreferrer';
          card.innerHTML = `<img src="${item.thumb}" alt="${item.title}"><div class="project-card-body"><strong>${item.title}</strong><span>Xem project trên Behance</span></div>`;
          unifiedShowcaseList.appendChild(card);
        } else {
          const card = document.createElement('div');
          card.className = 'video-card video-card-compact glass hover-rise';
          card.innerHTML = `<iframe src="${item.preview}" allow="autoplay"></iframe><div class="project-card-body"><strong>${item.title}</strong><span>Preview từ Google Drive</span></div>`;
          unifiedShowcaseList.appendChild(card);
        }
      });
    }

    setText('strengthEyebrowText', data.strengthEyebrow);
    setText('strengthTitleText', data.strengthTitle);
    setStrengthCards('strengthCardsList', data.strengthCards);

    setText('toolsEyebrowText', data.toolsEyebrow);
    setText('toolsTitleText', data.toolsTitle);
    setText('creativeSoftwareTitle', data.creativeSoftwareTitle);
    setSoftwareGrid('softwareGrid', data.softwareItems);
    setText('executionSkillsTitle', data.executionSkillsTitle);
    setListFromLines('executionSkillsList', data.executionSkills);
    setText('aiToolsTitle', data.aiToolsTitle);
    setText('aiToolsDesc', data.aiToolsDesc);
    setListFromLines('aiSkillsList', data.aiSkills);
    setListFromLines('aiToolsDynamic', data.aiTools);

    setText('experienceEyebrowText', data.experienceEyebrow);
    setText('experienceTitleText', data.experienceTitle);
    setExperienceCards('experienceCardsList', data.experienceCards);

    setText('educationEyebrowText', data.educationEyebrow);
    setText('educationTitleText', data.educationTitle);
    setEducationCards('educationCardsList', data.educationCards);

    setText('contactEyebrowText', data.contactEyebrow);
    setText('contactTitleText', data.contactTitle);
    setText('contactDescText', data.contactDesc);
    setMail('emailBtn', data.email);
    const emailText = document.querySelector('#emailBtn .contact-text');
    if (emailText && data.email) emailText.textContent = data.email;
    setTel('phoneBtn', data.phone);
    const phoneText = document.querySelector('#phoneBtn .contact-text');
    if (phoneText && data.phone) phoneText.textContent = data.phone;
    setHref('zaloBtn', data.zalo);
    setText('addressText', data.address);
  }

  async function boot() {
    let data = { ...defaults };
    try {
      const res = await fetch(`${CONTENT_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const fileData = await res.json();
        data = { ...defaults, ...fileData };
      }
    } catch {
      data = { ...defaults };
    }

    applyContent(data);
    document.body.classList.remove('is-loading');
    document.documentElement.classList.remove('boot-loading');
    document.body.style.visibility = 'visible';
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
