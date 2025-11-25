const elements = {
  searchInput: document.getElementById('searchInput'),
  modelSelect: document.getElementById('modelSelect'),
  askBtn: document.getElementById('askBtn'),
  chatBox: document.getElementById('chatBox'),
  connectionStatus: document.getElementById('connectionStatus'),
  statusMessage: document.getElementById('statusMessage'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  promptChips: document.getElementById('promptChips'),
  copyLatestBtn: document.getElementById('copyLatestBtn'),
  exportChatBtn: document.getElementById('exportChatBtn')
};

const STORAGE_KEY = 'edubot-history-v2';
const PROMPT_FALLBACK = [
  'Summarize Newton\'s three laws with examples',
  'Explain recursion to a beginner coder',
  'Create a 3-day revision plan for algebra',
  'How does photosynthesis keep ecosystems alive?',
  'Debug: why is my JavaScript loop freezing?'
];

const state = {
  history: [],
  apiOnline: false,
  pollingTimer: null,
  isStandalone: window.location.protocol === 'file:',
  isLoading: false
};

initialize();

function initialize() {
  bindEvents();
  hydrateHistory();
  renderChat();
  loadPrompts();
  startStatusPolling();
}

function bindEvents() {
  if (elements.askBtn) {
    elements.askBtn.addEventListener('click', handleAsk);
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        handleAsk();
      }
    });
  }

  if (elements.clearChatBtn) {
    elements.clearChatBtn.addEventListener('click', () => {
      resetChat();
      setStatus(state.apiOnline, state.apiOnline ? 'Live API connected' : 'Demo mode active (API unavailable)');
    });
  }

  if (elements.copyLatestBtn) {
    elements.copyLatestBtn.addEventListener('click', copyLatestAnswer);
  }

  if (elements.exportChatBtn) {
    elements.exportChatBtn.addEventListener('click', exportChatTranscript);
  }
}

function hydrateHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        state.history = parsed;
      }
    }
  } catch (error) {
    console.warn('Unable to load saved history', error);
  }

  if (!state.history.length) {
    state.history.push(createMessage('assistant', "Hi, I'm EduBot. Ask me anything and I'll explain it clearly."));
  }
}

function createMessage(role, content, options = {}) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    role,
    content,
    timestamp: options.timestamp || new Date().toISOString(),
    provider: options.provider || null,
    mode: options.mode || null
  };
}

function renderChat() {
  if (!elements.chatBox) return;
  elements.chatBox.innerHTML = '';
  state.history.forEach(message => {
    const node = renderMessage(message);
    elements.chatBox.appendChild(node);
  });
  elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
}

function renderMessage(message) {
  const wrapper = document.createElement('div');
  wrapper.className = `chat-message ${message.role === 'assistant' ? 'assistant' : message.role}`;
  wrapper.dataset.id = message.id;

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  const label = message.role === 'user' ? 'You' : 'EduBot';
  const providerLabel = message.provider ? ` · ${capitalize(message.provider)}` : '';
  meta.textContent = `${label} · ${formatTimestamp(message.timestamp)}${providerLabel}`;

  const body = document.createElement('div');
  body.className = 'message-body';
  body.textContent = message.content;

  wrapper.append(meta, body);

  if (message.role === 'assistant') {
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.type = 'button';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => copyToClipboard(message.content, copyBtn));
    actions.appendChild(copyBtn);
    wrapper.appendChild(actions);
  }

  return wrapper;
}

