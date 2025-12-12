
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TacticToken, TacticFrame, TacticsData, TokenType } from '../types';
import { Button } from './Button';

interface TacticsBoardProps {
  initialData?: string; // JSON string of TacticsData
  isReadOnly?: boolean;
  onSave?: (data: string) => void;
}

const DEFAULT_DATA: TacticsData = {
  pitchType: 'half',
  frames: [
    {
      id: 'frame-1',
      tokens: [
        { id: 'atk-1', type: 'attacker', x: 50, y: 80, label: '1' },
        { id: 'ball-1', type: 'ball', x: 52, y: 82 },
      ]
    }
  ]
};

// Animation constants
const ANIMATION_DURATION_MS = 700;
const FRAME_INTERVAL_MS = 750; // Slightly longer than duration to ensure completion

export const TacticsBoard: React.FC<TacticsBoardProps> = ({ 
  initialData, 
  isReadOnly = false,
  onSave 
}) => {
  // Parse initial data or use default
  const [data, setData] = useState<TacticsData>(() => {
    if (initialData) {
      try {
        if (initialData.trim().startsWith('{')) {
          return JSON.parse(initialData);
        }
      } catch (e) {
        console.error("Failed to parse tactics data", e);
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  });

  // History for Undo/Redo
  const [history, setHistory] = useState<TacticsData[]>([data]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  
  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  
  const currentFrame = data.frames[currentFrameIndex];
  const previousFrame = currentFrameIndex > 0 ? data.frames[currentFrameIndex - 1] : null;
  const selectedToken = currentFrame.tokens.find(t => t.id === selectedTokenId);

  // --- HISTORY MANAGEMENT ---
  const pushHistory = (newData: TacticsData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    if (newHistory.length > 20) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setData(newData);
    if (onSave) onSave(JSON.stringify(newData));
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setData(JSON.parse(JSON.stringify(history[newIndex])));
      if (onSave) onSave(JSON.stringify(history[newIndex]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setData(JSON.parse(JSON.stringify(history[newIndex])));
      if (onSave) onSave(JSON.stringify(history[newIndex]));
    }
  };

  // --- PLAYBACK ---
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrameIndex(prev => {
          // Stop at the end instead of looping
          if (prev >= data.frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, FRAME_INTERVAL_MS); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, data.frames.length]);

  // --- EDITING ACTIONS ---

  const addToken = (type: TokenType) => {
    if (isReadOnly) return;
    
    let label = '';
    if (type === 'attacker') {
      const count = currentFrame.tokens.filter(t => t.type === 'attacker').length;
      label = (count + 1).toString();
    } else if (type === 'defender') {
      const count = currentFrame.tokens.filter(t => t.type === 'defender').length;
      label = String.fromCharCode(65 + count); // A, B, C...
    }

    const newToken: TacticToken = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      x: 50,
      y: 50,
      label
    };

    const newTokens = [...currentFrame.tokens, newToken];
    updateFrameTokens(newTokens);
    setSelectedTokenId(newToken.id);
  };

  const updateFrameTokens = (newTokens: TacticToken[]) => {
    const newFrames = [...data.frames];
    newFrames[currentFrameIndex] = {
      ...newFrames[currentFrameIndex],
      tokens: newTokens
    };
    const newData = { ...data, frames: newFrames };
    pushHistory(newData);
  };

  const updateTokenLabel = (newLabel: string) => {
    if (!selectedToken || isReadOnly) return;
    const newTokens = currentFrame.tokens.map(t => 
      t.id === selectedTokenId ? { ...t, label: newLabel } : t
    );
    
    const newFrames = [...data.frames];
    newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], tokens: newTokens };
    const newData = { ...data, frames: newFrames };
    setData(newData); // Local update
    if (onSave) onSave(JSON.stringify(newData));
  };
  
  const commitTokenLabel = () => {
     pushHistory(data);
  }

  const addFrame = () => {
    if (isReadOnly) return;
    
    const newTokens = currentFrame.tokens.map(t => ({ ...t })); // Deep copy positions
    
    const newFrame: TacticFrame = {
      id: `frame-${Date.now()}`,
      tokens: newTokens,
      notes: ''
    };

    const newFrames = [...data.frames];
    // Insert after current
    newFrames.splice(currentFrameIndex + 1, 0, newFrame);
    
    const newData = { ...data, frames: newFrames };
    
    setHistory(prev => {
        const newHist = prev.slice(0, historyIndex + 1);
        newHist.push(newData);
        return newHist;
    });
    setHistoryIndex(prev => prev + 1);
    
    setData(newData);
    setCurrentFrameIndex(currentFrameIndex + 1);
    if (onSave) onSave(JSON.stringify(newData));
  };

  const deleteFrame = () => {
    if (isReadOnly || data.frames.length <= 1) return;
    const newFrames = data.frames.filter((_, i) => i !== currentFrameIndex);
    const newData = { ...data, frames: newFrames };
    pushHistory(newData);
    setCurrentFrameIndex(prev => Math.max(0, prev - 1));
  };

  const deleteToken = (tokenId: string) => {
    if (isReadOnly) return;
    const newTokens = currentFrame.tokens.filter(t => t.id !== tokenId);
    updateFrameTokens(newTokens);
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  // --- DRAG LOGIC ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, tokenId: string) => {
    if (isReadOnly || isPlaying) return;
    e.stopPropagation();
    setDraggedTokenId(tokenId);
    setSelectedTokenId(tokenId);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedTokenId || !boardRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const rect = boardRef.current.getBoundingClientRect();
    
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    // Update dragged token position
    let updatedTokens = currentFrame.tokens.map(t => 
      t.id === draggedTokenId ? { ...t, x, y } : t
    );

    // --- MAGNETIC BALL LOGIC ---
    // If dragging a player, check if we should "carry" the ball
    const draggedToken = currentFrame.tokens.find(t => t.id === draggedTokenId);
    if (draggedToken && (draggedToken.type === 'attacker' || draggedToken.type === 'defender')) {
       const ballIndex = updatedTokens.findIndex(t => t.type === 'ball');
       if (ballIndex !== -1) {
          const ball = updatedTokens[ballIndex];
          // Calculate distance (hypotenuse in %)
          const dist = Math.hypot(ball.x - x, ball.y - y);

          // Snap threshold
          if (dist < 6) {
             // Snap ball to player with slight offset to look "held"
             updatedTokens[ballIndex] = {
                ...ball,
                x: x + 2, 
                y: y + 2
             };
          }
       }
    }

    // Update local state for smooth drag
    const newFrames = [...data.frames];
    newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], tokens: updatedTokens };
    setData({ ...data, frames: newFrames });

  }, [draggedTokenId, currentFrameIndex, data]);

  const handleMouseUp = () => {
    if (draggedTokenId) {
      setDraggedTokenId(null);
      // Commit the drag to history
      pushHistory(data);
    }
  };

  // --- PATH VISUALIZATION HELPER ---
  const getPathForSelected = () => {
    if (!selectedTokenId) return null;
    
    // Collect all positions of this token across frames
    const points = data.frames.map(f => {
      const t = f.tokens.find(tk => tk.id === selectedTokenId);
      return t ? { x: t.x, y: t.y } : null;
    });

    if (points.every(p => p === null)) return null;

    // Construct SVG Polyline points string
    const pointsStr = points
      .filter(p => p !== null)
      .map(p => `${p!.x},${p!.y}`)
      .join(' ');

    return { points, pointsStr };
  };

  const pathData = !isPlaying && !draggedTokenId ? getPathForSelected() : null;


  // --- RENDERERS ---

  const getTokenStyle = (token: TacticToken, isGhost = false) => {
    const isDragging = token.id === draggedTokenId;
    const isSelected = token.id === selectedTokenId && !isGhost;
    
    // Z-Index Layering:
    let zIndex = 10;
    if (isGhost) zIndex = 5;
    else if (isDragging) zIndex = 100;
    else if (token.type === 'ball') zIndex = 40; // Ball always on top
    else if (token.type === 'attacker' || token.type === 'defender') zIndex = 20;

    return {
      left: `${token.x}%`,
      top: `${token.y}%`,
      cursor: isReadOnly || isGhost ? 'default' : isDragging ? 'grabbing' : 'grab',
      transform: `translate(-50%, -50%) scale(${isDragging ? 1.2 : 1})`,
      // Synchronize transition with interval for fluid movement
      transition: isDragging ? 'none' : `all ${ANIMATION_DURATION_MS}ms ease-in-out`,
      zIndex,
      opacity: isGhost ? 0.3 : 1,
      boxShadow: isSelected ? '0 0 0 2px white, 0 0 0 4px #3B82F6' : 'none'
    };
  };

  return (
    <div className="flex flex-col h-full select-none">
      
      {/* TOOLBAR */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          
          <div className="flex items-center space-x-2">
            {/* Undo/Redo */}
            <div className="flex items-center space-x-1 mr-2 border-r border-gray-200 dark:border-white/10 pr-2">
               <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 text-gray-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-200 dark:hover:bg-white/10">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
               </button>
               <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-gray-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-200 dark:hover:bg-white/10">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
               </button>
            </div>

            {/* Tokens */}
            <button onClick={() => addToken('attacker')} className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-[#1A1A1C] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 hover:-translate-y-0.5 transition-transform group">
              <div className="w-3 h-3 rounded-full bg-red-600 group-hover:scale-110 transition-transform"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Atk</span>
            </button>
            <button onClick={() => addToken('defender')} className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-[#1A1A1C] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 hover:-translate-y-0.5 transition-transform group">
              <div className="w-3 h-3 rounded-full bg-blue-600 group-hover:scale-110 transition-transform"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Def</span>
            </button>
            <button onClick={() => addToken('ball')} className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-[#1A1A1C] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 hover:-translate-y-0.5 transition-transform group">
              <div className="w-3 h-3 rounded-[50%] bg-yellow-400 border border-yellow-600 group-hover:scale-110 transition-transform"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Ball</span>
            </button>
            <button onClick={() => addToken('pad')} className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-[#1A1A1C] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 hover:-translate-y-0.5 transition-transform group">
              <div className="w-3 h-3 bg-orange-500 rounded-sm group-hover:scale-110 transition-transform"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Pad</span>
            </button>
          </div>

          {/* Selection Actions */}
          <div className="flex items-center space-x-2 pl-4 border-l border-gray-200 dark:border-white/10">
            {selectedToken ? (
              <>
                 <span className="text-[10px] font-bold text-gray-400 uppercase hidden sm:inline">Selected:</span>
                 <input 
                   type="text" 
                   value={selectedToken.label || ''} 
                   onChange={(e) => updateTokenLabel(e.target.value)}
                   onBlur={commitTokenLabel}
                   onKeyDown={(e) => e.key === 'Enter' && commitTokenLabel()}
                   className="w-12 px-2 py-1 text-xs font-bold text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 shadow-sm"
                   maxLength={3}
                 />
                 <button onClick={() => deleteToken(selectedToken.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Token">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
              </>
            ) : (
               <span className="text-[10px] text-gray-400 italic px-2">Select a token to edit</span>
            )}
          </div>
        </div>
      )}

      {/* CANVAS AREA */}
      <div 
        className="relative w-full aspect-video bg-[#1e5c35] rounded-xl overflow-hidden shadow-inner border-[6px] border-[#143d22] touch-none"
        ref={boardRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setSelectedTokenId(null)}
      >
        {/* Pitch Markings (Grid) */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
           {/* Grass Texture */}
           <div className="absolute inset-0" style={{ 
               backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255, .05) 25%, rgba(255,255,255, .05) 26%, transparent 27%, transparent 74%, rgba(255,255,255, .05) 75%, rgba(255,255,255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255, .05) 25%, rgba(255,255,255, .05) 26%, transparent 27%, transparent 74%, rgba(255,255,255, .05) 75%, rgba(255,255,255, .05) 76%, transparent 77%, transparent)', 
               backgroundSize: '50px 50px' 
           }}></div>
           
           {/* Lines */}
           <div className="absolute bottom-[5%] left-0 w-full h-[2px] bg-white/90"></div>
           <div className="absolute bottom-[25%] left-0 w-full h-[1px] bg-white/70"></div>
           <div className="absolute bottom-[40%] left-0 w-full h-[1px] bg-white/60 border-t border-dashed"></div>
           <div className="absolute top-0 left-0 w-full h-[2px] bg-white/90"></div>
           <div className="absolute top-0 bottom-0 left-[5%] w-[1px] bg-white/60 dashed"></div>
           <div className="absolute top-0 bottom-0 right-[5%] w-[1px] bg-white/60 dashed"></div>
        </div>

        {/* --- PATH VISUALIZATION (FULL RUN) --- */}
        {pathData && pathData.pointsStr && (
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <polyline 
                 points={pathData.pointsStr} 
                 fill="none" 
                 stroke="yellow" 
                 strokeWidth="2" 
                 strokeDasharray="6" 
                 strokeOpacity="0.5" 
              />
              {/* Show Waypoints (Ghost Dots) */}
              {pathData.points.map((p, i) => p && (
                 <circle key={`pt-${i}`} cx={`${p.x}%`} cy={`${p.y}%`} r="3" fill="yellow" fillOpacity="0.5" />
              ))}
           </svg>
        )}

        {/* --- IMMEDIATE MOVEMENT VECTOR (PREV -> CURR) --- */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker id="arrowhead-red" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
               <polygon points="0 0, 6 2, 0 4" fill="rgba(255,255,255,0.6)" />
            </marker>
          </defs>
          {!isPlaying && previousFrame && currentFrame.tokens.map(token => {
            const prevToken = previousFrame.tokens.find(t => t.id === token.id);
            if (!prevToken) return null;
            // Draw line from prev to curr only if distance is significant
            const dist = Math.hypot(token.x - prevToken.x, token.y - prevToken.y);
            if (dist < 1) return null;

            return (
              <line 
                key={`line-${token.id}`}
                x1={`${prevToken.x}%`} 
                y1={`${prevToken.y}%`} 
                x2={`${token.x}%`} 
                y2={`${token.y}%`} 
                stroke="white" 
                strokeWidth="2"
                strokeDasharray="4"
                strokeOpacity="0.6"
                markerEnd="url(#arrowhead-red)"
              />
            );
          })}
        </svg>

        {/* ONION SKIN (Ghost Tokens) - Only when not playing */}
        {!isPlaying && previousFrame && previousFrame.tokens.map(token => (
           <div
             key={`ghost-${token.id}`}
             className="absolute flex items-center justify-center pointer-events-none filter grayscale"
             style={getTokenStyle(token, true)}
           >
              {token.type === 'attacker' && <div className="w-8 h-8 rounded-full bg-red-600 border border-white"></div>}
              {token.type === 'defender' && <div className="w-8 h-8 rounded-full bg-blue-600 border border-white"></div>}
              {token.type === 'ball' && <div className="w-5 h-4 rounded-[50%] bg-yellow-400"></div>}
              {(token.type === 'cone' || token.type === 'pad') && <div className="w-8 h-8 bg-orange-500 rounded-sm"></div>}
           </div>
        ))}

        {/* Active Tokens */}
        {currentFrame.tokens.map(token => (
          <div
            key={token.id}
            className="absolute flex items-center justify-center font-bold text-white shadow-lg select-none"
            style={getTokenStyle(token)}
            onMouseDown={(e) => handleMouseDown(e, token.id)}
            onTouchStart={(e) => handleMouseDown(e, token.id)}
            onDoubleClick={() => !isReadOnly && deleteToken(token.id)}
          >
            {token.type === 'attacker' && (
              <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-xs shadow-md">
                {token.label}
              </div>
            )}
            {token.type === 'defender' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-xs shadow-md">
                {token.label}
              </div>
            )}
            {token.type === 'ball' && (
              <div className="w-5 h-4 rounded-[50%] bg-yellow-400 border border-yellow-600 transform rotate-45 shadow-sm"></div>
            )}
            {(token.type === 'cone' || token.type === 'pad') && (
              <div className="w-8 h-8 bg-orange-500 rounded-sm border border-orange-700 flex items-center justify-center shadow-md">
                 <div className="w-full h-1 bg-black/20"></div>
              </div>
            )}
          </div>
        ))}

        {/* Frame Indicator Overlay */}
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold pointer-events-none border border-white/10">
           FRAME {currentFrameIndex + 1} / {data.frames.length}
        </div>
        
        {/* Playback Indicator */}
        {isPlaying && (
           <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold animate-pulse pointer-events-none shadow-lg">
              PLAYING
           </div>
        )}
      </div>

      {/* TIMELINE CONTROLS */}
      <div className="mt-4 flex flex-col space-y-3 bg-white dark:bg-[#1A1A1C] p-4 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm">
         <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
               
               <div className="flex items-center space-x-1">
                   <button 
                     onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                     disabled={currentFrameIndex === 0 || isPlaying}
                     className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                   </button>
                   
                   <button 
                     onClick={() => setIsPlaying(!isPlaying)}
                     className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-md active:scale-95 ${isPlaying ? 'bg-red-100 text-red-600 border-2 border-red-200' : 'bg-green-100 text-green-600 border-2 border-green-200 hover:bg-green-200'}`}
                   >
                      {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      )}
                   </button>

                   <button 
                     onClick={() => setCurrentFrameIndex(Math.min(data.frames.length - 1, currentFrameIndex + 1))}
                     disabled={currentFrameIndex === data.frames.length - 1 || isPlaying}
                     className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                   </button>
               </div>
               
               <div className="flex items-center space-x-2 overflow-x-auto max-w-[150px] sm:max-w-none no-scrollbar pb-2 pt-2">
                  {data.frames.map((_, i) => (
                     <div 
                        key={i} 
                        onClick={() => { setIsPlaying(false); setCurrentFrameIndex(i); }}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition-all border ${currentFrameIndex === i ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md scale-110' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 border-transparent'}`}
                     >
                        {i + 1}
                     </div>
                  ))}
               </div>
            </div>

            {!isReadOnly && (
               <div className="flex items-center space-x-2">
                  <Button 
                    onClick={addFrame}
                    className="h-9 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 shadow-none hover:bg-blue-100"
                  >
                     + Frame
                  </Button>
                  {data.frames.length > 1 && (
                    <button 
                      onClick={deleteFrame}
                      className="h-9 px-3 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-100"
                      title="Delete Current Frame"
                    >
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
               </div>
            )}
         </div>
         
         <div className="text-center text-[10px] text-gray-400 font-medium">
            {isReadOnly ? 'Press Play to animate' : 'Drag tokens to new positions, then click "+ Frame" to create movement step'}
         </div>
      </div>
    </div>
  );
};
