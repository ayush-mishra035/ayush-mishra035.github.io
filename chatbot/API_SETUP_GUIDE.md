# 🚀 EduBot API Setup Guide

This guide shows you how to get API keys for multiple AI providers to make your chatbot more powerful.

---

## ✅ Current APIs (Already Have Keys)

### 1. OpenAI ChatGPT ✓
- **Status**: Already configured in `.env`
- **Model**: GPT-3.5-turbo
- **Best for**: General questions, coding help, explanations

### 2. Google Gemini ✓  
- **Status**: Already configured in `.env`
- **Model**: Gemini Pro
- **Best for**: Multi-turn conversations, research

---

## 🆕 Additional Recommended APIs

### 3. **Anthropic Claude** (Highly Recommended for Education)

**Why Add It:**
- More accurate for academic content
- Better at explaining complex topics
- Excellent for math and science
- 200K context window (remembers more conversation)

**How to Get API Key:**
1. Go to https://console.anthropic.com/
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy key and add to `.env` file:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

**Pricing:**
- Claude Haiku: $0.25 per 1M input tokens (very cheap!)
- Free trial credits available

---

### 4. **Hugging Face** (Free Tier Available!)

**Why Add It:**
- Access to 100+ open-source AI models
- Free tier with rate limits
- Good for specialized tasks (translation, code generation)

**How to Get API Key:**
1. Go to https://huggingface.co/
2. Create free account
3. Go to Settings → Access Tokens
4. Create new token with "read" access
5. Add to `.env`:
   ```
   HUGGINGFACE_API_KEY=hf_your-key-here
   ```

**Models You Can Use:**
- `meta-llama/Llama-2-7b-chat-hf` (Free)
- `google/flan-t5-xxl` (Free)
- `bigscience/bloom` (Free)

---

### 5. **WolframAlpha** (For Math & Science)

**Why Add It:**
- Computational knowledge engine
- Step-by-step math solutions
- Scientific calculations
- Physics formulas and answers

**How to Get API Key:**
1. Go to https://products.wolframalpha.com/api/
2. Sign up for free account
3. Get "Simple API" or "Short Answers API"
4. 2,000 free queries/month
5. Add to `.env`:
   ```
   WOLFRAM_APP_ID=your-appid-here
   ```

---

### 6. **Wikipedia API** (Already Integrated - FREE!)

**Status**: ✅ Already working in your chatbot!
- No API key needed
- Automatically used for "what is" questions
- Provides factual knowledge from Wikipedia

---

## 📊 Which API to Use When?

| Question Type | Best API | Why |
|--------------|----------|-----|
| Math problems | WolframAlpha | Step-by-step solutions |
| History/Facts | Wikipedia | Free, accurate facts |
| Programming | ChatGPT/Claude | Code generation |
| Essay writing | Claude | Better reasoning |
| General chat | Gemini/ChatGPT | Natural conversation |
| Science concepts | Claude/Wikipedia | Clear explanations |

---

## 💰 Cost Comparison

| Provider | Free Tier | Paid Cost |
|----------|-----------|-----------|
| Wikipedia | ✅ Unlimited Free | N/A |
| Hugging Face | ✅ Limited Free | Pay per compute |
| WolframAlpha | 2,000 queries/month | $4.99/month |
| ChatGPT | No free tier | $0.002 per 1K tokens |
| Gemini | ✅ 60 queries/minute free | Very low cost |
| Claude | $5 free credits | $0.25 per 1M tokens |

---

## 🎯 Implementation Priority

**Phase 1 (Already Done):**
1. ✅ ChatGPT  
2. ✅ Gemini
3. ✅ Wikipedia (free fallback)

**Phase 2 (Add Next):**
1. **Claude** - Best bang for buck, excellent for education
2. **WolframAlpha** - Makes math questions WAY better

**Phase 3 (Optional):**
1. Hugging Face - If you want more model variety
2. More specialized APIs based on user needs

---

## 🔧 How to Add New APIs to Your Code

### Adding a New Provider (Example: Claude)

**1. Update `.env`:**
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**2. The code already supports Claude!** 
Just select "Claude (Anthropic)" from the dropdown and it will work once you add the API key.

**3. Restart server:**
```bash
npm run start
```

---

## 🚨 API Key Security Tips

1. ✅ **NEVER** commit API keys to GitHub
2. ✅ Keys stay in `.env` file (server-side only)
3. ✅ Add `.env` to `.gitignore`
4. ✅ Use environment variables in production
5. ❌ Never expose keys in client-side JavaScript

---

## 📈 Making Your Bot Smarter

### Current Smart Features:
- ✅ Auto-detects "what is" questions → uses Wikipedia
- ✅ Falls back to demo mode if no API keys
- ✅ Multi-provider support (ChatGPT, Gemini, Claude)

### Future Enhancements You Can Add:
1. **Intelligent Routing**: Auto-pick best API based on question type
2. **Cost Optimization**: Use cheaper APIs first, expensive ones as fallback
3. **Response Caching**: Save common answers to reduce API calls
4. **Multi-API Consensus**: Ask 2+ AIs and combine answers
5. **Streaming Responses**: Show answer as it generates (like ChatGPT)

---

## 🎓 Recommended Setup for Students (Best Value)

```env
# Best combo for educational use:
GEMINI_API_KEY=your-key          # Free tier, great for chat
ANTHROPIC_API_KEY=your-key       # Cheap, excellent quality
WOLFRAM_APP_ID=your-key          # Free tier for math
# Wikipedia - already free and integrated!
```

**Cost**: ~$0-5/month for moderate use

---

## 📞 Getting Help

If an API isn't working:
1. Check `.env` file has correct key
2. Restart server (`npm run start`)
3. Check server terminal for error messages
4. Verify API key is active on provider's dashboard

---

## 🎉 Next Steps

1. **Get Claude API key** (highest priority)
2. **Get WolframAlpha App ID** (makes math amazing)
3. **Test each provider** with different question types
4. **Monitor usage** on each provider's dashboard
5. **Optimize costs** by using free tiers strategically

Your chatbot is already production-ready! Adding more APIs just makes it more powerful and reliable.
