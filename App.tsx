import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Image as ImageIcon, Video, Type, Code, Link as LinkIcon, Search, Settings, X, Sparkles } from 'lucide-react';
import { DraggableWindow } from './components/DraggableWindow';
import { NodeElement, NodeData, NodeType } from './components/NodeElement';

interface Connection {
  id: string;
  source: string;
  target: string;
}

export function App() {
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: 'core-1', type: 'core', title: 'Core Project', x: window.innerWidth / 2 - 64, y: window.innerHeight / 2 - 64 },
    { id: 'img-1', type: 'image', title: 'Visual Concepts v1.2', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAj2x5Ews4pBgG7h4nHiLThrYuob8miVR94xy2vgESH2XCntQQCrGub_UyKWJ-5L3ZlADii_51tDN6JWIMY58dk4r8gik80rqutMYLUnvpHmP41Zdu3d8xP4CcoQBl2Tzd4NTxWk6EnGLw2gzZK7KgjZrM4t_uIp1dU6eA974tZO6GgMKjTZSVy1FqFf1T_feq7aCWkhqFXImpIvKqY_-RPA4UvlihapqTuKcE4BUV-0QqkRNUCfrr60_pn9SCN2vXIGxCPwjmkO-Hu', x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
    { id: 'vid-1', type: 'video', title: '3D Animation Techniques', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNNzNeS9UAgaMu3lzrNn2hBmuzm_XOsw17V34-Z3uC8NiwfJ3AEeI9ngWcD8m4Di7__Oqg2-lILYUN7U6yBalBZZQBX8-1Vmxc9GAJnapDkAdsi6RjnsOFi8osV8vd_ZWy0h4jXYieYRRVeq1_CtIWWebR6bRYcAU5_-t9WV0Dqo6AwazkM-Bjh4Fv-WvQY5q6-2SuywzcJ2L8wsj0gpw2I6-e7YEUVWVjYmEPk6PFCtjKpTfmeDcXeL2OHCwMM-ZSkiR8JtE5Nxfm', x: window.innerWidth * 0.7, y: window.innerHeight * 0.4 },
    { id: 'code-1', type: 'code', title: 'Code Snippet', content: "const universe = {\n  nodes: 42,\n  links: 128,\n  status: 'active'\n};", x: window.innerWidth * 0.15, y: window.innerHeight * 0.6 },
    { id: 'gif-1', type: 'gif', title: 'Dynamic Texture Reference', x: window.innerWidth * 0.45, y: window.innerHeight * 0.75 },
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 'conn-1', source: 'core-1', target: 'img-1' },
    { id: 'conn-2', source: 'core-1', target: 'vid-1' },
    { id: 'conn-3', source: 'core-1', target: 'code-1' },
    { id: 'conn-4', source: 'core-1', target: 'gif-1' },
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWindows, setActiveWindows] = useState<string[]>([]);
  const [bgTheme, setBgTheme] = useState('bg-nebula-gradient');
  
  useEffect(() => {
    document.body.className = `h-full select-none ${bgTheme}`;
  }, [bgTheme]);

  const [newNodeType, setNewNodeType] = useState<NodeType>('text');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeContent, setNewNodeContent] = useState('');
  const [newNodeUrl, setNewNodeUrl] = useState('');

  const [editNodeTitle, setEditNodeTitle] = useState('');
  const [editNodeContent, setEditNodeContent] = useState('');
  const [editNodeUrl, setEditNodeUrl] = useState('');

  const clusterRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const [orbit, setOrbit] = useState({ x: 45, z: -15 });
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [startOrbit, setStartOrbit] = useState({ x: 0, z: 0 });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [is3D, setIs3D] = useState(false);

  const [zoom, setZoom] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');

  // Handle Canvas Panning and Orbiting
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).classList.contains('grid-overlay')) {
      if (is3D && e.button === 0) {
        // Left click in 3D mode orbits
        setIsOrbiting(true);
        setStartOrbit({ x: e.clientY + orbit.x, z: e.clientX - orbit.z });
      } else {
        // Pan
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
      setConnectingFrom(null);
    }
    setSelectedNode(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isOrbiting) {
      // Limit rotateX between 0 and 80 degrees to prevent flipping
      const newRotateX = Math.max(0, Math.min(80, startOrbit.x - e.clientY));
      const newRotateZ = e.clientX - startOrbit.z;
      setOrbit({ x: newRotateX, z: newRotateZ });
    } else if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
    if (connectingFrom) {
      setMousePos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsOrbiting(false);
  };

  const handleNodeDragEnd = (id: string, x: number, y: number) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleNodeSelect = (id: string) => {
    if (connectingFrom) {
      if (connectingFrom !== id) {
        // Create connection
        const newConn = { id: `conn-${Date.now()}`, source: connectingFrom, target: id };
        setConnections([...connections, newConn]);
      }
      setConnectingFrom(null);
    } else {
      setSelectedNode(id);
    }
  };

  const handleConnectStart = (id: string, e: React.MouseEvent) => {
    setConnectingFrom(id);
    setMousePos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const toggleWindow = (id: string) => {
    if (activeWindows.includes(id)) {
      setActiveWindows(activeWindows.filter(w => w !== id));
    } else {
      setActiveWindows([...activeWindows, id]);
    }
  };

  const handleAddNode = () => {
    if (!newNodeTitle) return;
    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      type: newNodeType,
      title: newNodeTitle,
      content: newNodeContent,
      url: newNodeUrl,
      x: window.innerWidth / 2 - pan.x,
      y: window.innerHeight / 2 - pan.y,
    };
    setNodes([...nodes, newNode]);
    setNewNodeTitle('');
    setNewNodeContent('');
    setNewNodeUrl('');
    toggleWindow('addNode');
  };

  // Calculate connection lines
  const getLineCoordinates = (sourceId: string, targetId: string) => {
    const source = nodes.find(n => n.id === sourceId);
    const target = nodes.find(n => n.id === targetId);
    if (!source || !target) return null;
    
    // Approximate center of nodes (could be improved based on node type/size)
    const sx = source.x + (source.type === 'core' ? 64 : 100);
    const sy = source.y + (source.type === 'core' ? 64 : 50);
    const tx = target.x + (target.type === 'core' ? 64 : 100);
    const ty = target.y + (target.type === 'core' ? 64 : 50);
    
    return { x1: sx, y1: sy, x2: tx, y2: ty };
  };

  const handleCreateUniverse = () => {
    setNodes([{ id: `core-${Date.now()}`, type: 'core', title: 'New Universe', x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 }]);
    setConnections([]);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSearchQuery('');
    setSelectedNode(null);
    setConnectingFrom(null);
  };

  return (
    <main 
      className="relative w-full h-full overflow-hidden" 
      data-purpose="3d-universe-viewport"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ perspective: is3D ? '1200px' : 'none' }}
    >
      {/* Subtle Grid Background */}
      <div aria-hidden="true" className="absolute inset-0 grid-overlay pointer-events-none" style={{ transform: `translate(${pan.x % 50}px, ${pan.y % 50}px)` }}></div>
      
      {/* 3D Transform Container */}
      <div
        className="absolute inset-0 w-full h-full transition-all duration-500 ease-out"
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) ${is3D ? `rotateX(${orbit.x}deg) rotateZ(${orbit.z}deg) scale(0.8)` : ''}`,
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* SVG Layer for Connections */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          data-purpose="node-connections"
        >
          {connections.map(conn => {
            const coords = getLineCoordinates(conn.source, conn.target);
            if (!coords) return null;
            return (
              <line 
                key={conn.id}
                className="connection-line" 
                x1={coords.x1} 
                x2={coords.x2} 
                y1={coords.y1} 
                y2={coords.y2}
              />
            );
          })}
          {connectingFrom && (
            <line 
              className="connection-line opacity-50" 
              x1={nodes.find(n => n.id === connectingFrom)?.x! + (nodes.find(n => n.id === connectingFrom)?.type === 'core' ? 64 : 100)} 
              y1={nodes.find(n => n.id === connectingFrom)?.y! + (nodes.find(n => n.id === connectingFrom)?.type === 'core' ? 64 : 50)} 
              x2={mousePos.x / zoom} 
              y2={mousePos.y / zoom} 
            />
          )}
        </svg>

        {/* Interactive Nodes Container */}
        <section 
          ref={clusterRef} 
          className="absolute inset-0 w-full h-full" 
          data-purpose="node-cluster"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {nodes.map(node => {
            const isMatch = searchQuery ? (node.title.toLowerCase().includes(searchQuery.toLowerCase()) || node.content?.toLowerCase().includes(searchQuery.toLowerCase())) : false;
            return (
              <NodeElement 
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id || connectingFrom === node.id}
                isMatch={isMatch}
                onSelect={handleNodeSelect}
                onDragEnd={handleNodeDragEnd}
                onConnectStart={handleConnectStart}
                is3D={is3D}
                orbit={orbit}
              />
            );
          })}
        </section>
      </div>

      {/* Top Bar Navigation/Breadcrumbs */}
      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none z-20">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Nebula<span className="text-neon-blue">Mind</span></h1>
          <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mt-1">Workspace / Project Alpha-9</p>
        </div>
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={handleCreateUniverse}
            className="glass-morphism px-4 py-2 rounded-full text-xs font-bold hover:bg-white/10 transition-colors border border-neon-purple/50 text-neon-purple hover:shadow-[0_0_15px_rgba(157,80,187,0.4)]"
          >
            NEW UNIVERSE
          </button>
          <button className="glass-morphism px-4 py-2 rounded-full text-xs font-bold hover:bg-white/10 transition-colors">SHARE</button>
          <button className="bg-neon-blue text-space-900 px-4 py-2 rounded-full text-xs font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,210,255,0.3)]">EXPORT</button>
        </div>
      </header>

      {/* Selected Node Action Bar */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-morphism px-4 py-2 rounded-full z-30"
          >
            <span className="text-xs text-gray-300 mr-2">Node Selected</span>
            <button 
              onClick={() => {
                setNodes(nodes.filter(n => n.id !== selectedNode));
                setConnections(connections.filter(c => c.source !== selectedNode && c.target !== selectedNode));
                setSelectedNode(null);
              }}
              className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded text-xs font-bold transition-colors"
            >
              Delete
            </button>
            <button 
              onClick={() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (node) {
                  setEditNodeTitle(node.title);
                  setEditNodeContent(node.content || '');
                  setEditNodeUrl(node.url || '');
                  if (!activeWindows.includes('editNode')) {
                    setActiveWindows([...activeWindows, 'editNode']);
                  }
                }
              }}
              className="px-3 py-1 bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/40 rounded text-xs font-bold transition-colors"
            >
              Edit
            </button>
            <button 
              onClick={async () => {
                const node = nodes.find(n => n.id === selectedNode);
                if (node) {
                  try {
                    const { expandNodeDeep } = await import('./services/geminiService');
                    const result = await expandNodeDeep(node.title, node.content || '');
                    
                    const newNodes = result.newConcepts.map((concept, index) => ({
                      id: `node-${Date.now()}-${index}`,
                      type: 'text' as const,
                      title: concept.name,
                      content: concept.description,
                      x: node.x + Math.cos((index / result.newConcepts.length) * Math.PI * 2) * 300,
                      y: node.y + Math.sin((index / result.newConcepts.length) * Math.PI * 2) * 300,
                    }));

                    const newConnections = newNodes.map(n => ({
                      id: `conn-${Date.now()}-${n.id}`,
                      source: node.id,
                      target: n.id
                    }));

                    setNodes(prev => [...prev, ...newNodes]);
                    setConnections(prev => [...prev, ...newConnections]);
                  } catch (e) {
                    console.error("Research failed", e);
                  }
                }
              }}
              className="px-3 py-1 bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/40 rounded text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Sparkles size={12} />
              Research
            </button>
            <button 
              onClick={() => setSelectedNode(null)}
              className="px-3 py-1 bg-white/10 text-white hover:bg-white/20 rounded text-xs font-bold transition-colors"
            >
              Deselect
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Menu */}
      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-4 z-30" data-purpose="ui-controls">
        {/* Tooltips/Helper */}
        <div className="hidden group-hover:block mb-2 mr-2 glass-morphism px-3 py-1.5 rounded text-[10px] text-gray-300">
          Right-click node to connect
        </div>
        
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="flex flex-col gap-2 mb-4"
            >
              <button onClick={() => toggleWindow('addNode')} className="glass-morphism w-12 h-12 rounded-full flex items-center justify-center hover:bg-neon-blue/20 hover:text-neon-blue transition-colors group relative">
                <Plus size={20} />
                <span className="absolute right-14 bg-space-900 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Add Node</span>
              </button>
              <button onClick={() => toggleWindow('search')} className="glass-morphism w-12 h-12 rounded-full flex items-center justify-center hover:bg-neon-purple/20 hover:text-neon-purple transition-colors group relative">
                <Search size={20} />
                <span className="absolute right-14 bg-space-900 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Search Universe</span>
              </button>
              <button onClick={() => toggleWindow('bookmarks')} className="glass-morphism w-12 h-12 rounded-full flex items-center justify-center hover:bg-yellow-500/20 hover:text-yellow-500 transition-colors group relative">
                <LinkIcon size={20} />
                <span className="absolute right-14 bg-space-900 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Bookmarks</span>
              </button>
              <button onClick={() => toggleWindow('settings')} className="glass-morphism w-12 h-12 rounded-full flex items-center justify-center hover:bg-neon-pink/20 hover:text-neon-pink transition-colors group relative">
                <Settings size={20} />
                <span className="absolute right-14 bg-space-900 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Environment Settings</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalist Menu Button */}
        <button 
          className={`group glass-morphism w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 relative overflow-hidden ${menuOpen ? 'rotate-90 bg-white/10' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="space-y-1 z-10">
            <div className="w-5 h-0.5 bg-white transition-all group-hover:w-6"></div>
            <div className="w-5 h-0.5 bg-white transition-all group-hover:translate-x-1"></div>
            <div className="w-3 h-0.5 bg-neon-blue transition-all group-hover:w-6"></div>
          </div>
          {/* Pulse effect */}
          <div className="absolute inset-0 bg-white/5 animate-ping opacity-20"></div>
        </button>
        
        {/* Zoom Controls */}
        <div className="glass-morphism flex flex-col rounded-full p-1 gap-1">
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-lg">+</button>
          <div className="h-px bg-white/10 mx-2"></div>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-lg">-</button>
        </div>
      </div>

      {/* User Status Indicator */}
      <div className="absolute bottom-10 left-10 flex items-center gap-3 glass-morphism px-4 py-2 rounded-full border-none shadow-2xl z-20">
        <div className="relative">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-40"></div>
        </div>
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">System Online</span>
      </div>

      {/* Draggable Windows */}
      <AnimatePresence>
        {activeWindows.includes('addNode') && (
          <DraggableWindow title="Add Node" onClose={() => toggleWindow('addNode')} defaultPosition={{ x: window.innerWidth - 400, y: window.innerHeight - 500 }}>
            <div className="space-y-4 w-64">
              <div className="flex gap-2">
                {(['text', 'image', 'video', 'code', 'gif', '3d'] as NodeType[]).map(type => (
                  <button 
                    key={type}
                    onClick={() => setNewNodeType(type)}
                    className={`p-2 rounded-lg flex-1 flex justify-center items-center transition-colors ${newNodeType === type ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    {type === 'text' && <Type size={16} />}
                    {type === 'image' && <ImageIcon size={16} />}
                    {type === 'video' && <Video size={16} />}
                    {type === 'code' && <Code size={16} />}
                    {type === 'gif' && <span className="text-[10px] font-bold">GIF</span>}
                    {type === '3d' && <span className="text-[10px] font-bold">3D</span>}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider">Title</label>
                <input 
                  type="text" 
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  className="w-full bg-space-800 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-neon-blue"
                  placeholder="Node Title..."
                />
              </div>

              {(newNodeType === 'image' || newNodeType === 'video' || newNodeType === 'gif' || newNodeType === '3d') && (
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">URL / Source</label>
                  <input 
                    type="text" 
                    value={newNodeUrl}
                    onChange={(e) => setNewNodeUrl(e.target.value)}
                    className="w-full bg-space-800 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-neon-blue"
                    placeholder="https://..."
                  />
                  {(newNodeType === 'image' || newNodeType === 'gif' || newNodeType === '3d') && (
                    <div className="mt-2">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Or Upload File</label>
                      <input 
                        type="file" 
                        accept={newNodeType === 'image' ? "image/*" : newNodeType === 'gif' ? "image/gif" : ".glb,.gltf,.obj"}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewNodeUrl(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                        className="w-full text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neon-blue/20 file:text-neon-blue hover:file:bg-neon-blue/30"
                      />
                    </div>
                  )}
                </div>
              )}

              {(newNodeType === 'text' || newNodeType === 'code') && (
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Content</label>
                  <textarea 
                    value={newNodeContent}
                    onChange={(e) => setNewNodeContent(e.target.value)}
                    className="w-full bg-space-800 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-neon-blue min-h-[100px] font-mono"
                    placeholder="Enter content..."
                  />
                </div>
              )}

              <button 
                onClick={handleAddNode}
                className="w-full py-2 bg-neon-blue text-space-900 font-bold rounded hover:brightness-110 transition-all"
              >
                Create Node
              </button>
            </div>
          </DraggableWindow>
        )}

        {activeWindows.includes('editNode') && selectedNode && (
          <DraggableWindow title="Edit Node" onClose={() => toggleWindow('editNode')} defaultPosition={{ x: window.innerWidth - 350, y: 100 }}>
            <div className="w-64 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider">Title</label>
                <input 
                  type="text" 
                  value={editNodeTitle}
                  onChange={(e) => setEditNodeTitle(e.target.value)}
                  className="w-full bg-space-800 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-neon-blue"
                />
              </div>

              {nodes.find(n => n.id === selectedNode)?.type !== 'core' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider">Content / URL</label>
                  <textarea 
                    value={editNodeContent}
                    onChange={(e) => setEditNodeContent(e.target.value)}
                    className="w-full bg-space-800 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-neon-blue min-h-[100px] font-mono"
                  />
                </div>
              )}

              <button 
                onClick={() => {
                  setNodes(nodes.map(n => n.id === selectedNode ? { ...n, title: editNodeTitle, content: editNodeContent, url: editNodeUrl } : n));
                  toggleWindow('editNode');
                }}
                className="w-full py-2 bg-neon-blue text-space-900 font-bold rounded hover:brightness-110 transition-all"
              >
                Save Changes
              </button>
            </div>
          </DraggableWindow>
        )}

        {activeWindows.includes('search') && (
          <DraggableWindow title="Search Universe" onClose={() => toggleWindow('search')} defaultPosition={{ x: 50, y: 100 }}>
            <div className="w-72 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-space-800 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-neon-purple"
                  placeholder="Search nodes, tags, content..."
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recent Searches</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 hover:bg-white/10 cursor-pointer">3D Models</span>
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 hover:bg-white/10 cursor-pointer">React Architecture</span>
                  <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 hover:bg-white/10 cursor-pointer">Inspiration</span>
                </div>
              </div>
            </div>
          </DraggableWindow>
        )}

        {activeWindows.includes('bookmarks') && (
          <DraggableWindow title="Bookmarks" onClose={() => toggleWindow('bookmarks')} defaultPosition={{ x: 50, y: 200 }}>
            <div className="w-64 space-y-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Saved Nodes</p>
              {nodes.slice(0, 3).map(node => (
                <div key={`bm-${node.id}`} className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded cursor-pointer transition-colors" onClick={() => {
                  setPan({ x: window.innerWidth / 2 - node.x, y: window.innerHeight / 2 - node.y });
                  setSelectedNode(node.id);
                }}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`w-2 h-2 rounded-full ${node.type === 'core' ? 'bg-neon-blue' : node.type === 'image' ? 'bg-neon-pink' : 'bg-neon-purple'}`}></div>
                    <span className="text-xs text-gray-300 truncate">{node.title}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase">{node.type}</span>
                </div>
              ))}
              <button className="w-full py-2 mt-2 border border-white/10 text-gray-400 text-xs rounded hover:bg-white/5 transition-colors">
                View All Bookmarks
              </button>
            </div>
          </DraggableWindow>
        )}

        {activeWindows.includes('settings') && (
          <DraggableWindow title="Environment Settings" onClose={() => toggleWindow('settings')} defaultPosition={{ x: 100, y: 200 }}>
            <div className="w-64 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Background Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  <div onClick={() => setBgTheme('bg-nebula-gradient')} className={`h-12 rounded bg-gradient-to-br from-space-700 to-space-900 border cursor-pointer ${bgTheme === 'bg-nebula-gradient' ? 'border-neon-blue' : 'border-transparent hover:border-white/30'}`}></div>
                  <div onClick={() => setBgTheme('bg-gradient-to-br from-purple-900 to-black')} className={`h-12 rounded bg-gradient-to-br from-purple-900 to-black border cursor-pointer ${bgTheme === 'bg-gradient-to-br from-purple-900 to-black' ? 'border-neon-blue' : 'border-transparent hover:border-white/30'}`}></div>
                  <div onClick={() => setBgTheme('bg-gradient-to-br from-emerald-900 to-black')} className={`h-12 rounded bg-gradient-to-br from-emerald-900 to-black border cursor-pointer ${bgTheme === 'bg-gradient-to-br from-emerald-900 to-black' ? 'border-neon-blue' : 'border-transparent hover:border-white/30'}`}></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">3D Orientation</p>
                <div className="flex items-center justify-between bg-space-800 p-2 rounded">
                  <span className="text-xs text-gray-300">Enable 3D Perspective</span>
                  <div 
                    onClick={() => setIs3D(!is3D)}
                    className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${is3D ? 'bg-neon-pink' : 'bg-gray-600'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${is3D ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </DraggableWindow>
        )}
      </AnimatePresence>
    </main>
  );
}