async function handleAsk() {
  if (state.isLoading) return;
  if (!elements.searchInput || !elements.modelSelect) return;

  const question = elements.searchInput.value.trim();
  if (!question) {
    elements.searchInput.classList.add('input-error');
    setTimeout(() => elements.searchInput.classList.remove('input-error'), 600);
    return;
  }

  // Scroll to chat section
  const chatSection = document.getElementById('chat');
  if (chatSection) {
    chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  state.isLoading = true;
  setInputState(true);

  const userMessage = createMessage('user', question);
  state.history.push(userMessage);
  persistHistory();
  renderChat();
  elements.searchInput.value = '';

  addTypingIndicator();

  try {
    const { answer, provider, mode } = await getAIResponse(question, elements.modelSelect.value);
    pushAssistantMessage(answer, provider, mode);
  } catch (error) {
    console.error(error);
    const fallback = await getMockResponse(question, elements.modelSelect.value);
    pushAssistantMessage(fallback, 'demo', 'mock');
  } finally {
    removeTypingIndicator();
    setInputState(false);
    state.isLoading = false;
  }
}

function pushAssistantMessage(content, provider, mode) {
  const botMessage = createMessage('assistant', content, { provider, mode });
  state.history.push(botMessage);
  persistHistory();
  renderChat();
}

async function getAIResponse(question, model) {
  if (state.isStandalone) {
    setStatus(false, 'Demo mode (open with npm run start for live APIs)');
    return { answer: await getMockResponse(question, model), provider: 'demo', mode: 'mock' };
  }

  try {
    const answer = await fetchBackendAnswer(question, model);
    if (!state.apiOnline) {
      setStatus(true, 'Live API connected');
    }
    state.apiOnline = true;
    return answer;
  } catch (error) {
    state.apiOnline = false;
    setStatus(false, 'Demo mode active (API unavailable)');
    throw error;
  }
}

async function fetchBackendAnswer(question, model) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      model,
      history: getApiHistory()
    })
  });

  if (!response.ok) {
    let errorMessage = response.statusText || 'Unknown server error';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch (error) {
      // ignore json parsing issues
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data.answer) {
    throw new Error('Server returned an empty answer.');
  }

  return { answer: data.answer, provider: data.provider, mode: data.mode };
}

function getApiHistory() {
  return state.history
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map(({ role, content }) => ({ role, content }));
}

