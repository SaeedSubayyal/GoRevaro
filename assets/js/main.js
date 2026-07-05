(function () {
    'use strict';

    var CALENDLY_URL = 'https://calendly.com/your-account/consultation';

    /* --- Delivery Models tab toggle (called via inline onclick) --- */
    window.switchTab = function (el, targetId) {
      document.querySelectorAll('.dm-tab').forEach(function (t) { t.classList.remove('active'); });
      el.classList.add('active');
      document.querySelectorAll('.dm-body').forEach(function (b) { b.style.display = 'none'; });
      var target = document.getElementById(targetId);
      if (target) target.style.display = 'grid';
    };

 
    var header = document.getElementById('site-header');
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    var menuBtn = document.getElementById('menu-btn');
    var drawer  = document.getElementById('mobile-drawer');
    var open    = false;

    function setMenu(state) {
      open = state;
      menuBtn.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('open', open);
    }

    menuBtn.addEventListener('click', function () { setMenu(!open); });

    document.addEventListener('click', function (e) {
      if (open && !menuBtn.contains(e.target) && !drawer.contains(e.target)) {
        setMenu(false);
      }
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });


    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (a.classList.contains('calendly-link') || href === '#') return;
        e.preventDefault();
        var target = document.querySelector(href);
        if (target) {
          var top = target.getBoundingClientRect().top + window.pageYOffset - 84;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });


    var tabBtns   = document.querySelectorAll('.tab-btn');
    var tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-tab');
        tabBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        var panel = document.getElementById(id);
        if (panel) panel.classList.add('active');
      });
    });

    /* Keyboard navigation for tabs */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var active = document.querySelector('.tab-btn.active');
      if (!active) return;
      var all = Array.from(tabBtns);
      var idx = all.indexOf(active);
      var next = e.key === 'ArrowRight'
        ? (idx + 1) % all.length
        : (idx - 1 + all.length) % all.length;
      all[next].focus();
      all[next].click();
    });

    /* --- Calendly links --- */
    document.querySelectorAll('.calendly-link').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        if (CALENDLY_URL) {
          window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
        }
      });
    });

    var yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    /* --- FAQ accordion ---
         Closes any open item first, then opens the clicked one
         (clicking an already-open item collapses it).          */
    document.querySelectorAll('.faq-q').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var answer = trigger.nextElementSibling;
        var isOpen = answer.classList.contains('open');

        /* Collapse all items */
        document.querySelectorAll('.faq-a').forEach(function (a) { a.classList.remove('open'); });
        document.querySelectorAll('.faq-q').forEach(function (q) { q.classList.remove('open'); });

        /* If it was closed, open it now */
        if (!isOpen) {
          answer.classList.add('open');
          trigger.classList.add('open');
        }
      });
    });

    /* --- RevaroAI chatbot --- */
    var chatbotToggle = document.getElementById('chatbot-toggle');
    var chatbotPanel = document.getElementById('chatbot-panel');
    var chatbotClose = document.getElementById('chatbot-close');
    var chatbotForm = document.getElementById('chatbot-form');
    var chatbotInput = document.getElementById('chatbot-input');
    var chatbotMessages = document.getElementById('chatbot-messages');
    var chatbotSuggestions = document.querySelectorAll('.chatbot-suggestion');
    var chatbotWelcome = document.getElementById('chatbot-welcome');
    var chatbotSuggestionsWrap = document.getElementById('chatbot-suggestions');
    var conversation = [];

    function hideIntro() {
      if (chatbotWelcome) {
        chatbotWelcome.remove();
        chatbotWelcome = null;
      }
      if (chatbotSuggestionsWrap) {
        chatbotSuggestionsWrap.remove();
        chatbotSuggestionsWrap = null;
      }
    }

    function renderMessage(text, role) {
      var bubble = document.createElement('div');
      bubble.className = 'chatbot-msg ' + (role === 'user' ? 'chatbot-msg--user' : 'chatbot-msg--bot');
      bubble.innerHTML = role === 'user'
        ? '<strong>You:</strong> ' + text
        : '<strong>RevaroAI:</strong> ' + text;
      chatbotMessages.appendChild(bubble);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function setBusy(isBusy) {
      chatbotInput.disabled = isBusy;
      chatbotToggle.disabled = isBusy;
      chatbotToggle.setAttribute('aria-busy', String(isBusy));
    }

    function openChat() {
      chatbotPanel.hidden = false;
      chatbotToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('chat-open');
      setTimeout(function () { chatbotInput.focus(); }, 80);
    }

    function closeChat() {
      chatbotPanel.hidden = true;
      chatbotToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('chat-open');
    }

    chatbotToggle.addEventListener('click', function () {
      if (chatbotPanel.hidden) {
        openChat();
      } else {
        closeChat();
      }
    });

    chatbotClose.addEventListener('click', closeChat);

    chatbotSuggestions.forEach(function (btn) {
      btn.addEventListener('click', function () {
        openChat();
        chatbotInput.value = btn.getAttribute('data-suggestion');
        chatbotForm.requestSubmit();
      });
    });

    chatbotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var message = chatbotInput.value.trim();
      if (!message) return;

      hideIntro();
      renderMessage(message, 'user');
      conversation.push({ role: 'user', content: message });
      chatbotInput.value = '';
      setBusy(true);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation })
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('Request failed');
        }
        return response.json();
      }).then(function (data) {
        var reply = data.reply || 'I am here to help with GoRevaro-related questions. Please try again.';
        conversation.push({ role: 'assistant', content: reply });
        renderMessage(reply, 'assistant');
      }).catch(function () {
        renderMessage('I am having trouble reaching the assistant right now. Please try again shortly.', 'assistant');
      }).finally(function () {
        setBusy(false);
      });
    });

  }());
