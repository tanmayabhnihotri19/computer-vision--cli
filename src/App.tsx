/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Upload, Image as ImageIcon, FileText, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzeImage, generateReport } from './services/vision';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogEntry {
  type: 'input' | 'output' | 'error' | 'system';
  content: string | React.ReactNode;
  timestamp: Date;
}

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      type: 'system',
      content: 'VisionCLI v1.0.0 initialized. Type "help" for a list of commands.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState<{ base64: string; name: string } | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (type: LogEntry['type'], content: string | React.ReactNode) => {
    setLogs((prev) => [...prev, { type, content, timestamp: new Date() }]);
  };

  const handleCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    if (!trimmedCmd) return;

    addLog('input', cmd);
    setInput('');

    switch (trimmedCmd) {
      case 'help':
        addLog('output', (
          <div className="grid grid-cols-1 gap-1 mt-2">
            <p><span className="text-emerald-400 font-mono">upload</span> - Upload an image for analysis</p>
            <p><span className="text-emerald-400 font-mono">analyze</span> - Run general vision analysis on current image</p>
            <p><span className="text-emerald-400 font-mono">detect</span> - Specific object detection command</p>
            <p><span className="text-emerald-400 font-mono">report</span> - Generate a full technical report (Markdown)</p>
            <p><span className="text-emerald-400 font-mono">status</span> - Show current session status</p>
            <p><span className="text-emerald-400 font-mono">clear</span> - Clear the terminal screen</p>
          </div>
        ));
        break;

      case 'clear':
        setLogs([{
          type: 'system',
          content: 'Terminal cleared. VisionCLI ready.',
          timestamp: new Date(),
        }]);
        break;

      case 'upload':
        fileInputRef.current?.click();
        addLog('system', 'Opening file picker...');
        break;

      case 'status':
        addLog('output', (
          <div className="mt-2 space-y-1">
            <p>Image: {currentImage ? <span className="text-emerald-400">{currentImage.name}</span> : <span className="text-red-400">None</span>}</p>
            <p>Analysis: {lastAnalysis ? <span className="text-emerald-400">Available</span> : <span className="text-yellow-400">Pending</span>}</p>
          </div>
        ));
        break;

      case 'analyze':
        if (!currentImage) {
          addLog('error', 'Error: No image uploaded. Use "upload" first.');
          break;
        }
        setIsProcessing(true);
        addLog('system', 'Analyzing image with Gemini Vision...');
        try {
          const result = await analyzeImage(currentImage.base64, "Describe this image in detail for a technical report.");
          setLastAnalysis(result);
          addLog('output', (
            <div className="mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded">
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          ));
        } catch (err) {
          addLog('error', `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setIsProcessing(false);
        }
        break;

      case 'detect':
        if (!currentImage) {
          addLog('error', 'Error: No image uploaded.');
          break;
        }
        setIsProcessing(true);
        addLog('system', 'Detecting objects...');
        try {
          const result = await analyzeImage(currentImage.base64, "List all objects detected in this image with their approximate locations.");
          addLog('output', (
            <div className="mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded">
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          ));
        } catch (err) {
          addLog('error', `Detection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setIsProcessing(false);
        }
        break;

      case 'report':
        if (!currentImage || !lastAnalysis) {
          addLog('error', 'Error: You must "upload" and "analyze" an image before generating a report.');
          break;
        }
        setIsProcessing(true);
        addLog('system', 'Generating comprehensive technical report...');
        try {
          const report = await generateReport(currentImage.base64, lastAnalysis);
          addLog('output', (
            <div className="mt-4 p-6 bg-white text-zinc-900 rounded-lg shadow-xl overflow-auto max-h-[60vh]">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Technical Vision Report
                </h2>
                <button 
                  onClick={() => downloadReport(report)}
                  className="text-xs bg-zinc-900 text-white px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                >
                  Download .md
                </button>
              </div>
              <div className="markdown-body prose prose-zinc max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          ));
        } catch (err) {
          addLog('error', `Report generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setIsProcessing(false);
        }
        break;

      default:
        addLog('error', `Command not found: ${trimmedCmd}. Type "help" for assistance.`);
    }
  };

  const downloadReport = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision_report_${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCurrentImage({ base64, name: file.name });
      setLastAnalysis(null);
      addLog('system', `Successfully loaded: ${file.name}`);
      addLog('output', (
        <div className="mt-2 relative group w-fit">
          <img src={base64} alt="Preview" className="max-h-48 rounded border border-zinc-700" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
            <span className="text-xs text-white">Image Loaded</span>
          </div>
        </div>
      ));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Terminal className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">VisionCLI</h1>
            <p className="text-xs text-zinc-500">Computer Vision Terminal Interface</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", currentImage ? "bg-emerald-500" : "bg-zinc-700")} />
            <span>{currentImage ? "IMAGE_LOADED" : "NO_ASSET"}</span>
          </div>
          <div className="text-zinc-600">v1.0.0</div>
        </div>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800"
        >
          <AnimatePresence initial={false}>
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                  <span>[{log.timestamp.toLocaleTimeString()}]</span>
                  <span className={cn(
                    "px-1 rounded uppercase font-bold",
                    log.type === 'input' && "text-blue-400",
                    log.type === 'output' && "text-emerald-400",
                    log.type === 'error' && "text-red-400",
                    log.type === 'system' && "text-zinc-400"
                  )}>
                    {log.type}
                  </span>
                </div>
                <div className={cn(
                  "text-sm leading-relaxed",
                  log.type === 'input' && "text-white font-bold flex items-center gap-2",
                  log.type === 'error' && "text-red-400/90",
                  log.type === 'system' && "text-zinc-500 italic"
                )}>
                  {log.type === 'input' && <ChevronRight className="w-4 h-4 text-blue-500" />}
                  {log.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="flex items-center gap-2 text-emerald-500 text-sm animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing request...</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center gap-3">
          <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleCommand(input)}
            placeholder={isProcessing ? "Waiting for process..." : "Enter command (try 'help')..."}
            disabled={isProcessing}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-700 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleCommand('upload')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white"
              title="Upload Image"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleCommand('clear')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-400"
              title="Clear Terminal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <footer className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest">
        Vision Command Line Interface • Powered by Gemini AI • Secure Sandbox Environment
      </footer>
    </div>
  );
}
