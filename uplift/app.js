(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var themeColour = document.querySelector('meta[name="theme-color"]');
  var storedTheme = null;

  try {
    storedTheme = localStorage.getItem('ml-uplift-theme');
  } catch (error) {
    storedTheme = null;
  }

  var darkTheme = storedTheme
    ? storedTheme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme() {
    root.dataset.theme = darkTheme ? 'dark' : 'light';
    themeToggle.setAttribute('aria-label', darkTheme ? 'Use light colour theme' : 'Use dark colour theme');
    themeToggle.setAttribute('aria-pressed', darkTheme ? 'true' : 'false');
    themeColour.setAttribute('content', darkTheme ? '#17211e' : '#142722');
  }

  applyTheme();

  themeToggle.addEventListener('click', function () {
    darkTheme = !darkTheme;
    applyTheme();
    try {
      localStorage.setItem('ml-uplift-theme', darkTheme ? 'dark' : 'light');
    } catch (error) {
      // Theme persistence is optional when browser storage is unavailable.
    }
  });

  var searchInput = document.getElementById('experienceSearch');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-button'));
  var roles = Array.prototype.slice.call(document.querySelectorAll('.role-card'));
  var resultCount = document.getElementById('resultCount');
  var emptyState = document.getElementById('emptyState');
  var activeFilter = 'all';

  function normalise(value) {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function updateResults() {
    var query = normalise(searchInput.value);
    var visibleCount = 0;

    roles.forEach(function (role) {
      var tags = role.dataset.tags.split(' ');
      var matchesFilter = activeFilter === 'all' || tags.indexOf(activeFilter) !== -1;
      var matchesSearch = !query || normalise(role.dataset.search + ' ' + role.textContent).indexOf(query) !== -1;
      var visible = matchesFilter && matchesSearch;

      role.hidden = !visible;
      if (visible) {
        visibleCount += 1;
      }
    });

    var qualifier = activeFilter === 'all' ? '' : ' in this capability';
    resultCount.textContent = 'Showing ' + visibleCount + ' of ' + roles.length + ' project roles' + qualifier + '.';
    emptyState.hidden = visibleCount !== 0;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.dataset.filter;
      filterButtons.forEach(function (candidate) {
        candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false');
      });
      updateResults();
    });
  });

  searchInput.addEventListener('input', updateResults);
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && searchInput.value) {
      searchInput.value = '';
      updateResults();
    }
  });

  document.addEventListener('keydown', function (event) {
    var target = event.target;
    var isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (event.key === '/' && !isTyping) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.primary-nav a'));
  var observedSections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window) {
    var navigationObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        navLinks.forEach(function (link) {
          var current = link.getAttribute('href') === '#' + entry.target.id;
          if (current) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });

    observedSections.forEach(function (section) {
      navigationObserver.observe(section);
    });
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && 'IntersectionObserver' in window) {
    var revealItems = Array.prototype.slice.call(document.querySelectorAll('.role-card, .capability-grid article'));
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(function (item) {
      item.classList.add('reveal-ready');
      revealObserver.observe(item);
    });
  }
})();