async function getMockResponse(question, model) {
  const lower = question.toLowerCase();
  
  // Expanded knowledge base with more comprehensive responses
  const knowledgeBase = [
    {
      match: ['hi', 'hello', 'hey', 'who are you', 'what are you'],
      reply: 'Hi! I\'m EduBot, your AI educational assistant created by Team-Wave. I can help explain concepts in math, science, programming, history, and more. What would you like to learn today?'
    },
    {
      match: ['desert', 'sahara', 'gobi', 'arid'],
      reply: 'A desert is a barren landscape with little precipitation (less than 10 inches/year). Famous deserts include the Sahara (hot desert in Africa), Gobi (cold desert in Asia), and Mojave. Despite harsh conditions, deserts support unique ecosystems with adapted plants like cacti and animals like camels.'
    },
    {
      match: ['ocean', 'sea', 'marine', 'coral reef'],
      reply: 'Oceans cover 71% of Earth\'s surface and contain 97% of its water. They regulate climate, produce over half our oxygen via phytoplankton, and support incredible biodiversity. The five oceans are Pacific, Atlantic, Indian, Southern, and Arctic. Coral reefs are "rainforests of the sea" hosting 25% of marine species.'
    },
    {
      match: ['python', 'programming language', 'coding'],
      reply: 'Python is a high-level, interpreted programming language created by Guido van Rossum in 1991. Known for clean, readable syntax with significant whitespace. Used for web development (Django, Flask), data science (pandas, NumPy), AI/ML (TensorFlow, PyTorch), automation, and more. Great for beginners!'
    },
    {
      match: ['javascript', 'js', 'node', 'react'],
      reply: 'JavaScript is the language of the web, running in all browsers. Initially for client-side scripting, now also server-side via Node.js. Popular frameworks include React (UI), Vue, Angular. ES6+ features: arrow functions, async/await, destructuring. Essential for modern web development.'
    },
    {
      match: ['photosynthesis', 'plant', 'chlorophyll'],
      reply: 'Photosynthesis: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Plants use chlorophyll in chloroplasts to convert sunlight, water, and CO₂ into glucose (food) and oxygen. Two stages: light-dependent reactions (produce ATP/NADPH) and Calvin cycle (fix carbon into sugar). Foundation of most food chains!'
    },
    {
      match: ['gravity', 'newton', 'force', 'acceleration'],
      reply: 'Gravity is the fundamental force attracting all masses. Newton\'s Law: F = G(m₁m₂)/r². On Earth, acceleration is ~9.8 m/s². Einstein\'s general relativity describes gravity as spacetime curvature caused by mass-energy. Keeps planets orbiting, creates tides, and shapes the universe.'
    },
    {
      match: ['math', 'algebra', 'equation', 'solve'],
      reply: 'Mathematics is the study of patterns, quantities, and structures. Algebra uses variables (x, y) to solve equations. Tips: isolate the variable, perform same operations on both sides, check your answer. Example: 2x + 5 = 13 → 2x = 8 → x = 4. What specific problem are you working on?'
    },
    {
      match: ['calculus', 'derivative', 'integral', 'limit'],
      reply: 'Calculus studies continuous change. Derivatives measure instantaneous rate of change (slope of tangent), integrals measure accumulation (area under curve). Fundamental theorem connects them. Used in physics, engineering, economics. Basic rules: power rule, product rule, chain rule, integration by parts.'
    },
    {
      match: ['history', 'war', 'revolution', 'ancient'],
      reply: 'History examines past human events and civilizations. Key periods: Ancient (Egypt, Greece, Rome), Medieval (feudalism, crusades), Renaissance (cultural rebirth), Industrial Revolution (mechanization), Modern (world wars, globalization). Studying history helps us understand current events and avoid past mistakes.'
    },
    {
      match: ['chemistry', 'atom', 'molecule', 'element', 'periodic table'],
      reply: 'Chemistry studies matter and its transformations. Atoms (protons, neutrons, electrons) combine to form molecules. Periodic table organizes 118 elements by atomic number. Key concepts: chemical bonds (ionic, covalent), reactions, stoichiometry, acids/bases (pH scale), thermodynamics.'
    },
    {
      match: ['biology', 'cell', 'dna', 'gene', 'evolution'],
      reply: 'Biology is the study of life. Cells are life\'s basic units. DNA (double helix) stores genetic information; genes code for proteins. Evolution via natural selection explains biodiversity. Key topics: cell biology, genetics, ecology, anatomy, physiology, microbiology, taxonomy.'
    },
    {
      match: ['physics', 'energy', 'motion', 'wave'],
      reply: 'Physics studies matter, energy, and their interactions. Classical mechanics: Newton\'s laws, kinematics, dynamics. Energy forms: kinetic, potential, thermal. Waves: electromagnetic (light), mechanical (sound). Modern physics: relativity (E=mc²), quantum mechanics (uncertainty principle), particle physics.'
    },
    {
      match: ['debug', 'error', 'bug', 'fix code'],
      reply: 'Debugging strategies: 1) Read error messages carefully, 2) Use console.log/print statements, 3) Isolate the problem (divide & conquer), 4) Check syntax and logic, 5) Use debugger/breakpoints, 6) Google the error, 7) Explain code to a rubber duck. What error are you facing?'
    },
    {
      match: ['algorithm', 'sort', 'search', 'complexity'],
      reply: 'Algorithms are step-by-step procedures to solve problems. Common types: sorting (bubble, merge, quick), searching (linear, binary), graph traversal (BFS, DFS). Time complexity (Big O): O(1) constant, O(log n) logarithmic, O(n) linear, O(n²) quadratic. Space-time tradeoffs matter.'
    },
    {
      match: ['database', 'sql', 'nosql', 'mongodb'],
      reply: 'Databases store and organize data. SQL (relational): MySQL, PostgreSQL - use tables, rows, columns, ACID properties. NoSQL: MongoDB (documents), Redis (key-value), Cassandra (wide-column) - flexible schemas, horizontal scaling. Choose based on data structure and scalability needs.'
    },
    {
      match: ['web development', 'html', 'css', 'frontend'],
      reply: 'Web development: Frontend (user-facing) uses HTML (structure), CSS (styling), JavaScript (interactivity). Backend (server-side) handles databases, APIs, authentication. Frameworks: React/Vue/Angular (frontend), Express/Django/Rails (backend). Responsive design, accessibility, and performance are key.'
    },
    {
      match: ['ai', 'artificial intelligence', 'machine learning', 'neural network'],
      reply: 'AI enables machines to simulate human intelligence. Machine Learning: algorithms learn from data without explicit programming. Deep Learning uses neural networks (inspired by brain). Types: supervised (labeled data), unsupervised (patterns), reinforcement (rewards). Applications: image recognition, NLP, autonomous vehicles.'
    },
    {
      match: ['climate', 'global warming', 'environment', 'carbon'],
      reply: 'Climate change: rising global temperatures due to greenhouse gases (CO₂, methane) from fossil fuels, deforestation. Effects: melting ice caps, sea level rise, extreme weather, ecosystem disruption. Solutions: renewable energy, carbon capture, reforestation, sustainable practices, policy changes.'
    },
    {
      match: ['explain', 'what is', 'how does', 'why', 'define'],
      reply: 'I\'m here to explain any topic! I can help with:\n• Math & Science (formulas, concepts, problems)\n• Programming (languages, algorithms, debugging)\n• History & Social Studies\n• English & Writing\n• Test prep & homework\n\nBe specific about what you want to learn - include topic names or questions!'
    }
  ];

  // Check for matches
  const found = knowledgeBase.find(entry => 
    entry.match.some(keyword => lower.includes(keyword))
  );
  
  if (found) {
    return found.reply;
  }

  // Smart fallback based on question patterns
  if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || 
      lower.startsWith('why') || lower.startsWith('explain')) {
    return `That's a great question! While I can help with many topics, I don't have a specific answer prepared for "${question}".\n\nI'm best at explaining:\n• Math (algebra, calculus, geometry, statistics)\n• Science (physics, chemistry, biology, earth science)\n• Programming (Python, JavaScript, algorithms, data structures)\n• History, English, and general academics\n\nTry rephrasing your question or asking about a different topic!`;
  }

  // General helpful response
  return `I can help you understand educational topics across many subjects! Try asking:\n• "What is photosynthesis?"\n• "Explain Newton's laws"\n• "How do I debug JavaScript?"\n• "What is the derivative?"\n• "Explain the water cycle"\n\nWhat interests you?`;
}

