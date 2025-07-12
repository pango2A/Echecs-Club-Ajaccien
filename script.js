/* JavaScript Echecs Club Ajaccien */

document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = {
    emailjs: {
      serviceId: "service_kabww1n",// Mis à jour pour eca
      templateId: "template_1pqx1u7",// Mis à jour pour eca
      publicKey: "0_ltfLFqvokgONo8-"// Mis à jour pour eca
    },
    stats: {
      licencies: 125,
      jeunes: 86,
      animateurs: 6
    }
  };

  // Initialisation des modules
  initEmailJS();
  setupMobileMenu();
  setupSmoothScrolling();
  setupContactForm();
  setupProblemOfTheDay();
  setupLightbox();
  setupScrollSpy();
  
  // Chargement des contenus dynamiques
  loadActualites();
  loadEvenements();
  loadArchivesPhotos();
  
  // Initialisation des animations
  setupStatsAnimation();
  setupArchivesFilter();

  /* ==================== */
  /* FONCTIONS PRINCIPALES */
  /* ==================== */

  function initEmailJS() {
    emailjs.init(CONFIG.emailjs.publicKey);
  }

  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    window.addEventListener('scroll', () => {
      let currentSection = '';

      sections.forEach(section => {
        const sectionTop = section.offsetTop - 80;
        const sectionHeight = section.offsetHeight;
        if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    });
  }

  function setupMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');
    
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('show');
        menuBtn.classList.toggle('active'); 
        menuBtn.setAttribute('aria-expanded', navLinks.classList.contains('show'));
      });
    }
  }

  function setupSmoothScrolling() {
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          
          const navLinks = document.getElementById('nav-links');
          if (window.innerWidth <= 768 && navLinks.classList.contains('show')) {
            navLinks.classList.remove('show');
            const menuBtn = document.getElementById('menu-btn');
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.classList.remove('active');
          }
        }
      });
    });
  }

  function setupContactForm() {
    const form = document.getElementById('contact-form');
    const messageBox = document.getElementById('form-message');

    if (!form || !messageBox) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        from_name: form.from_name.value.trim(),
        from_email: form.from_email.value.trim(),
        message: form.message.value.trim(),
        honeypot: form.honeypot.value  
      };

      if (formData.honeypot) return;  
      if (!formData.from_name || !formData.from_email || !formData.message) {
        showMessage("Veuillez remplir tous les champs.", "error");
        return;
      }
      if (!isValidEmail(formData.from_email)) {
        showMessage("Adresse email invalide.", "error");
        return;
      }

      try {
        await emailjs.send(
          CONFIG.emailjs.serviceId,
          CONFIG.emailjs.templateId,
          formData
        );
        
        showMessage("Message envoyé avec succès !", "success");
        form.reset();
      } catch (error) {
        console.error("Erreur EmailJS :", error);
        showMessage("Erreur lors de l'envoi. Réessayez plus tard.", "error");
      }
    });
  }

  async function loadArchivesPhotos() {
    try {
      const archives = await fetchData('archives-photos.json');
      const sortedArchives = archives.map(yearData => {
        return {
          ...yearData,
          events: yearData.events.sort((a, b) => {
            const dateA = convertFrenchDateToJS(a.date);
            const dateB = convertFrenchDateToJS(b.date);
            return dateB - dateA;
          })
        };
      }).sort((a, b) => b.year - a.year);

      displayArchivesPhotos(sortedArchives);
    } catch (error) {
      console.error("Erreur chargement archives photos:", error);
      const container = document.querySelector('#archives-photos-container');
      if (container) {
        container.innerHTML = '<p class="error-message">Impossible de charger les archives photos.</p>';
      }
    }
  }

  function displayArchivesPhotos(archives) {
    const container = document.querySelector('#archives-photos-container');
    if (!container) return;

    container.innerHTML = archives.map(yearData => `
      ${yearData.events.map(event => `
        <div class="event-section" data-year="${yearData.year}">
          <div class="event-header">
            <h3 class="event-title">${event.title}</h3>
            <span class="event-date">${event.date}</span>
          </div>
          <p class="event-description">${event.description}</p>
          <div class="gallery">
            ${event.images.map(img => `
              <img src="${img}" alt="${event.title}" class="gallery-img">
            `).join('')}
          </div>
        </div>
      `).join('')}
    `).join('');

    setupLightbox();
  }

  async function loadActualites() {
    try {
      const actualites = await fetchData('actualites.json');
      const sortedActualites = actualites.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recentActualites = filterRecentActualites(sortedActualites, 30);

      displayActualites(recentActualites, '.actualite-container');
      displayActualites(sortedActualites, '#archives-actualites-container');
    } catch (error) {
      console.error("Erreur chargement actualités:", error);
      const containers = ['.actualite-container', '#archives-actualites-container'];
      containers.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
          el.innerHTML = '<p class="no-news">Aucune actualité disponible pour le moment.</p>';
        }
      });
    }
  }

  function filterFutureEvents(events) {
    const now = new Date();
    return events.filter(event => {
      try {
        const eventDate = new Date(event.date);
        return eventDate >= now;
      } catch (e) {
        console.error('Erreur traitement date:', e);
        return false;
      }
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  async function loadEvenements() {
    try {
      const evenements = await fetchData('evenements.json');
      const sortedEvenements = evenements.sort((a, b) => new Date(a.date) - new Date(b.date));
      const futureEvents = filterFutureEvents(sortedEvenements);
    
      if (futureEvents.length > 0) {
        displayEvenements(futureEvents);
        setupCarousel();
      } else {
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
          carouselContainer.innerHTML = '<p class="no-events">Aucun événement à venir pour le moment. Revenez bientôt !</p>';
        }
      }
    } catch (error) {
      console.error("Erreur chargement événements:", error);
    }
  }

  function setupProblemOfTheDay() {
    const container = document.getElementById('probleme-container');
    const image = document.getElementById('probleme-image');
    const desc = document.getElementById('probleme-desc');
    const solutionBtn = document.getElementById('solution-btn');
    const dateContainer = document.createElement('div'); 

    if (!container || !image || !desc || !solutionBtn) return;

    dateContainer.className = 'probleme-date';
    container.insertBefore(dateContainer, container.firstChild);

    const today = new Date();
    dateContainer.textContent = formatDate(today.toISOString().split('T')[0]);

    desc.textContent = "Chargement du problème du jour...";
    solutionBtn.style.display = "none";

    fetch('https://api.chess.com/pub/puzzle')
      .then(response => {
        if (!response.ok) throw new Error("Erreur réseau");
        return response.json();
      })
      .then(data => {
        if (!data.fen || !data.image || !data.url || !data.title) {
          throw new Error("Données incomplètes dans la réponse Chess.com");
        }
        const trait = data.fen.split(' ')[1] === 'w' ? 'blancs' : 'noirs';
        const largeImageUrl = data.image.replace('size=2', 'size=10');

        image.src = largeImageUrl;
        image.alt = `Puzzle du jour : ${data.title}`;

        desc.innerHTML = `
          <strong>Trouvez le meilleur coup pour les ${trait}<br></strong>
          Seriez-vous à la hauteur ?<br><br>
          <small>Puzzle fourni par Chess.com</small><br>
        `;

        solutionBtn.style.display = "inline-block";
        solutionBtn.addEventListener('click', () => {
          window.open(data.url, '_blank');
        });
      })
      .catch(error => {
        console.error("Erreur Chess.com Puzzle :", error);
        desc.innerHTML = `
          <strong>Problème technique</strong><br>
          Nous n'avons pas pu charger le puzzle du jour.<br>
          <a href="https://www.chess.com/puzzles" target="_blank" rel="noopener noreferrer">Visitez Chess.com pour des puzzles</a>
        `;
        solutionBtn.style.display = "none";
      });
  }

  function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (!lightbox || !lightboxImg || !lightboxClose) return;

    document.querySelectorAll('.gallery img, .event-gallery img, .actualite-image, .carousel-image, .about-logo, #probleme-image').forEach(img => {
      img.addEventListener('click', () => {
        lightbox.style.display = 'flex';
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
        document.body.style.overflow = 'hidden'; 
      });
    });

    const closeLightbox = () => {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    };

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => e.target === lightbox && closeLightbox());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.style.display === 'flex') {
        closeLightbox();
      }
    });
  }

  function setupStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(document.getElementById('about'));
  }

  function setupCarousel() {
    const carousel = document.querySelector('.carousel');
    const items = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.carousel-dots');
    
    if (!carousel || items.length === 0) return;
    
    let currentIndex = 0;
    const totalItems = items.length;
    let intervalId;
    
    const createDots = () => {
      dotsContainer.innerHTML = '';
      items.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
      });
    };
    
    const updateCarousel = () => {
      carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    };
    
    const goToSlide = (index) => {
      currentIndex = index;
      updateCarousel();
      resetAutoRotation();
    };
    
    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % totalItems;
      updateCarousel();
    };
    
    const prevSlide = () => {
      currentIndex = (currentIndex - 1 + totalItems) % totalItems;
      updateCarousel();
    };
    
    const startAutoRotation = () => {
      stopAutoRotation();
      intervalId = setInterval(nextSlide, 5000);
    };
    
    const stopAutoRotation = () => {
      clearInterval(intervalId);
    };
    
    const resetAutoRotation = () => {
      stopAutoRotation();
      startAutoRotation();
    };
    
    createDots();
    startAutoRotation();
    
    nextBtn?.addEventListener('click', () => {
      nextSlide();
      resetAutoRotation();
    });
    
    prevBtn?.addEventListener('click', () => {
      prevSlide();
      resetAutoRotation();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
        resetAutoRotation();
      }
      if (e.key === 'ArrowLeft') {
        prevSlide();
        resetAutoRotation();
      }
    });
    
    carousel.addEventListener('mouseenter', stopAutoRotation);
    carousel.addEventListener('mouseleave', startAutoRotation);
  }

  function setupArchivesFilter() {
    const archiveBtns = document.querySelectorAll('.archive-year-btn');
    if (archiveBtns.length === 0) return;

    archiveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        archiveBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const year = btn.dataset.year;
        filterArchivesByYear(year);
      });
    });
  }

  function filterArchivesByYear(year) {
    if (year === 'all') {
      document.querySelectorAll('.event-section, .actualite-card').forEach(el => {
        el.style.display = '';
      });
    } else {
      document.querySelectorAll('.event-section, .actualite-card').forEach(el => {
        const elYear = el.dataset.year || el.querySelector('.actualite-date')?.textContent?.match(/\d{4}/)?.[0];
        el.style.display = elYear === year ? '' : 'none';
      });
    }
  }

  /* ==================== */
  /* FONCTIONS UTILITAIRES */
  /* ==================== */

  async function fetchData(path, fallback = []) {
    const jsonPaths = [
      `./${path}`,
      path,
      `/${path}`,
      `./data/${path}`
    ];

    for (const jsonPath of jsonPaths) {
      try {
        const response = await fetch(jsonPath);
        if (response.ok) {
          const data = await response.json();
          console.log(`Données chargées depuis ${jsonPath}`);
          return data;
        }
      } catch (e) {
        console.warn(`Échec sur ${jsonPath}`, e);
      }
    }

    console.warn(`Échec de chargement pour ${path}`);
    throw new Error(`Impossible de charger ${path}`);
  }

  function filterRecentActualites(actualites, days) {
    const now = new Date();
    return actualites.filter(actu => {
      try {
        const actuDate = new Date(actu.date);
        const diffTime = now - actuDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= days;
      } catch (e) {
        console.error('Erreur traitement date:', e);
        return false;
      }
    });
  }

  function displayActualites(actualites, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    if (!actualites || actualites.length === 0) {
      container.innerHTML = '<p class="no-news">Aucune actualité disponible pour le moment.</p>';
      return;
    }

    container.innerHTML = actualites.map(actu => `
      <div class="actualite-card">
        <img src="${actu.image}" alt="${actu.titre}" class="actualite-image" loading="lazy">
        <div class="actualite-content">
          <div class="actualite-date">${formatDate(actu.date)}</div>
          <h3>${actu.titre}</h3>
          <p>${actu.description}</p>
          <a href="${actu.lien}" target="_blank" rel="noopener noreferrer" class="actualite-link">
            Lire la suite 
          </a>
        </div>
      </div>
    `).join('');
    setupLightbox();
  }

  function displayEvenements(evenements) {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    carousel.innerHTML = evenements.map(evt => `
      <div class="carousel-item">
        <div class="carousel-card">
          <div class="carousel-image-container">
            <img src="${evt.image}" alt="${evt.titre}" class="carousel-image" loading="lazy">
          </div>
          <div class="carousel-content">
            <div class="carousel-date">${formatDate(evt.date)}</div>
            <h3>${evt.titre}</h3>
            <p>${evt.description}</p>
            <a href="${evt.lien}" target="_blank" rel="noopener noreferrer" class="carousel-link">
              Plus d'informations
            </a>
          </div>
        </div>
      </div>
    `).join('');
    setupLightbox();
  }

  function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length === 0) return;

    const duration = 2000;
    const startTime = Date.now();
    const targetValues = [
      CONFIG.stats.licencies,
      CONFIG.stats.jeunes,
      CONFIG.stats.animateurs
    ];

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
    
      statNumbers.forEach((num, index) => {
        num.textContent = Math.floor(targetValues[index] * progress);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  function showMessage(text, type) {
    const messageBox = document.getElementById('form-message');
    if (!messageBox) return;
    
    messageBox.textContent = text;
    messageBox.className = type;
    
    setTimeout(() => {
      messageBox.textContent = '';
      messageBox.className = '';
    }, 5000);
  }

  function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function convertFrenchDateToJS(dateString) {
    // Gère les formats comme "28/04 Juillet 2025" ou "10 Novembre 2024"
    const parts = dateString.split(' ');
    
    // Si format avec jour/mois (ex: "28/04 Juillet 2025")
    if (parts.length === 3 && parts[0].includes('/')) {
      const [day, monthPart] = parts[0].split('/');
      const month = parts[1];
      const year = parts[2];
      
      const monthMap = {
        'Janvier': '01', 'Février': '02', 'Mars': '03', 'Avril': '04',
        'Mai': '05', 'Juin': '06', 'Juillet': '07', 'Août': '08',
        'Septembre': '09', 'Octobre': '10', 'Novembre': '11', 'Décembre': '12'
      };
      
      const monthNumber = monthMap[month] || '01';
      return new Date(`${year}-${monthNumber}-${day.padStart(2, '0')}`);
    }
    
    // Si format simple (ex: "10 Novembre 2024")
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      
      const monthMap = {
        'Janvier': '01', 'Février': '02', 'Mars': '03', 'Avril': '04',
        'Mai': '05', 'Juin': '06', 'Juillet': '07', 'Août': '08',
        'Septembre': '09', 'Octobre': '10', 'Novembre': '11', 'Décembre': '12'
      };
      const monthNumber = monthMap[month] || '01';
      return new Date(`${year}-${monthNumber}-${day.padStart(2, '0')}`);
    }
    
    return new Date();
  }

  document.getElementById('contact-form').addEventListener('submit', function() {
    this.classList.add('sending');
    setTimeout(() => this.classList.remove('sending'), 2000);
  });
});