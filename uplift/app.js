(function () {
  'use strict';

  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var themeColour = document.querySelector('meta[name="theme-color"]');
  var searchInput = document.getElementById('experienceSearch');
  var focusSelect = document.getElementById('capabilityFilter');
  var resetButton = document.getElementById('resetFilters');
  var resultCount = document.getElementById('resultCount');
  var emptyState = document.getElementById('emptyState');
  var viewButtons = Array.from(document.querySelectorAll('[data-view]'));
  var entries = Array.from(document.querySelectorAll('.experience-entry'));
  var previousOpenState = null;
  var printState = null;
  var storedTheme = null;

  try {
    storedTheme = localStorage.getItem('ml-uplift-theme');
  } catch (error) {
    storedTheme = null;
  }

  var darkTheme = storedTheme === 'dark';

  function applyTheme() {
    root.dataset.theme = darkTheme ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(darkTheme));
    themeColour.content = darkTheme ? '#202623' : '#ffffff';
  }

  applyTheme();
  themeToggle.addEventListener('click', function () {
    darkTheme = !darkTheme;
    applyTheme();
    try {
      localStorage.setItem('ml-uplift-theme', darkTheme ? 'dark' : 'light');
    } catch (error) {
      storedTheme = null;
    }
  });

  function normalise(value) {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function termPattern(term) {
    var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var prefix = /^\w/.test(term) ? '\\b' : '';
    var suffix = term.length <= 2 && /\w$/.test(term) ? '\\b' : '';
    return prefix + escaped + suffix;
  }

  var records = entries.map(function (entry) {
    var details = entry.querySelector('.role-details');
    details.open = false;
    return {
      entry: entry,
      details: details,
      tags: entry.dataset.tags.split(' '),
      text: normalise(Array.from(entry.querySelectorAll('.searchable')).map(function (field) {
        return field.textContent;
      }).join(' '))
    };
  });

  function syncDetailView() {
    if (printState) { return; }
    var visible = records.filter(function (record) { return !record.entry.hidden; });
    viewButtons.forEach(function (button) {
      var expanded = button.dataset.view === 'detail';
      button.disabled = visible.length === 0;
      button.setAttribute('aria-pressed', String(visible.length > 0 && visible.every(function (record) {
        return record.details.open === expanded;
      })));
    });
  }

  function highlightMatches(entry, terms) {
    entry.querySelectorAll('mark').forEach(function (mark) {
      mark.replaceWith(document.createTextNode(mark.textContent));
    });
    entry.normalize();
    if (!terms.length) { return; }

    var pattern = terms.slice().sort(function (first, second) {
      return second.length - first.length;
    }).map(termPattern).join('|');
    var matcher = new RegExp('(' + pattern + ')', 'gi');

    entry.querySelectorAll('.searchable').forEach(function (field) {
      var walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT);
      var textNodes = [];
      while (walker.nextNode()) { textNodes.push(walker.currentNode); }
      textNodes.forEach(function (textNode) {
        var parts = textNode.textContent.split(matcher);
        if (parts.length === 1) { return; }
        var fragment = document.createDocumentFragment();
        parts.forEach(function (part, index) {
          var piece = index % 2 === 1 ? document.createElement('mark') : document.createTextNode(part);
          if (index % 2 === 1) { piece.textContent = part; }
          fragment.appendChild(piece);
        });
        textNode.replaceWith(fragment);
      });
    });
  }

  function updateResults() {
    var query = normalise(searchInput.value);
    var terms = Array.from(new Set(query.split(' ').filter(Boolean)));
    var matchers = terms.map(function (term) { return new RegExp(termPattern(term), 'i'); });
    var active = Boolean(query || focusSelect.value !== 'all');
    if (active && previousOpenState === null) {
      previousOpenState = records.map(function (record) { return record.details.open; });
    }

    var visibleCount = 0;
    records.forEach(function (record, index) {
      var matchesFocus = focusSelect.value === 'all' || record.tags.includes(focusSelect.value);
      var matchesQuery = matchers.every(function (matcher) { return matcher.test(record.text); });
      var visible = matchesFocus && matchesQuery;
      record.entry.hidden = !visible;
      if (visible) { visibleCount += 1; }
      if (active) {
        record.details.open = visible;
      } else if (previousOpenState !== null) {
        record.details.open = previousOpenState[index];
      }
      highlightMatches(record.entry, visible ? terms : []);
    });

    if (!active) { previousOpenState = null; }
    resultCount.textContent = visibleCount + ' of ' + records.length + ' entries';
    emptyState.hidden = visibleCount !== 0;
    resetButton.disabled = !active;
    syncDetailView();
  }

  function resetFilters() {
    searchInput.value = '';
    focusSelect.value = 'all';
    updateResults();
  }

  viewButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var expanded = button.dataset.view === 'detail';
      records.forEach(function (record) { record.details.open = expanded; });
      if (previousOpenState !== null) {
        previousOpenState = records.map(function () { return expanded; });
      }
      syncDetailView();
    });
  });
  records.forEach(function (record) { record.details.addEventListener('toggle', syncDetailView); });
  searchInput.addEventListener('input', updateResults);
  focusSelect.addEventListener('change', updateResults);
  resetButton.addEventListener('click', function () {
    resetFilters();
    searchInput.focus();
  });
  document.querySelector('[data-reset]').addEventListener('click', function () {
    resetFilters();
    searchInput.focus();
  });
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      resetFilters();
    }
  });
  document.addEventListener('keydown', function (event) {
    var editing = event.target.closest('input, textarea, select, [contenteditable]');
    if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
      event.preventDefault();
      searchInput.focus();
    }
  });

  document.querySelectorAll('[data-search-term]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      searchInput.value = link.dataset.searchTerm;
      focusSelect.value = 'all';
      updateResults();
      document.getElementById('experience').scrollIntoView({ block: 'start' });
      searchInput.focus({ preventScroll: true });
    });
  });

  function revealHashTarget() {
    var target = document.getElementById(location.hash.slice(1));
    if (!target || !target.classList.contains('experience-entry')) { return; }
    resetFilters();
    target.querySelector('.role-details').open = true;
    target.scrollIntoView({ block: 'start' });
    syncDetailView();
  }
  window.addEventListener('hashchange', revealHashTarget);

  window.addEventListener('beforeprint', function () {
    if (printState) { return; }
    printState = Array.from(document.querySelectorAll('details')).map(function (details) {
      return { details: details, open: details.open };
    });
    printState.forEach(function (state) { state.details.open = true; });
  });
  window.addEventListener('afterprint', function () {
    if (!printState) { return; }
    printState.forEach(function (state) { state.details.open = state.open; });
    printState = null;
    syncDetailView();
  });
  document.getElementById('printResume').addEventListener('click', function () { window.print(); });

  var actionStatus = document.getElementById('actionStatus');
  var statusTimer;
  function announce(message) {
    clearTimeout(statusTimer);
    actionStatus.textContent = message;
    statusTimer = setTimeout(function () { actionStatus.textContent = ''; }, 4500);
  }
  document.getElementById('copyEmail').addEventListener('click', async function () {
    var email = document.getElementById('emailAddress');
    try {
      await navigator.clipboard.writeText(email.textContent);
      announce('Email address copied.');
    } catch (error) {
      var range = document.createRange();
      range.selectNodeContents(email);
      var selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        announce('Clipboard unavailable. Email address selected.');
      } else {
        announce('Clipboard unavailable.');
      }
    }
  });

  var navLinks = Array.from(document.querySelectorAll('.contents nav a'));
  if ('IntersectionObserver' in window) {
    var navigationObserver = new IntersectionObserver(function (entriesObserved) {
      entriesObserved.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (link) {
          if (link.hash === '#' + entry.target.id) {
            link.setAttribute('aria-current', 'location');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px' });
    navLinks.forEach(function (link) { navigationObserver.observe(document.querySelector(link.hash)); });
  }

  root.classList.add('js');
  updateResults();
  revealHashTarget();
})();