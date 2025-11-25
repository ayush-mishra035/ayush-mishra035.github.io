const path = require('path');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const COHERE_API_KEY = process.env.COHERE_API_KEY || '';
const WOLFRAM_APP_ID = process.env.WOLFRAM_APP_ID || '';

const quickPrompts = [
  'Explain Newton\'s laws with real-life examples',
  'Summarize the water cycle for middle schoolers',
  'Help me debug a JavaScript array loop',
  'Create a study plan for world history exams',
  'Teach me binary search in plain English'
];

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    providers: {
      gemini: Boolean(GEMINI_API_KEY),
      groq: Boolean(GROQ_API_KEY),
      cohere: Boolean(COHERE_API_KEY),
      huggingface: Boolean(HUGGINGFACE_API_KEY),
      wikipedia: true,
      openai: Boolean(OPENAI_API_KEY),
      anthropic: Boolean(ANTHROPIC_API_KEY),
      wolfram: Boolean(WOLFRAM_APP_ID)
    },
    freeTier: ['gemini', 'groq', 'cohere', 'huggingface', 'wikipedia']
  });
});

app.get('/api/prompts', (_req, res) => {
  res.json({ prompts: quickPrompts });
});

app.post('/api/chat', async (req, res) => {
  const { question, model, history = [] } = req.body || {};

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const validModels = ['gemini', 'groq', 'cohere', 'huggingface', 'wikipedia', 'chatgpt', 'claude'];
  if (!model || !validModels.includes(model)) {
    return res.status(400).json({ error: 'Invalid or missing model.' });
  }

  try {
    // FREE TIER MODELS (Priority)
    if (model === 'gemini' && GEMINI_API_KEY) {
      const answer = await callGemini(question, history);
      return res.json({ answer, mode: 'live', provider: 'gemini', cost: 'FREE' });
    }

    if (model === 'groq' && GROQ_API_KEY) {
      const answer = await callGroq(question, history);
      return res.json({ answer, mode: 'live', provider: 'groq', cost: 'FREE' });
    }

    if (model === 'cohere' && COHERE_API_KEY) {
      const answer = await callCohere(question, history);
      return res.json({ answer, mode: 'live', provider: 'cohere', cost: 'FREE' });
    }

    if (model === 'huggingface' && HUGGINGFACE_API_KEY) {
      const answer = await callHuggingFace(question, history);
      return res.json({ answer, mode: 'live', provider: 'huggingface', cost: 'FREE' });
    }

    if (model === 'wikipedia') {
      const wikiAnswer = await searchWikipedia(question);
      if (wikiAnswer) {
        return res.json({ answer: wikiAnswer, mode: 'live', provider: 'wikipedia', cost: 'FREE' });
      }
    }

    // PAID MODELS (fallback)
    if (model === 'chatgpt' && OPENAI_API_KEY) {
      const answer = await callChatGPT(question, history);
      return res.json({ answer, mode: 'live', provider: 'chatgpt', cost: 'PAID' });
    }

    if (model === 'claude' && ANTHROPIC_API_KEY) {
      const answer = await callClaude(question, history);
      return res.json({ answer, mode: 'live', provider: 'claude', cost: 'PAID' });
    }

    // Auto Wikipedia for factual queries
    if (question.toLowerCase().includes('what is') || question.toLowerCase().includes('who is')) {
      try {
        const wikiAnswer = await searchWikipedia(question);
        if (wikiAnswer) {
          return res.json({ answer: wikiAnswer, mode: 'wikipedia', provider: 'wikipedia', cost: 'FREE' });
        }
      } catch (err) {
        console.log('Wikipedia search failed, falling back');
      }
    }

    const answer = await getMockResponse(question, model);
    return res.json({ answer, mode: 'mock', provider: model });
  } catch (error) {
    console.error('AI proxy error:', error.message);
    return res.status(500).json({ error: 'AI proxy failed. ' + error.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EduBot server listening on http://localhost:${PORT}`);
});

function mapHistoryToMessages(history = []) {
  const messages = history
    .filter(item => item && item.role && item.content)
    .map(item => ({ role: item.role, content: item.content }));

  if (!messages.length) {
    messages.push({
      role: 'system',
      content: 'You are EduBot, a friendly educational tutor. Explain topics in simple, structured language.'
    });
  }

  const hasSystem = messages.some(msg => msg.role === 'system');
  if (!hasSystem) {
    messages.unshift({
      role: 'system',
      content: 'You are EduBot, a friendly educational tutor. Explain topics in simple, structured language.'
    });
  }

  return messages;
}

async function callChatGPT(question, history) {
  const messages = mapHistoryToMessages(history);
  messages.push({ role: 'user', content: question });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 600,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ChatGPT API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No answer returned.';
}

async function callGemini(question, history) {
  const context = mapHistoryToMessages(history)
    .filter(msg => msg.role !== 'system')
    .map(msg => `(${msg.role}) ${msg.content}`)
    .join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${context ? context + '\n\n' : ''}${question}`
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No answer returned.';
}

async function callClaude(question, history) {
  const messages = history
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(({ role, content }) => ({ role, content }));

  messages.push({ role: 'user', content: question });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: 'You are EduBot, a helpful educational AI tutor. Provide clear, structured explanations suitable for students.',
      messages
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || 'No answer returned.';
}

// FREE: Groq (Ultra-fast inference, 100% free tier)
async function callGroq(question, history) {
  const messages = mapHistoryToMessages(history);
  messages.push({ role: 'user', content: question });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 800,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No answer returned.';
}

// FREE: Cohere (Free trial + generous free tier)
async function callCohere(question, history) {
  const chatHistory = history
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(({ role, content }) => ({
      role: role === 'assistant' ? 'CHATBOT' : 'USER',
      message: content
    }));

  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COHERE_API_KEY}`
    },
    body: JSON.stringify({
      message: question,
      chat_history: chatHistory,
      model: 'command-r-lite',
      preamble: 'You are EduBot, a friendly educational AI assistant. Explain concepts clearly for students.'
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cohere API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.text?.trim() || 'No answer returned.';
}

// FREE: Hugging Face Inference API
async function callHuggingFace(question, history) {
  const context = history
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const prompt = context ? `${context}\nuser: ${question}\nassistant:` : `user: ${question}\nassistant:`;

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HuggingFace API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data[0]?.generated_text?.trim() || 'No answer returned.';
}

async function searchWikipedia(question) {
  const searchTerm = question
    .replace(/what is |who is |explain |tell me about /gi, '')
    .trim();

  const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
  
  const response = await fetch(searchUrl);
  
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  
  if (data.extract) {
    return `${data.extract}\n\nSource: Wikipedia`;
  }
  
  return null;
}

async function getMockResponse(question, model) {
  const lower = question.toLowerCase();
  
  // Massive knowledge base with intelligent pattern matching
  const knowledgeBase = [
    // Greetings
    {
      match: ['hi', 'hello', 'hey'],
      answer: 'Hi! I\'m EduBot, your AI educational assistant. I can help with math, science, programming, history, and more. What would you like to learn?'
    },
    
    // MATH TOPICS
    {
      match: ['quadratic', 'x²', 'x^2', 'parabola'],
      answer: 'Quadratic Equation: ax² + bx + c = 0\n\nSolution using quadratic formula:\nx = (-b ± √(b² - 4ac)) / 2a\n\nSteps:\n1. Identify a, b, c values\n2. Calculate discriminant: b² - 4ac\n3. If positive: 2 real solutions\n4. If zero: 1 real solution\n5. If negative: no real solutions\n\nExample: x² - 5x + 6 = 0\na=1, b=-5, c=6\nx = (5 ± √(25-24)) / 2 = (5 ± 1) / 2\nx = 3 or x = 2'
    },
    {
      match: ['pythagorean', 'triangle', 'right triangle', 'a²+b²'],
      answer: 'Pythagorean Theorem: a² + b² = c²\n\nFor right triangles:\n• a, b = legs (shorter sides)\n• c = hypotenuse (longest side)\n\nExample: If a=3 and b=4\nc² = 3² + 4² = 9 + 16 = 25\nc = √25 = 5\n\nCommon Pythagorean triples:\n3-4-5, 5-12-13, 8-15-17, 7-24-25'
    },
    {
      match: ['derivative', 'dy/dx', 'differentiation', 'rate of change'],
      answer: 'Derivatives measure rate of change (slope at a point).\n\nBasic Rules:\n• Power Rule: d/dx(xⁿ) = nxⁿ⁻¹\n• Constant: d/dx(c) = 0\n• Sum: d/dx(f+g) = f\' + g\'\n• Product: d/dx(fg) = f\'g + fg\'\n• Chain Rule: d/dx(f(g(x))) = f\'(g(x)) · g\'(x)\n\nExample: d/dx(3x² + 5x - 2)\n= 6x + 5'
    },
    {
      match: ['integral', '∫', 'integration', 'antiderivative'],
      answer: 'Integration finds area under curves.\n\nBasic Rules:\n• ∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n• ∫k dx = kx + C\n• ∫eˣ dx = eˣ + C\n• ∫(1/x) dx = ln|x| + C\n\nDefinite integral (area from a to b):\n∫[a→b] f(x)dx = F(b) - F(a)\n\nExample: ∫3x² dx = x³ + C'
    },
    {
      match: ['probability', 'chance', 'odds', 'random'],
      answer: 'Probability = (Favorable outcomes) / (Total outcomes)\n\nKey concepts:\n• Range: 0 to 1 (or 0% to 100%)\n• P(A or B) = P(A) + P(B) - P(A and B)\n• P(A and B) = P(A) × P(B) [if independent]\n\nExample: Probability of rolling a 6:\nP = 1/6 ≈ 0.167 or 16.7%\n\nCoin flip twice, both heads:\nP = 1/2 × 1/2 = 1/4 = 25%'
    },
    {
      match: ['fraction', 'numerator', 'denominator', 'divide'],
      answer: 'Fractions: numerator/denominator\n\nOperations:\n• Add/Subtract: Get common denominator\n  1/3 + 1/4 = 4/12 + 3/12 = 7/12\n\n• Multiply: Multiply across\n  2/3 × 3/4 = 6/12 = 1/2\n\n• Divide: Flip and multiply\n  2/3 ÷ 3/4 = 2/3 × 4/3 = 8/9\n\nSimplify by dividing by GCD!'
    },
    {
      match: ['percentage', 'percent', '%'],
      answer: 'Percentage = (Part/Whole) × 100\n\nCommon calculations:\n• Find %: (20/50) × 100 = 40%\n• Find part: 30% of 200 = 0.30 × 200 = 60\n• Increase: 100 + 20% = 100 × 1.20 = 120\n• Decrease: 100 - 20% = 100 × 0.80 = 80\n\nTip: 50% = half, 25% = quarter, 10% = move decimal left once'
    },
    
    // SCIENCE TOPICS
    {
      match: ['photosynthesis', 'plant energy', 'chlorophyll'],
      answer: 'Photosynthesis: Plants make food using sunlight!\n\nEquation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nProcess:\n1. Light Reaction (in thylakoids):\n   - Chlorophyll absorbs light\n   - Water splits (H₂O → H⁺ + O₂)\n   - Makes ATP & NADPH\n\n2. Dark Reaction (Calvin Cycle):\n   - Uses ATP & NADPH\n   - Converts CO₂ → glucose\n\nWhere: Chloroplasts (green organelles)\nWhy important: Makes oxygen & food for all life!'
    },
    {
      match: ['mitosis', 'cell division', 'cell cycle'],
      answer: 'Mitosis: How cells divide into 2 identical cells\n\nPhases (PMAT):\n1. Prophase: Chromosomes condense, nuclear membrane dissolves\n2. Metaphase: Chromosomes align at cell center\n3. Anaphase: Sister chromatids separate to opposite poles\n4. Telophase: Nuclear membranes reform, cell pinches\n5. Cytokinesis: Cell splits into 2 daughter cells\n\nResult: 2 identical diploid cells\nPurpose: Growth, repair, asexual reproduction'
    },
    {
      match: ['dna', 'genetic', 'nucleotide', 'double helix'],
      answer: 'DNA (Deoxyribonucleic Acid): Blueprint of life!\n\nStructure:\n• Double helix (twisted ladder)\n• Made of nucleotides: Sugar + Phosphate + Base\n• 4 bases: A (Adenine), T (Thymine), G (Guanine), C (Cytosine)\n• Base pairing: A-T, G-C\n\nFunction:\n• Stores genetic information\n• Genes → proteins → traits\n• DNA → RNA → Protein (Central Dogma)\n\nLocation: Nucleus (eukaryotes), cytoplasm (prokaryotes)'
    },
    {
      match: ['newton', 'motion', 'force', 'f=ma'],
      answer: 'Newton\'s Laws of Motion:\n\n1st Law (Inertia):\nObject at rest stays at rest; moving object stays moving unless force acts on it.\nExample: Seatbelt stops you when car brakes suddenly\n\n2nd Law (F=ma):\nForce = Mass × Acceleration\nExample: F=2kg × 3m/s² = 6N\nHeavier objects need more force to accelerate\n\n3rd Law (Action-Reaction):\nEvery action has equal & opposite reaction\nExample: Rocket pushes gas down, gas pushes rocket up'
    },
    {
      match: ['atom', 'proton', 'neutron', 'electron', 'atomic'],
      answer: 'Atom: Basic unit of matter\n\nParts:\n• Nucleus (center):\n  - Protons (+1 charge, mass ≈ 1 amu)\n  - Neutrons (0 charge, mass ≈ 1 amu)\n• Electron cloud:\n  - Electrons (-1 charge, tiny mass)\n\nKey numbers:\n• Atomic number = # of protons\n• Mass number = protons + neutrons\n• Neutral atom: # protons = # electrons\n\nExample: Carbon-12\n6 protons, 6 neutrons, 6 electrons'
    },
    {
      match: ['periodic table', 'element', 'group', 'period'],
      answer: 'Periodic Table: Organized chart of elements\n\nStructure:\n• Rows = Periods (1-7)\n• Columns = Groups (1-18)\n• Elements arranged by atomic number\n\nKey groups:\n• Group 1: Alkali metals (reactive)\n• Group 2: Alkaline earth metals\n• Groups 3-12: Transition metals\n• Group 17: Halogens (very reactive)\n• Group 18: Noble gases (unreactive)\n\nTrends:\n→ Across: increasing electronegativity\n↓ Down: increasing atomic size'
    },
    {
      match: ['chemical reaction', 'reactant', 'product', 'balance'],
      answer: 'Chemical Reactions: Substances change into new substances\n\nGeneral form: Reactants → Products\n\nTypes:\n1. Synthesis: A + B → AB\n2. Decomposition: AB → A + B\n3. Single replacement: A + BC → AC + B\n4. Double replacement: AB + CD → AD + CB\n5. Combustion: Fuel + O₂ → CO₂ + H₂O\n\nBalancing:\n1. Count atoms on each side\n2. Add coefficients (never change subscripts!)\n3. Check: atoms balanced?\n\nExample: 2H₂ + O₂ → 2H₂O'
    },
    {
      match: ['water cycle', 'evaporation', 'condensation', 'precipitation'],
      answer: 'Water Cycle: How water moves on Earth\n\nSteps:\n1. Evaporation: Sun heats water → water vapor rises\n2. Transpiration: Plants release water vapor\n3. Condensation: Water vapor cools → forms clouds\n4. Precipitation: Rain, snow, sleet, hail fall\n5. Collection: Water gathers in oceans, lakes, rivers\n6. Infiltration: Water soaks into ground\n\nDriving force: Sun\'s energy\nResult: Fresh water constantly recycled!'
    },
    {
      match: ['ecosystem', 'food chain', 'food web', 'producer', 'consumer'],
      answer: 'Ecosystem: Living & non-living things interacting\n\nFood Chain levels:\n1. Producers (plants): Make food via photosynthesis\n2. Primary consumers (herbivores): Eat plants\n3. Secondary consumers (carnivores): Eat herbivores\n4. Tertiary consumers: Top predators\n5. Decomposers: Break down dead matter\n\nEnergy flow:\nSun → Plants → Herbivores → Carnivores\n(Only ~10% energy transfers each level)\n\nExample: Grass → Rabbit → Fox → Decomposers'
    },
    
    // PROGRAMMING
    {
      match: ['python', 'print', 'def', '.py'],
      answer: 'Python: Beginner-friendly programming language\n\nBasics:\n```python\n# Variables\nname = "John"\nage = 25\n\n# Print\nprint("Hello", name)\n\n# If statement\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")\n\n# Loop\nfor i in range(5):\n    print(i)  # 0,1,2,3,4\n\n# Function\ndef greet(name):\n    return f"Hello {name}"\n```\n\nFeatures: Easy syntax, huge libraries, great for AI/data science'
    },
    {
      match: ['javascript', 'console.log', 'function', 'const', 'let', 'var'],
      answer: 'JavaScript: Language of the web\n\nBasics:\n```javascript\n// Variables\nconst name = "John";  // can\'t change\nlet age = 25;         // can change\n\n// Function\nfunction greet(name) {\n    return `Hello ${name}`;\n}\n\n// Arrow function\nconst add = (a, b) => a + b;\n\n// Loop\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}\n\n// Array methods\nconst nums = [1,2,3,4,5];\nnums.map(x => x * 2);  // [2,4,6,8,10]\n```\n\nUse: Frontend (React), Backend (Node.js), Mobile (React Native)'
    },
    {
      match: ['loop', 'for loop', 'while', 'iteration'],
      answer: 'Loops: Repeat code multiple times\n\nTypes:\n\n1. For loop (known iterations):\n```python\nfor i in range(5):  # 0 to 4\n    print(i)\n```\n\n2. While loop (condition-based):\n```python\ni = 0\nwhile i < 5:\n    print(i)\n    i += 1\n```\n\n3. For-each (iterate collections):\n```python\nfor item in [1,2,3]:\n    print(item)\n```\n\nTip: Use break to exit early, continue to skip iteration'
    },
    {
      match: ['array', 'list', 'index', '[]'],
      answer: 'Arrays/Lists: Store multiple values\n\nPython:\n```python\nfruits = ["apple", "banana", "cherry"]\n\n# Access by index (starts at 0)\nprint(fruits[0])  # "apple"\nprint(fruits[-1]) # last item\n\n# Add/remove\nfruits.append("orange")  # add to end\nfruits.remove("banana")  # remove item\n\n# Loop through\nfor fruit in fruits:\n    print(fruit)\n\n# Slice\nfruits[1:3]  # items 1 to 2\n```\n\nCommon operations: sort(), reverse(), len(), in'
    },
    {
      match: ['function', 'def', 'return', 'parameter'],
      answer: 'Functions: Reusable blocks of code\n\nPython:\n```python\n# Define function\ndef add(a, b):\n    return a + b\n\n# Call function\nresult = add(5, 3)  # 8\n\n# Default parameters\ndef greet(name="Guest"):\n    return f"Hello {name}"\n\ngreet()        # "Hello Guest"\ngreet("John")  # "Hello John"\n```\n\nBenefits:\n✓ Reusable code\n✓ Organized & readable\n✓ Easier to debug\n✓ Can test separately'
    },
    {
      match: ['if else', 'condition', 'boolean', 'true false'],
      answer: 'Conditional Statements: Make decisions in code\n\n```python\nage = 18\n\n# If-else\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")\n\n# If-elif-else\nscore = 85\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelse:\n    grade = "F"\n\n# Multiple conditions\nif age >= 18 and has_license:\n    print("Can drive")\n```\n\nComparison: ==, !=, <, >, <=, >=\nLogical: and, or, not'
    },
    {
      match: ['class', 'object', 'oop', 'object oriented'],
      answer: 'Object-Oriented Programming (OOP)\n\n```python\n# Define class\nclass Car:\n    def __init__(self, brand, model):\n        self.brand = brand\n        self.model = model\n        self.speed = 0\n    \n    def accelerate(self):\n        self.speed += 10\n    \n    def brake(self):\n        self.speed -= 10\n\n# Create object\nmy_car = Car("Toyota", "Camry")\nmy_car.accelerate()\nprint(my_car.speed)  # 10\n```\n\nKey concepts:\n• Class: Blueprint\n• Object: Instance\n• Method: Function in class\n• Attribute: Variable in class'
    },
    {
      match: ['algorithm', 'binary search', 'linear search'],
      answer: 'Search Algorithms:\n\n1. Linear Search (simple, slow):\n```python\ndef linear_search(arr, target):\n    for i, val in enumerate(arr):\n        if val == target:\n            return i\n    return -1\n```\nTime: O(n) - checks each item\n\n2. Binary Search (fast, needs sorted array):\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr)-1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n```\nTime: O(log n) - halves search space each step'
    },
    
    // HISTORY
    {
      match: ['world war', 'ww1', 'ww2', 'world war 1', 'world war 2'],
      answer: 'World Wars:\n\nWWI (1914-1918):\n• Causes: Nationalism, alliances, militarism, assassination of Archduke Franz Ferdinand\n• Sides: Allies (Britain, France, Russia, US) vs Central Powers (Germany, Austria-Hungary, Ottoman Empire)\n• Result: ~20M deaths, Treaty of Versailles, League of Nations\n\nWWII (1939-1945):\n• Causes: Treaty of Versailles, Great Depression, rise of fascism (Hitler, Mussolini)\n• Sides: Allies (US, UK, USSR, France) vs Axis (Germany, Japan, Italy)\n• Major events: Holocaust, Pearl Harbor, D-Day, atomic bombs\n• Result: ~70M deaths, UN formed, Cold War begins'
    },
    {
      match: ['american revolution', 'independence', '1776', 'colonial'],
      answer: 'American Revolution (1775-1783)\n\nCauses:\n• British taxation without representation\n• Stamp Act, Tea Act, Intolerable Acts\n• Boston Massacre & Boston Tea Party\n\nKey Events:\n• 1775: Battles of Lexington & Concord\n• 1776: Declaration of Independence (July 4)\n• 1777: Battle of Saratoga (turning point)\n• 1781: British surrender at Yorktown\n• 1783: Treaty of Paris\n\nResult: United States gains independence from Britain\n\nFounding Fathers: Washington, Jefferson, Franklin, Adams'
    },
    {
      match: ['french revolution', '1789', 'bastille', 'napoleon'],
      answer: 'French Revolution (1789-1799)\n\nCauses:\n• Economic crisis, unfair taxation\n• Social inequality (3 estates)\n• Enlightenment ideas\n• Weak King Louis XVI\n\nKey Events:\n• 1789: Storming of Bastille (July 14)\n• Declaration of Rights of Man\n• Reign of Terror (Robespierre)\n• Rise of Napoleon Bonaparte\n\nResult:\n• End of monarchy\n• Rise of republicanism\n• Napoleonic Era\n• Influenced revolutions worldwide'
    },
    {
      match: ['industrial revolution', 'factory', 'steam engine'],
      answer: 'Industrial Revolution (1760-1840)\n\nKey Inventions:\n• Steam engine (James Watt)\n• Spinning jenny (textile production)\n• Power loom\n• Railways & steamships\n\nChanges:\n• Agriculture → Manufacturing\n• Rural → Urban (cities grow)\n• Handmade → Machine-made\n• Cottage industries → Factories\n\nEffects:\n✓ Increased production & wealth\n✓ Better transportation\n✗ Poor working conditions\n✗ Child labor\n✗ Pollution\n\nStarted in Britain, spread worldwide'
    },
    {
      match: ['civil war', 'lincoln', 'slavery', 'confederate'],
      answer: 'American Civil War (1861-1865)\n\nCauses:\n• Slavery debate\n• States\' rights vs federal power\n• Economic differences (North industrial, South agricultural)\n• Election of Abraham Lincoln\n\nSides:\n• Union (North): 23 states, wanted to end slavery\n• Confederacy (South): 11 states, wanted to keep slavery\n\nKey Events:\n• 1861: Fort Sumter (war begins)\n• 1863: Emancipation Proclamation, Battle of Gettysburg\n• 1865: Lee surrenders at Appomattox, Lincoln assassinated\n\nResult: Slavery abolished (13th Amendment), Union preserved\n\nCasualties: ~620,000 deaths'
    },
    
    // GRAMMAR & WRITING
    {
      match: ['noun', 'verb', 'adjective', 'adverb', 'parts of speech'],
      answer: 'Parts of Speech:\n\n1. Noun: Person, place, thing, idea\n   Example: dog, London, happiness\n\n2. Verb: Action or state of being\n   Example: run, think, is, are\n\n3. Adjective: Describes noun\n   Example: beautiful flower, tall building\n\n4. Adverb: Describes verb, adjective, or adverb\n   Example: quickly ran, very tall (often ends in -ly)\n\n5. Pronoun: Replaces noun\n   Example: he, she, it, they\n\n6. Preposition: Shows relationship\n   Example: in, on, at, under, between\n\n7. Conjunction: Connects words/phrases\n   Example: and, but, or, because\n\n8. Interjection: Expresses emotion\n   Example: Wow! Oh! Ouch!'
    },
    {
      match: ['essay', 'paragraph', 'introduction', 'thesis'],
      answer: 'Essay Structure:\n\n1. Introduction:\n   • Hook (grab attention)\n   • Background info\n   • Thesis statement (main argument)\n\n2. Body Paragraphs (usually 3):\n   • Topic sentence\n   • Evidence/examples\n   • Explanation\n   • Transition to next paragraph\n\n3. Conclusion:\n   • Restate thesis\n   • Summarize main points\n   • Final thought/call to action\n\nTips:\n✓ 1 idea per paragraph\n✓ Use transitions (however, therefore, moreover)\n✓ Cite sources\n✓ Proofread!'
    },
    {
      match: ['metaphor', 'simile', 'figurative language', 'literary device'],
      answer: 'Figurative Language:\n\n1. Simile: Comparison using "like" or "as"\n   Example: She\'s as brave as a lion\n\n2. Metaphor: Direct comparison\n   Example: Time is money\n\n3. Personification: Human traits to non-human\n   Example: The wind whispered\n\n4. Hyperbole: Exaggeration\n   Example: I\'m so hungry I could eat a horse\n\n5. Alliteration: Repeated consonant sounds\n   Example: Peter Piper picked...\n\n6. Onomatopoeia: Words that sound like meaning\n   Example: Buzz, crash, sizzle\n\n7. Idiom: Phrase with non-literal meaning\n   Example: It\'s raining cats and dogs'
    },
    
    // GENERAL QUESTIONS
    {
      match: ['how to study', 'study tips', 'exam prep', 'test preparation'],
      answer: 'Effective Study Tips:\n\n1. Active Recall:\n   • Test yourself without notes\n   • Use flashcards\n   • Teach concept to someone else\n\n2. Spaced Repetition:\n   • Review material over time\n   • Don\'t cram everything at once\n   • Use apps like Anki\n\n3. Pomodoro Technique:\n   • Study 25 min → Break 5 min\n   • After 4 cycles, take 15-30 min break\n\n4. Environment:\n   • Quiet, organized space\n   • Remove distractions (phone away!)\n   • Good lighting\n\n5. Practice Problems:\n   • Do past exams\n   • Solve extra problems\n   • Learn from mistakes\n\n6. Sleep & Health:\n   • 7-9 hours sleep\n   • Exercise regularly\n   • Stay hydrated'
    },
    {
      match: ['solar system', 'planet', 'mercury', 'venus', 'mars', 'jupiter'],
      answer: 'Solar System: Sun + 8 planets + other objects\n\nPlanets (in order from Sun):\n1. Mercury: Smallest, closest to Sun, no atmosphere\n2. Venus: Hottest, thick atmosphere, rotates backwards\n3. Earth: Only planet with life, 71% water\n4. Mars: Red planet, has water ice, 2 moons\n5. Jupiter: Largest, gas giant, Great Red Spot storm\n6. Saturn: Famous rings, gas giant\n7. Uranus: Ice giant, rotates on side\n8. Neptune: Farthest, windiest, deep blue\n\nMnemonic: My Very Educated Mother Just Served Us Nachos\n\nAlso includes: asteroids, comets, dwarf planets (Pluto)'
    },
    {
      match: ['shakespeare', 'romeo', 'hamlet', 'macbeth'],
      answer: 'William Shakespeare (1564-1616): Greatest English writer\n\nFamous Plays:\n• Tragedies: Hamlet, Macbeth, Romeo & Juliet, Othello\n• Comedies: A Midsummer Night\'s Dream, Much Ado About Nothing\n• Histories: Henry V, Richard III\n\nFamous Quotes:\n• "To be or not to be" - Hamlet\n• "Romeo, Romeo, wherefore art thou Romeo?" - Romeo & Juliet\n• "All the world\'s a stage" - As You Like It\n\nInvented 1,700+ words: bedroom, lonely, eyeball, addiction\n\nThemes: Love, power, betrayal, fate, revenge\n\n154 sonnets, 37 plays total'
    }
  ];

  // Try exact matches first
  const found = knowledgeBase.find(entry =>
    entry.match.some(keyword => lower.includes(keyword))
  );

  if (found) {
    return found.answer;
  }

  // Smart fallback based on question type
  if (lower.match(/\b(what|explain|define|describe|tell me about)\b/)) {
    return `I'd love to explain that! I have detailed knowledge about:\n\n📐 Math: algebra, calculus, geometry, probability, fractions, percentages\n🔬 Science: physics (Newton's laws, gravity), chemistry (atoms, reactions), biology (cells, DNA, photosynthesis)\n💻 Programming: Python, JavaScript, loops, functions, arrays, algorithms\n📚 History: World Wars, revolutions, civilizations\n✍️ English: grammar, essays, literary devices\n\nTry asking: "Explain photosynthesis" or "How to solve quadratic equations" or "What is binary search algorithm"`;
  }

  if (lower.match(/\b(how to|how do|how can)\b/)) {
    return `I can show you how to do many things! Try these:\n\n• "How to solve quadratic equations"\n• "How to write a Python function"\n• "How to balance chemical equations"\n• "How to write an essay"\n• "How to study effectively"\n\nOr ask about specific topics in math, science, programming, or history!`;
  }

  if (lower.match(/\b(solve|calculate|compute|find)\b/)) {
    return `I can help solve problems! Try:\n\n• Math: "Solve x² - 5x + 6 = 0" or "Find derivative of 3x²"\n• Science: "Calculate force if mass is 5kg and acceleration is 2m/s²"\n• Programming: "How to find largest number in array"\n\nProvide the specific problem and I'll walk through the solution!`;
  }

  // Final fallback
  return `I'm EduBot, ready to help you learn! I excel at:\n\n📐 **Math**: Algebra, calculus, geometry, statistics\n🔬 **Science**: Physics, chemistry, biology\n💻 **Programming**: Python, JavaScript, algorithms\n📚 **History**: Major events, revolutions, civilizations\n✍️ **Writing**: Grammar, essays, literary analysis\n\n**Ask me something specific like:**\n• "Explain Newton's laws of motion"\n• "How to solve quadratic equations"\n• "What is photosynthesis"\n• "Write a Python loop"\n• "What caused World War 2"\n\nThe more specific your question, the better I can help!`;
}
