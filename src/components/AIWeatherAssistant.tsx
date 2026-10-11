import React, { useState } from 'react';
import { ProcessedWeatherData, ChatMessage } from '../types/weather';
import { executeWeatherQueryPipeline, WeatherToolContext } from '../services/assistantQueryPipeline';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Info,
  CheckCircle2,
  HelpCircle,
  MapPin,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface AIWeatherAssistantProps {
  weather: ProcessedWeatherData;
}

const PRESET_QUERIES = [
  'What should I wear to college today?',
  'Suggest a formal outfit for today\'s weather',
  'Will it rain in the next 3 hours?',
  'What should I wear tomorrow morning?',
  'Suggest an outfit for rainy weather',
  'What dangerous weather is expected tomorrow?',
];

export const AIWeatherAssistant: React.FC<AIWeatherAssistantProps> = ({ weather }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Greetings! I am ATMOS AI, your global atmospheric intelligence co-pilot. You can ask me natural-language weather questions for **any city or country worldwide** (e.g. "What is the temperature in London?", "Will it rain in New York tomorrow?", or "Compare Jaipur and Singapore"), or ask about your active station (${weather.location.name}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextPeriod: 'Global Planetary Network',
      isFallback: true,
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastResolvedLocation, setLastResolvedLocation] = useState<string>(weather.location.name);

  // Persistent conversational context state across questions
  const [toolContext, setToolContext] = useState<WeatherToolContext>({
    lastLocation: weather.location,
  });

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    try {
      // Execute the multi-stage location-aware query pipeline
      const { response, updatedContext } = await executeWeatherQueryPipeline(
        trimmed,
        weather,
        toolContext
      );

      setToolContext(updatedContext);
      if (response.resolvedLocation) {
        setLastResolvedLocation(response.resolvedLocation);
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contextPeriod: response.contextPeriod,
        isFallback: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Encountered an atmospheric telemetry error: ${err.message || 'Service temporarily unavailable'}. Please verify query and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contextPeriod: 'Service Interruption',
        isFallback: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section id="ai-assistant" className="py-12 px-4 sm:px-8 lg:px-12 xl:px-16 w-full max-w-none z-10 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-3">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Global Weather Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Conversational Forecast Analyst
          </h2>
        </div>

        {/* Engine Transparency Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs self-start md:self-auto">
          <Info className="w-3.5 h-3.5" />
          <span>Global Geocoding & Open-Meteo Pipeline</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chat Display & Prompts */}
        <div className="lg:col-span-8 glass-panel p-5 sm:p-6 rounded-3xl flex flex-col h-[560px]">
          {/* Active Context Banner */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Current Context Location:</span>
              <span className="font-semibold text-slate-200">{lastResolvedLocation}</span>
            </div>
            <button
              onClick={() => {
                setToolContext({ lastLocation: weather.location });
                setLastResolvedLocation(weather.location.name);
              }}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 text-[11px]"
              title="Reset conversation location to active page station"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Context</span>
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-700/60 text-slate-100 rounded-tl-none shadow-xl'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-white/10 text-[11px] text-slate-400">
                    <span className="font-mono">{msg.timestamp}</span>
                    {msg.contextPeriod && (
                      <span className="text-cyan-300 font-medium">
                        Focus: {msg.contextPeriod}
                      </span>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <span>Resolving global coordinates & retrieving numerical telemetry...</span>
              </div>
            )}
          </div>

          {/* Preset question pills */}
          <div className="pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
            {PRESET_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={isTyping}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-cyan-300 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-800/80"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              disabled={isTyping}
              placeholder="Ask about weather in any city (e.g. 'What is the temperature in London?')"
              className="flex-1 px-4 py-3 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white transition-all shadow-lg flex items-center justify-center"
              title="Send prompt"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Right: Telemetry Context Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Location-Aware Telemetry Pipeline</span>
            </div>
            <h4 className="font-bold text-white text-base font-['Outfit']">
              Global Ground Truth Resolution
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you ask about any city or country (e.g. London, Tokyo, Paris), ATMOS resolves geographical coordinates via Open-Meteo Geocoding, queries live ECMWF numerical grids, and synthesizes accurate, unhallucinated answers.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-300">
              <div>• Coverage: All global cities & territories</div>
              <div>• Pipeline: Geocode → Weather API → Reason</div>
              <div>• Multi-City: Comparison & Differential</div>
              <div>• Memory: Follow-up question context</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Try These Example Queries</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>"What is the temperature in London right now?"</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>"What about tomorrow?" <em>(remembers London)</em></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>"Compare Jaipur and Singapore"</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>"Give me the 7-day forecast for Cape Town"</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>"What will temperature in Toronto be at 6 PM?"</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
