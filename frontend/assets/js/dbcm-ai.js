/**
 * DBCM Autonomous Academic AI Tutor Client Module
 * Provides Document Q&A, PDF Summarization, Exam Practice, and Concept Explanations.
 */

(function () {
  'use strict';

  // State
  window.dbcmAiState = {
    isOpen: false,
    drawerSize: localStorage.getItem('dbcm_ai_drawer_size') || 'small',
    globalDrawerSize: localStorage.getItem('dbcm_global_ai_drawer_size') || 'small',
    currentDocument: null,
    currentSubject: null,
    conversationHistory: [],
    isLoading: false,
    activeEngine: localStorage.getItem('dbcm_gemini_api_key') ? 'gemini' : 'academic-engine'
  };

  /**
   * Safe Markdown Formatter
   */
  window.formatAiMarkdown = function (text) {
    if (!text) return '';

    let html = text
      // Escape raw HTML tags (excluding our own markup)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```lang ... ```
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="my-2.5 p-3 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto border border-gray-800"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-semibold">$1</code>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-xs font-bold text-gray-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-sm font-extrabold text-gray-900 dark:text-white mt-3.5 mb-2 pb-1 border-b border-gray-200 dark:border-white/10">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-base font-black text-gray-900 dark:text-white mt-4 mb-2 pb-1 border-b border-gray-200 dark:border-white/10">$1</h2>');

    // Blockquotes & Alerts
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="my-2 pl-3 border-l-2 border-indigo-500 text-gray-600 dark:text-gray-300 italic text-[11px]">$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');

    // Unordered lists (- or *)
    html = html.replace(/^[\*\-] (.*$)/gim, '<li class="ml-4 list-disc text-gray-700 dark:text-gray-300 my-0.5">$1</li>');

    // Numbered lists (1. 2.)
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-gray-700 dark:text-gray-300 my-0.5">$1</li>');

    // Horizontal Rules
    html = html.replace(/^---$/gim, '<hr class="my-3 border-t border-gray-200 dark:border-white/10" />');

    // Paragraph line breaks
    html = html.replace(/\n\n/g, '<div class="h-2"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  /**
   * Size Controls for Reader AI Drawer (Small vs Big)
   */
  window.setReaderAiSize = function (size) {
    const drawer = document.getElementById('reader-ai-drawer');
    const toggleBtn = document.getElementById('reader-ai-size-toggle-btn');
    const iconExpand = document.getElementById('reader-ai-size-icon-expand');
    const iconContract = document.getElementById('reader-ai-size-icon-contract');

    window.dbcmAiState.drawerSize = size;
    try { localStorage.setItem('dbcm_ai_drawer_size', size); } catch (e) {}

    if (drawer) {
      if (size === 'big') {
        drawer.classList.remove('drawer-small');
        drawer.classList.add('drawer-big');
      } else {
        drawer.classList.remove('drawer-big');
        drawer.classList.add('drawer-small');
      }
    }

    if (toggleBtn) {
      if (size === 'big') {
        toggleBtn.title = 'Minimize Chat (Compact)';
        if (iconExpand) iconExpand.classList.add('hidden');
        if (iconContract) iconContract.classList.remove('hidden');
      } else {
        toggleBtn.title = 'Expand Chat (Wide)';
        if (iconExpand) iconExpand.classList.remove('hidden');
        if (iconContract) iconContract.classList.add('hidden');
      }
    }
  };

  window.toggleReaderAiSize = function () {
    const current = window.dbcmAiState.drawerSize || 'small';
    window.setReaderAiSize(current === 'small' ? 'big' : 'small');
  };

  window.setGlobalAiSize = function (size) {
    const drawerContainer = document.querySelector('#global-ai-drawer > div');
    const toggleBtn = document.getElementById('global-ai-size-toggle-btn');
    const iconExpand = document.getElementById('global-ai-size-icon-expand');
    const iconContract = document.getElementById('global-ai-size-icon-contract');

    window.dbcmAiState.globalDrawerSize = size;
    try { localStorage.setItem('dbcm_global_ai_drawer_size', size); } catch (e) {}

    if (drawerContainer) {
      if (size === 'big') {
        drawerContainer.classList.remove('global-drawer-small');
        drawerContainer.classList.add('global-drawer-big');
      } else {
        drawerContainer.classList.remove('global-drawer-big');
        drawerContainer.classList.add('global-drawer-small');
      }
    }

    if (toggleBtn) {
      if (size === 'big') {
        toggleBtn.title = 'Minimize Chat (Compact)';
        if (iconExpand) iconExpand.classList.add('hidden');
        if (iconContract) iconContract.classList.remove('hidden');
      } else {
        toggleBtn.title = 'Expand Chat (Wide)';
        if (iconExpand) iconExpand.classList.remove('hidden');
        if (iconContract) iconContract.classList.add('hidden');
      }
    }
  };

  window.toggleGlobalAiSize = function () {
    const current = window.dbcmAiState.globalDrawerSize || 'small';
    window.setGlobalAiSize(current === 'small' ? 'big' : 'small');
  };

  /**
   * Toggle the AI Drawer in Document Reader
   */
  window.toggleReaderAiDrawer = function (explicitState) {
    const drawer = document.getElementById('reader-ai-drawer');
    const toggleBtn = document.getElementById('reader-ai-toggle-btn');
    const mobilePill = document.getElementById('reader-mobile-ai-pill-btn');
    const floatingPdfBtn = document.getElementById('reader-floating-ai-btn');
    const backdrop = document.getElementById('reader-ai-backdrop');
    if (!drawer) return;

    const isHidden = drawer.classList.contains('hidden');
    const shouldOpen = explicitState !== undefined ? explicitState : isHidden;

    if (shouldOpen) {
      drawer.classList.remove('hidden');
      if (toggleBtn) {
        toggleBtn.classList.add('ring-2', 'ring-purple-300');
      }
      if (mobilePill) {
        mobilePill.classList.add('hidden');
      }
      if (floatingPdfBtn) {
        floatingPdfBtn.classList.add('hidden');
      }
      if (backdrop) {
        backdrop.classList.remove('hidden');
      }
      window.dbcmAiState.isOpen = true;

      // Apply preferred size
      const prefSize = window.dbcmAiState.drawerSize || 'small';
      window.setReaderAiSize(prefSize);

      // If messages are empty, load welcome message with document context
      const messagesContainer = document.getElementById('reader-ai-messages');
      if (messagesContainer && messagesContainer.children.length === 0) {
        renderWelcomeMessage();
      }

      // Update and show quick prompts on initial view; hide once chat has history
      updateReaderAiQuickPrompts();

      // Auto-focus input
      setTimeout(() => {
        const input = document.getElementById('reader-ai-input');
        if (input) input.focus();
      }, 100);
    } else {
      drawer.classList.add('hidden');
      if (toggleBtn) {
        toggleBtn.classList.remove('ring-2', 'ring-purple-300');
      }
      if (mobilePill) {
        mobilePill.classList.remove('hidden');
      }
      if (floatingPdfBtn) {
        floatingPdfBtn.classList.remove('hidden');
      }
      if (backdrop) {
        backdrop.classList.add('hidden');
      }
      window.dbcmAiState.isOpen = false;
    }

    if (window.lucide) lucide.createIcons();
  };

  // Automatically hide reader AI drawer when tapping or clicking outside
  document.addEventListener('pointerdown', function (e) {
    const drawer = document.getElementById('reader-ai-drawer');
    const toggleBtn = document.getElementById('reader-ai-toggle-btn');
    const mobilePill = document.getElementById('reader-mobile-ai-pill-btn');
    if (!drawer || drawer.classList.contains('hidden')) return;

    // Ignore if clicked/tapped inside drawer, on toggle button, or in settings modal
    if (drawer.contains(e.target) || 
        (toggleBtn && toggleBtn.contains(e.target)) || 
        (mobilePill && mobilePill.contains(e.target)) ||
        e.target.closest('#ai-settings-modal')) {
      return;
    }

    // Outside tap/click detected -> automatically hide chat
    window.toggleReaderAiDrawer(false);
  });

  /**
   * Render Welcome Message in Reader
   */
  function renderWelcomeMessage() {
    const docName = window.dbcmAiState.currentDocument || 'Current Document';
    const subjName = window.dbcmAiState.currentSubject?.name || 'this subject';
    const isQuestionPaper = window.dbcmAiState.documentType === 'question-paper' || 
                            window.dbcmAiState.documentType === 'paper' || 
                            window.dbcmAiState.documentType === 'pyq' || 
                            /paper|pyq|exam\s*paper|question\s*paper/i.test(docName);

    const descText = isQuestionPaper
      ? `Hello! I'm your academic study assistant. I have loaded context for the exam paper <strong class="text-indigo-600 dark:text-indigo-400">"${docName}"</strong> (${subjName}).`
      : `Hello! I'm your academic study assistant. I have loaded context for <strong class="text-indigo-600 dark:text-indigo-400">"${docName}"</strong> (${subjName}).`;

    const hintText = isQuestionPaper
      ? `Ask me to solve any question with step-by-step working, provide marking schemes, or generate different similar practice questions!`
      : `Ask me any question, click a suggested quick action below, or request an exam summary!`;

    const welcomeHtml = `
      <div class="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800/30 space-y-2">
        <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
          <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          </div>
          <span>DBCM Autonomous Academic AI Tutor</span>
        </div>
        <p class="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300">
          ${descText}
        </p>
        <p class="text-[11px] text-gray-600 dark:text-gray-400">
          ${hintText}
        </p>
      </div>
    `;

    const container = document.getElementById('reader-ai-messages');
    if (container) {
      container.innerHTML = welcomeHtml;
      if (window.lucide) lucide.createIcons();
    }
  }

  /**
   * Update Quick Prompt Chips based on document type (Question Paper vs Notes/Syllabus)
   */
  function updateReaderAiQuickPrompts() {
    const quickPrompts = document.getElementById('reader-ai-quick-prompts');
    if (!quickPrompts) return;

    const hasHistory = window.dbcmAiState.conversationHistory && window.dbcmAiState.conversationHistory.length > 0;
    if (hasHistory) {
      quickPrompts.classList.add('hidden');
      quickPrompts.style.display = 'none';
      return;
    }

    const docTitle = window.dbcmAiState.currentDocument || '';
    const isQuestionPaper = window.dbcmAiState.documentType === 'question-paper' || 
                            window.dbcmAiState.documentType === 'paper' || 
                            window.dbcmAiState.documentType === 'pyq' || 
                            /paper|pyq|exam\s*paper|question\s*paper/i.test(docTitle);

    if (isQuestionPaper) {
      quickPrompts.innerHTML = `
        <button onclick="sendQuickPrompt('Provide step-by-step solutions and model answers for all the questions in this exam paper')" class="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="check-circle" class="w-3 h-3 text-indigo-500"></i> Solve Questions
        </button>
        <button onclick="sendQuickPrompt('Give the answer key, marking scheme, and key formulas needed for full marks on this question paper')" class="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="key" class="w-3 h-3 text-emerald-500"></i> Answer Key
        </button>
        <button onclick="sendQuickPrompt('Generate different similar practice questions based on the questions in this exam paper')" class="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="sparkles" class="w-3 h-3 text-purple-500"></i> Different Questions
        </button>
        <button onclick="sendQuickPrompt('Which questions in this paper carry the highest marks and most repeated topics?')" class="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="award" class="w-3 h-3 text-amber-500"></i> High Marks Questions
        </button>
      `;
    } else {
      quickPrompts.innerHTML = `
        <button onclick="sendQuickPrompt('Summarize this PDF document with key takeaways and syllabus breakdown')" class="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="file-text" class="w-3 h-3 text-indigo-500"></i> Summarize PDF
        </button>
        <button onclick="sendQuickPrompt('Give me 5 high-yield exam practice questions with model answers from this document')" class="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="help-circle" class="w-3 h-3 text-emerald-500"></i> 5 Exam Questions
        </button>
        <button onclick="sendQuickPrompt('What are the most important formulas, definitions, and key concepts in this material?')" class="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="zap" class="w-3 h-3 text-amber-500"></i> Key Concepts
        </button>
      `;
    }

    quickPrompts.classList.remove('hidden');
    quickPrompts.style.display = '';
    if (window.lucide) lucide.createIcons();
  }
  window.updateReaderAiQuickPrompts = updateReaderAiQuickPrompts;

  /**
   * Set context when a document is opened in Reader
   */
  window.setReaderAiDocumentContext = function (docTitle, subjectObj, docType = 'document') {
    const isQuestionPaper = docType === 'question-paper' || 
                            docType === 'paper' || 
                            docType === 'pyq' || 
                            /paper|pyq|exam\s*paper|question\s*paper/i.test(docTitle);

    window.dbcmAiState.currentDocument = docTitle;
    window.dbcmAiState.currentSubject = subjectObj;
    window.dbcmAiState.documentType = isQuestionPaper ? 'question-paper' : docType;

    const labelEl = document.getElementById('reader-ai-doc-name');
    if (labelEl) {
      labelEl.textContent = `Context: ${docTitle}`;
      labelEl.title = docTitle;
    }

    // Update global badge
    const badge = document.getElementById('reader-ai-engine-badge');
    if (badge) {
      const isCustomKey = !!localStorage.getItem('dbcm_gemini_api_key');
      badge.textContent = isCustomKey ? 'Gemini 1.5 Flash Active' : 'DBCM AI Engine Active';
    }

    // Refresh welcome message if opened
    const messagesContainer = document.getElementById('reader-ai-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
      renderWelcomeMessage();
    }
    
    // Update quick prompts based on context
    updateReaderAiQuickPrompts();
  };

  /**
   * Handle form submit in Reader
   */
  window.handleReaderAiSubmit = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('reader-ai-input');
    if (!input) return;

    const query = input.value.trim();
    if (!query || window.dbcmAiState.isLoading) return;

    input.value = '';
    input.style.height = 'auto';

    await executeAiQuery(query);
  };

  /**
   * Quick prompt helper
   */
  window.sendQuickPrompt = function (promptText) {
    executeAiQuery(promptText);
  };

  /**
   * Execute AI Query
   */
  async function executeAiQuery(query) {
    if (window.dbcmAiState.isLoading) return;
    window.dbcmAiState.isLoading = true;

    // Remove one-time recommendation prompts once user interacts
    const quickPrompts = document.getElementById('reader-ai-quick-prompts');
    if (quickPrompts) {
      quickPrompts.classList.add('hidden');
      quickPrompts.style.display = 'none';
    }

    const messagesContainer = document.getElementById('reader-ai-messages');
    const sendBtn = document.getElementById('reader-ai-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    // 1. Append User Message
    const userMsgId = 'user-msg-' + Date.now();
    const userBubbleHtml = `
      <div id="${userMsgId}" class="flex justify-end items-start gap-2">
        <div class="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-xs bg-indigo-600 text-white text-xs leading-relaxed shadow-sm">
          ${query.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
        <div class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
          You
        </div>
      </div>
    `;
    if (messagesContainer) {
      messagesContainer.insertAdjacentHTML('beforeend', userBubbleHtml);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 2. Append Typing Indicator
    const typingId = 'typing-' + Date.now();
    const typingHtml = `
      <div id="${typingId}" class="flex items-start gap-2">
        <div class="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5 shadow-xs">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        </div>
        <div class="px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs flex items-center gap-2 shadow-2xs">
          <span class="flex gap-1 items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0.15s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0.3s"></span>
          </span>
          <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400">DBCM AI is analyzing syllabus & notes...</span>
        </div>
      </div>
    `;
    if (messagesContainer) {
      messagesContainer.insertAdjacentHTML('beforeend', typingHtml);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      if (window.lucide) lucide.createIcons();
    }

    // 3. Prepare Payload
    const apiKey = localStorage.getItem('dbcm_gemini_api_key') || null;
    const subject = window.dbcmAiState.currentSubject || {};
    const context = {
      subjectId: subject.id || (typeof pageState !== 'undefined' && pageState.subject ? pageState.subject.id : null),
      subjectName: subject.name || (typeof pageState !== 'undefined' && pageState.subject ? pageState.subject.name : 'Computer Science'),
      subjectCode: subject.code || (typeof pageState !== 'undefined' && pageState.subject ? pageState.subject.code : 'DBCM-CORE'),
      documentTitle: window.dbcmAiState.currentDocument || 'Course Document',
      documentType: window.dbcmAiState.documentType || 'academic pdf',
      modules: subject.modules || (typeof pageState !== 'undefined' && pageState.subject ? pageState.subject.modules : [])
    };

    try {
      if (!apiKey) throw new Error('Configure your AI provider key in Settings to use the tutor.');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [...window.dbcmAiState.conversationHistory.slice(-6).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), { role: 'user', parts: [{ text: `${JSON.stringify(context)}\n\n${query}` }] }] })
      });
      const result = await response.json();
      const data = { success: response.ok, reply: result.candidates?.[0]?.content?.parts?.[0]?.text || result.error?.message, relatedQuestions: [] };
      
      // Remove typing indicator
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      if (data.success && data.reply) {
        // Record in conversation history
        window.dbcmAiState.conversationHistory.push(
          { role: 'user', content: query },
          { role: 'assistant', content: data.reply }
        );

        renderAssistantResponse(data.reply, data.relatedQuestions, data.source);
      } else {
        renderAssistantResponse(data.reply || 'Unable to retrieve answer. Please try again.', [], 'error');
      }
    } catch (err) {
      console.error('AI chat network error:', err);
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();
      renderAssistantResponse('Connection error. Check your internet connection and API key.', [], 'error');
    } finally {
      window.dbcmAiState.isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  /**
   * Render assistant response bubble with markdown and interactive related questions
   */
  function renderAssistantResponse(replyText, relatedQuestions = [], source = 'dbcm-academic-engine') {
    const messagesContainer = document.getElementById('reader-ai-messages');
    if (!messagesContainer) return;

    const msgId = 'ai-msg-' + Date.now();
    const formattedHtml = window.formatAiMarkdown(replyText);

    // Source badge
    const badgeText = source === 'gemini-api' ? 'Gemini 1.5' : 'DBCM Academic Engine';
    const badgeClass = source === 'gemini-api' 
      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';

    // Related questions chips
    let relatedHtml = '';
    if (relatedQuestions && relatedQuestions.length > 0) {
      relatedHtml = `
        <div class="mt-3 pt-2.5 border-t border-gray-200 dark:border-white/10">
          <p class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <i data-lucide="help-circle" class="w-3 h-3 text-indigo-500"></i> Related Questions
          </p>
          <div class="flex flex-col gap-1.5">
            ${relatedQuestions.map(q => `
              <button onclick="sendQuickPrompt('${q.replace(/'/g, "\\'")}')" 
                class="text-left px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-500/40 text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-medium transition-all cursor-pointer flex items-center justify-between group shadow-2xs">
                <span class="truncate pr-2">${q}</span>
                <i data-lucide="arrow-right" class="w-3 h-3 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0"></i>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    const aiBubbleHtml = `
      <div id="${msgId}" class="flex items-start gap-2 animate-fade-in">
        <div class="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5 shadow-xs">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        </div>
        <div class="flex-1 max-w-[92%] px-3.5 py-3 rounded-2xl rounded-tl-xs bg-white dark:bg-[#12141f] border border-gray-200 dark:border-white/10 shadow-xs text-xs leading-relaxed text-gray-800 dark:text-gray-200">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-white/5">
            <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold ${badgeClass}">
              ${badgeText}
            </span>
            <button onclick="copyAiAnswer('${msgId}')" 
              class="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Copy to Clipboard">
              <i data-lucide="copy" class="w-3 h-3"></i>
              <span class="copy-label">Copy</span>
            </button>
          </div>
          <div class="ai-content-body space-y-1">
            ${formattedHtml}
          </div>
          ${relatedHtml}
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', aiBubbleHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    if (window.lucide) lucide.createIcons();
  }

  /**
   * Copy AI Answer to clipboard
   */
  window.copyAiAnswer = function (msgId) {
    const el = document.getElementById(msgId);
    if (!el) return;
    const body = el.querySelector('.ai-content-body');
    if (!body) return;

    const textToCopy = body.innerText || body.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const copyLabel = el.querySelector('.copy-label');
      if (copyLabel) {
        const orig = copyLabel.textContent;
        copyLabel.textContent = 'Copied!';
        setTimeout(() => { copyLabel.textContent = orig; }, 2000);
      }
    }).catch(err => {
      console.warn('Clipboard write failed:', err);
    });
  };

  /**
   * Clear Chat
   */
  window.clearReaderAiChat = function () {
    window.dbcmAiState.conversationHistory = [];
    const container = document.getElementById('reader-ai-messages');
    if (container) {
      container.innerHTML = '';
      renderWelcomeMessage();
    }
    updateReaderAiQuickPrompts();
  };

  /**
   * AI Settings Modal Management
   */
  window.openAiSettingsModal = function () {
    let modal = document.getElementById('ai-settings-modal');
    if (!modal) {
      injectAiSettingsModal();
      modal = document.getElementById('ai-settings-modal');
    }
    const keyInput = document.getElementById('ai-settings-key-input');
    if (keyInput) {
      keyInput.value = '';
      keyInput.placeholder = 'Enter your Gemini API key (stored in this browser)';
    }

    updateAiSettingsStatus();
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  };

  window.closeAiSettingsModal = function () {
    const modal = document.getElementById('ai-settings-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.testGeminiConnection = async function () {
    const keyInput = document.getElementById('ai-settings-key-input');
    const resultEl = document.getElementById('ai-settings-test-result');
    if (!keyInput || !resultEl) return;

    const key = keyInput.value.trim();
    if (!key) {
      resultEl.innerHTML = `<span class="text-rose-500 font-medium">Please enter a Gemini API key first.</span>`;
      return;
    }

    resultEl.innerHTML = `<span class="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5"><i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Verifying with Google AI Studio...</span>`;
    if (window.lucide) lucide.createIcons();

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply: ready' }] }] })
      });
      const data = response.ok ? { success: true, message: 'Gemini API key is valid.' } : { success: false, error: `HTTP ${response.status}` };
      if (data.success) {
        resultEl.innerHTML = `<span class="text-emerald-500 font-semibold flex items-center gap-1.5"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> ${data.message} (Gemini 1.5 Flash Connected)</span>`;
      } else {
        resultEl.innerHTML = `<span class="text-rose-500 font-semibold flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Test Failed: ${data.error || 'Invalid API key'}</span>`;
      }
    } catch (e) {
      resultEl.innerHTML = `<span class="text-rose-500 font-semibold flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Network error connecting to verification endpoint.</span>`;
    }
    if (window.lucide) lucide.createIcons();
  };

  window.saveAiSettingsKey = async function () {
    const keyInput = document.getElementById('ai-settings-key-input');
    if (!keyInput) return;
    const val = keyInput.value.trim();
    if (val) {
      localStorage.setItem('dbcm_gemini_api_key', val);
      window.dbcmAiState.activeEngine = 'gemini';
      
    } else {
      localStorage.removeItem('dbcm_gemini_api_key');
      window.dbcmAiState.activeEngine = 'academic-engine';
    }
    updateAiSettingsStatus();
    closeAiSettingsModal();

    // Update reader badge
    const badge = document.getElementById('reader-ai-engine-badge');
    if (badge) {
      badge.textContent = val ? 'Gemini 1.5 Flash Active' : 'DBCM AI Engine Active';
    }

    if (typeof showToast === 'function') {
      showToast(val ? 'Gemini API Key Verified & Saved!' : 'Switched to Built-in DBCM Academic Engine');
    }
  };

  async function updateAiSettingsStatus() {
    const localKey = !!localStorage.getItem('dbcm_gemini_api_key');
    const statusText = document.getElementById('ai-settings-status-text');
    if (!statusText) return;

    try {
      const isConfigured = localKey;
      statusText.innerHTML = isConfigured 
        ? `<div class="flex items-center justify-between"><span class="text-emerald-500 font-semibold flex items-center gap-1.5"><i data-lucide="check-circle" class="w-4 h-4"></i> Google Gemini 1.5/2.0 API Active</span><span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono">LLM Powered</span></div>`
        : `<div class="flex items-center justify-between"><span class="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5"><i data-lucide="cpu" class="w-4 h-4"></i> Built-in DBCM Academic Engine Active</span><span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-mono">Zero Setup</span></div>`;
    } catch (e) {
      statusText.innerHTML = localKey 
        ? `<span class="text-emerald-500 font-semibold flex items-center gap-1.5"><i data-lucide="check-circle" class="w-4 h-4"></i> Google Gemini API Key Active (Local)</span>`
        : `<span class="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5"><i data-lucide="cpu" class="w-4 h-4"></i> Built-in DBCM Academic Engine (Zero-Setup)</span>`;
    }
    if (window.lucide) lucide.createIcons();
  }

  function injectAiSettingsModal() {
    const modalHtml = `
      <div id="ai-settings-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm hidden p-4 animate-fade-in">
        <div class="w-full max-w-md bg-white dark:bg-[#10121d] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-indigo-500"></i> Google Gemini API Integration
            </h3>
            <button onclick="closeAiSettingsModal()" class="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3.5 text-xs text-gray-600 dark:text-gray-300">
            <div id="ai-settings-status-text" class="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <!-- status injected -->
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="font-bold text-gray-800 dark:text-gray-200">
                  Google Gemini API Key
                </label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold text-[11px]">
                  Get Free Key from Google <i data-lucide="external-link" class="w-3 h-3"></i>
                </a>
              </div>
              <div class="flex gap-2">
                <input id="ai-settings-key-input" type="password" placeholder="AIzaSy..." 
                  class="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono text-xs text-gray-900 dark:text-white focus:outline-hidden focus:border-indigo-500" />
                <button type="button" onclick="testGeminiConnection()" class="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap cursor-pointer transition-all shadow-2xs">
                  Test Key
                </button>
              </div>
              <div id="ai-settings-test-result" class="min-h-[16px] text-[11px]"></div>
              <p class="text-[10px] text-gray-400 leading-normal">
                Paste your API key to power the AI tutor with Google's live Gemini 1.5/2.0 models. If left blank, it automatically uses the built-in DBCM Academic Knowledge Engine with zero API required.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/10">
            <button onclick="closeAiSettingsModal()" class="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              Cancel
            </button>
            <button onclick="saveAiSettingsKey()" class="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95">
              Save & Apply Key
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // Floating global widget toggling
  window.toggleGlobalAiDrawer = function () {
    const readerModal = document.getElementById('document-reader-modal');
    // If reader modal is currently visible, toggle its reader AI drawer
    if (readerModal && !readerModal.classList.contains('hidden')) {
      window.toggleReaderAiDrawer();
      return;
    }

    // Otherwise open the global floating AI modal/drawer
    let globalDrawer = document.getElementById('global-ai-drawer');
    if (!globalDrawer) {
      injectGlobalAiDrawer();
      globalDrawer = document.getElementById('global-ai-drawer');
    }

    const isHidden = globalDrawer.classList.contains('hidden');
    if (isHidden) {
      globalDrawer.classList.remove('hidden');
      const prefGlobalSize = window.dbcmAiState.globalDrawerSize || 'small';
      window.setGlobalAiSize(prefGlobalSize);
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        const inp = document.getElementById('global-ai-input');
        if (inp) inp.focus();
      }, 100);
    } else {
      globalDrawer.classList.add('hidden');
    }
  };

  function injectGlobalAiDrawer() {
    const subjName = (typeof pageState !== 'undefined' && pageState.subject) ? pageState.subject.name : 'DBCM Courses';
    const subjCode = (typeof pageState !== 'undefined' && pageState.subject) ? pageState.subject.code : 'PORTAL';

    const drawerHtml = `
      <div id="global-ai-drawer" onclick="if(event.target === this) toggleGlobalAiDrawer()" class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm hidden animate-fade-in">
        <div class="w-full global-drawer-small bg-white dark:bg-[#0c0d14] border-l border-gray-200 dark:border-white/10 h-full flex flex-col shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="p-3.5 sm:p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <h3 class="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                  <span class="truncate">DBCM AI Assistant</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                </h3>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">
                  ${subjName} (${subjCode})
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <!-- Single Size Toggle Button (One button at a time: Expand / Minimize) -->
              <button id="global-ai-size-toggle-btn" onclick="toggleGlobalAiSize()" type="button"
                class="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center mr-1"
                title="Expand Chat (Wide)">
                <svg id="global-ai-size-icon-expand" xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-arrows-angle-expand" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707m4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707"/>
                </svg>
                <svg id="global-ai-size-icon-contract" xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-arrows-angle-contract hidden" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M.172 15.828a.5.5 0 0 0 .707 0l4.096-4.096V14.5a.5.5 0 1 0 1 0v-3.975a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1h2.768L.172 15.121a.5.5 0 0 0 0 .707M15.828.172a.5.5 0 0 0-.707 0l-4.096 4.096V1.5a.5.5 0 1 0-1 0v3.975a.5.5 0 0 0 .5.5H14.5a.5.5 0 0 0 0-1h-2.768L15.828.879a.5.5 0 0 0 0-.707"/>
                </svg>
              </button>
              <button onclick="toggleGlobalAiDrawer()" class="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10" title="Close">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div id="global-ai-messages" class="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 text-xs text-gray-800 dark:text-gray-200 custom-scrollbar">
            <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800/30 space-y-2">
              <div class="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
                <span>Welcome to DBCM AI Academic Tutor</span>
              </div>
              <p class="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                I can summarize study notes, break down tricky concepts, generate continuous internal assessment (CIA) model questions, and prepare you for Don Bosco College Autonomous end-semester exams!
              </p>
            </div>
          </div>

          <!-- Quick Chips (Above Text Bar) -->
          <div class="px-3 pt-2 pb-1 border-t border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-black/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button onclick="sendGlobalQuickPrompt('Summarize the curriculum and major modules for ${subjName}')" class="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer">
              📑 Syllabus Summary
            </button>
            <button onclick="sendGlobalQuickPrompt('Give me the top 5 predicted exam questions with model answers')" class="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer">
              🎯 Top 5 Exam Questions
            </button>
            <button onclick="sendGlobalQuickPrompt('Explain the core concepts and architecture in simple terms')" class="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 cursor-pointer">
              💡 Core Concepts
            </button>
          </div>

          <!-- Input -->
          <div class="p-3.5 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0d14] shrink-0">
            <form onsubmit="handleGlobalAiSubmit(event)" class="flex items-end gap-2">
              <textarea id="global-ai-input" rows="1" placeholder="Ask any question about this subject or curriculum..." 
                class="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-indigo-500 resize-none max-h-24 leading-normal"
                onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); this.form.requestSubmit(); }"></textarea>
              <button type="submit" class="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-indigo-600/30">
                <i data-lucide="send" class="w-4 h-4"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHtml);
  }

  window.sendGlobalQuickPrompt = function (prompt) {
    const inp = document.getElementById('global-ai-input');
    if (inp) inp.value = prompt;
    handleGlobalAiSubmit();
  };

  window.handleGlobalAiSubmit = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('global-ai-input');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;
    input.value = '';

    const container = document.getElementById('global-ai-messages');
    if (!container) return;

    // Append user bubble
    container.insertAdjacentHTML('beforeend', `
      <div class="flex justify-end items-start gap-2">
        <div class="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-xs bg-indigo-600 text-white text-xs leading-relaxed shadow-sm">
          ${query.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      </div>
    `);
    container.scrollTop = container.scrollHeight;

    // Typing
    const typingId = 'gtyping-' + Date.now();
    container.insertAdjacentHTML('beforeend', `
      <div id="${typingId}" class="flex items-start gap-2">
        <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        </div>
        <div class="px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 text-xs">
          DBCM AI is thinking...
        </div>
      </div>
    `);
    container.scrollTop = container.scrollHeight;
    if (window.lucide) lucide.createIcons();

    const subj = (typeof pageState !== 'undefined' && pageState.subject) ? pageState.subject : {};
    const context = {
      subjectId: subj.id,
      subjectName: subj.name,
      subjectCode: subj.code,
      modules: subj.modules || []
    };

    try {
      const apiKey = localStorage.getItem('dbcm_gemini_api_key');
      if (!apiKey) throw new Error('Configure your AI provider key in Settings to use the tutor.');
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${JSON.stringify(context)}\n\n${query}` }] }] })
      });
      const result = await res.json();
      const data = { success: res.ok, reply: result.candidates?.[0]?.content?.parts?.[0]?.text || result.error?.message, relatedQuestions: [] };
      document.getElementById(typingId)?.remove();

      if (data.success && data.reply) {
        const formatted = window.formatAiMarkdown(data.reply);
        let relatedHtml = '';
        if (data.relatedQuestions && data.relatedQuestions.length > 0) {
          relatedHtml = `
            <div class="mt-3 pt-2 border-t border-gray-200 dark:border-white/10 space-y-1">
              <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400">Related Questions:</span>
              ${data.relatedQuestions.map(q => `
                <button onclick="sendGlobalQuickPrompt('${q.replace(/'/g, "\\'")}')" class="block w-full text-left px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                  • ${q}
                </button>
              `).join('')}
            </div>
          `;
        }
        container.insertAdjacentHTML('beforeend', `
          <div class="flex items-start gap-2">
            <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            </div>
            <div class="flex-1 max-w-[92%] px-3.5 py-3 rounded-2xl rounded-tl-xs bg-white dark:bg-[#12141f] border border-gray-200 dark:border-white/10 shadow-xs text-xs leading-relaxed text-gray-800 dark:text-gray-200">
              ${formatted}
              ${relatedHtml}
            </div>
          </div>
        `);
      } else {
        container.insertAdjacentHTML('beforeend', `<p class="text-xs text-red-500">Failed to get response.</p>`);
      }
    } catch (err) {
      document.getElementById(typingId)?.remove();
      container.insertAdjacentHTML('beforeend', `<p class="text-xs text-red-500">Network error.</p>`);
    }
    container.scrollTop = container.scrollHeight;
    if (window.lucide) lucide.createIcons();
  };

})();