function setInputState(disabled) {
  if (!elements.askBtn || !elements.searchInput || !elements.modelSelect) return;
  elements.askBtn.disabled = disabled;
  elements.searchInput.disabled = disabled;
  elements.modelSelect.disabled = disabled;
  elements.askBtn.textContent = disabled ? 'Thinking…' : 'Ask';
}

function setStatus(isOnline, message) {
  if (!elements.connectionStatus || !elements.statusMessage) return;
  elements.connectionStatus.classList.toggle('online', isOnline);
  elements.connectionStatus.classList.toggle('offline', !isOnline);
  elements.connectionStatus.textContent = isOnline ? 'Live API' : 'Demo Mode';
  elements.statusMessage.textContent = message;
}

async function checkApiHealth() {
  if (state.isStandalone) return;
  try {
    const response = await fetch('/health');
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    setStatus(true, 'Live API connected');
    state.apiOnline = true;
  } catch (error) {
    setStatus(false, 'Demo mode active (API unavailable)');
    state.apiOnline = false;
  }
}

function startStatusPolling() {
  if (state.isStandalone) {
    setStatus(false, 'Demo mode (launch server for live APIs).');
    return;
  }
  checkApiHealth();
  if (state.pollingTimer) {
    clearInterval(state.pollingTimer);
  }
  state.pollingTimer = setInterval(checkApiHealth, 12000);
}

function addTypingIndicator() {
  if (!elements.chatBox) return;
  removeTypingIndicator();
  const indicator = document.createElement('div');
  indicator.id = 'typingIndicator';
  indicator.className = 'chat-message loading';
  indicator.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  elements.chatBox.appendChild(indicator);
  elements.chatBox.scrollTop = elements.chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

function persistHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  } catch (error) {
    console.warn('Unable to save history', error);
  }
}

function resetChat() {
  state.history = [createMessage('assistant', "Hi, I'm EduBot. Ask me anything and I'll explain it clearly.")];
  persistHistory();
  renderChat();
}

function copyToClipboard(text, button) {
  const hasButton = button && typeof button.textContent !== 'undefined';
  if (!navigator.clipboard) {
    if (hasButton) {
      button.textContent = 'Copy unavailable';
      setTimeout(() => (button.textContent = 'Copy'), 1500);
    }
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => {
      if (hasButton) {
        button.textContent = 'Copied!';
        setTimeout(() => (button.textContent = 'Copy'), 1500);
      }
    })
    .catch(() => {
      if (hasButton) {
        button.textContent = 'Copy failed';
        setTimeout(() => (button.textContent = 'Copy'), 1500);
      }
    });
}

function copyLatestAnswer() {
  const latest = [...state.history].reverse().find(msg => msg.role === 'assistant');
  if (!latest) return;
  copyToClipboard(latest.content, elements.copyLatestBtn);
}

function exportChatTranscript() {
  if (!state.history.length) return;
  const lines = state.history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`);
  const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'edubot-chat.txt';
  link.click();
  URL.revokeObjectURL(url);
}

function loadPrompts() {
  if (!elements.promptChips) return;
  fetch('/api/prompts')
    .then(res => (res.ok ? res.json() : Promise.reject()))
    .then(data => {
      renderPromptChips(data.prompts || PROMPT_FALLBACK);
    })
    .catch(() => renderPromptChips(PROMPT_FALLBACK));
}

function renderPromptChips(prompts) {
  elements.promptChips.innerHTML = '';
  prompts.forEach(prompt => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      elements.searchInput.value = prompt;
      elements.searchInput.focus();
    });
    elements.promptChips.appendChild(button);
  });
}

function capitalize(value = '') {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTimestamp(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '';
  }
}