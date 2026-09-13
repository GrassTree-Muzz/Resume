(function () {
	'use strict';
	var dialog = document.getElementById('photoDialog');
	var photoOpen = document.getElementById('photoOpen');
	var photoClose = document.getElementById('photoClose');
	var fullPhoto = dialog ? dialog.querySelector('img') : null;
	if (fullPhoto && fullPhoto.src) {
		fullPhoto.dataset.src = fullPhoto.src;
		fullPhoto.removeAttribute('src');
	}
	if (dialog && photoOpen && photoClose) {
		photoOpen.addEventListener('click', function () {
			if (fullPhoto && !fullPhoto.src) { fullPhoto.src = fullPhoto.dataset.src; }
			dialog.showModal();
		});
		photoClose.addEventListener('click', function () { dialog.close(); });
		dialog.addEventListener('click', function (event) { if (event.target === dialog) { dialog.close(); } });
	}
	var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
	function select(tab) {
		tabs.forEach(function (item) {
			var panel = document.getElementById(item.getAttribute('aria-controls'));
			var active = item === tab;
			item.setAttribute('aria-selected', active ? 'true' : 'false');
			if (panel) { panel.classList.toggle('active', active); }
		});
		history.replaceState(null, '', '#' + tab.id.replace('tab-', ''));
	}
	tabs.forEach(function (tab) { tab.addEventListener('click', function () { select(tab); }); });
	var initial = document.getElementById('tab-' + location.hash.replace('#', ''));
	if (initial) { select(initial); }
	var themeButton = document.getElementById('themeBtn');
	var dark = false;
	try { dark = localStorage.getItem('ml-application-theme') === 'dark'; } catch (err) { }
	function applyTheme() { document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light'); if (themeButton) { themeButton.innerHTML = dark ? '&#9788;' : '&#9789;'; } }
	applyTheme();
	if (themeButton) { themeButton.addEventListener('click', function () { dark = !dark; applyTheme(); try { localStorage.setItem('ml-application-theme', dark ? 'dark' : 'light'); } catch (err) { } }); }
	var jobs = Array.prototype.slice.call(document.querySelectorAll('#jobs .job'));
	var note = document.getElementById('filterNote');
	var filters = document.getElementById('expFilters');
	if (filters) { filters.addEventListener('click', function (event) {
		var button = event.target && event.target.closest ? event.target.closest('.chip') : null;
		if (!button) { return; }
		var tag = button.dataset.tag;
		Array.prototype.forEach.call(filters.querySelectorAll('.chip'), function (item) { item.setAttribute('aria-pressed', item === button ? 'true' : 'false'); });
		jobs.forEach(function (job) { var visible = tag === 'all' || (job.dataset.tags || '').split(' ').indexOf(tag) !== -1; job.classList.toggle('hidden', !visible); if (visible && tag !== 'all') { job.open = true; } });
		if (note) { note.textContent = tag === 'all' ? 'Showing all roles. Tap a card to expand.' : 'Showing roles related to ' + button.textContent + '.'; }
	}); }
})();
