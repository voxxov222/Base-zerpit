import React from 'react';
import { motion } from 'framer-motion';

export type NodeType = 'core' | 'image' | 'video' | 'gif' | 'code' | 'text' | '3d';

export interface NodeData {
  id: string;
  type: NodeType;
  title: string;
  content?: string;
  url?: string;
  x: number;
  y: number;
  z?: number;
}

interface NodeElementProps {
  node: NodeData;
  isSelected: boolean;
  isMatch?: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onConnectStart: (id: string, e: React.MouseEvent) => void;
  is3D?: boolean;
  orbit?: { x: number, z: number };
}

export function NodeElement({ node, isSelected, isMatch, onSelect, onDragEnd, onConnectStart, is3D, orbit }: NodeElementProps) {
  const handleDragEnd = (e: any, info: any) => {
    onDragEnd(node.id, node.x + info.offset.x, node.y + info.offset.y);
  };

  const renderContent = () => {
    switch (node.type) {
      case 'core':
        return (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple p-1 shadow-[0_0_50px_rgba(0,210,255,0.4)] transition-transform duration-500 hover:scale-110">
            <div className="w-full h-full rounded-full bg-space-900 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold tracking-widest text-neon-blue uppercase text-center px-2">{node.title}</span>
            </div>
          </div>
        );
      case 'image':
        return (
          <div className={`glass-morphism rounded-xl p-2 w-48 shadow-lg transition-all hover:border-neon-blue ${isSelected ? 'selected-node' : ''}`}>
            {node.url ? (
              <img alt={node.title} className="rounded-lg w-full aspect-video object-cover mb-2 pointer-events-none" src={node.url} />
            ) : (
              <div className="rounded-lg w-full aspect-video bg-white/5 mb-2 flex items-center justify-center text-gray-500 text-xs">No Image</div>
            )}
            <p className="text-[10px] text-gray-400 font-medium px-1 truncate">{node.title}</p>
          </div>
        );
      case 'video':
        return (
          <div className={`glass-morphism rounded-xl p-2 w-56 shadow-lg transition-all hover:border-neon-purple ${isSelected ? 'selected-node' : ''}`}>
            <div className="relative pointer-events-none">
              {node.url ? (
                <img alt={node.title} className="rounded-lg w-full aspect-video object-cover" src={node.url} />
              ) : (
                <div className="rounded-lg w-full aspect-video bg-white/5 flex items-center justify-center text-gray-500 text-xs">No Video</div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
            <div className="mt-2 px-1 pointer-events-none">
              <p className="text-[10px] text-white font-bold truncate">{node.title}</p>
              <p className="text-[8px] text-gray-500">YouTube</p>
            </div>
          </div>
        );
      case 'gif':
        return (
          <div className={`w-40 h-40 glass-morphism rounded-full p-1 flex items-center justify-center text-center border-dashed border-neon-pink/50 transition-all ${isSelected ? 'selected-node' : ''}`}>
            <div className="space-y-1 pointer-events-none">
              <div className="text-neon-pink text-xl font-bold">GIF</div>
              <p className="text-[9px] leading-tight text-gray-300 px-2">{node.title}</p>
            </div>
          </div>
        );
      case 'code':
        return (
          <div className={`glass-morphism w-40 h-auto min-h-[8rem] flex flex-col p-3 border-l-4 border-l-neon-blue transition-all ${isSelected ? 'selected-node' : ''}`}>
            <div className="flex gap-1 mb-2 pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            </div>
            <p className="text-[10px] font-mono text-neon-blue leading-relaxed pointer-events-none whitespace-pre-wrap break-words">
              {node.content || '// No code provided'}
            </p>
          </div>
        );
      case '3d':
        return (
          <div className={`glass-morphism rounded-xl p-2 w-48 shadow-lg transition-all hover:border-emerald-400 ${isSelected ? 'selected-node' : ''}`}>
            <div className="rounded-lg w-full aspect-square bg-space-800 border border-white/10 mb-2 flex items-center justify-center relative overflow-hidden">
              <div className="w-16 h-16 border-4 border-emerald-500/50 rounded-lg transform rotate-45 animate-spin" style={{ animationDuration: '8s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-xs bg-space-900/80 px-2 py-1 rounded">3D Model</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium px-1 truncate">{node.title}</p>
          </div>
        );
      case 'text':
      default:
        return (
          <div className={`glass-morphism rounded-xl p-4 w-48 shadow-lg transition-all hover:border-white/30 ${isSelected ? 'selected-node' : ''}`}>
            <h3 className="text-sm font-bold text-white mb-2 truncate">{node.title}</h3>
            <p className="text-[10px] text-gray-400 line-clamp-4">{node.content}</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ x: node.x, y: node.y, z: node.z || 0 }}
      animate={{ 
        x: node.x, 
        y: node.y, 
        z: node.z || 0,
        rotateX: is3D && orbit ? -orbit.x : 0,
        rotateZ: is3D && orbit ? -orbit.z : 0
      }}
      className={`absolute cursor-grab active:cursor-grabbing ${isMatch ? 'ring-4 ring-neon-purple rounded-xl shadow-[0_0_30px_rgba(157,80,187,0.6)]' : ''}`}
      style={{ zIndex: isSelected || isMatch ? 50 : 10, transformStyle: 'preserve-3d' }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onConnectStart(node.id, e);
      }}
    >
      {renderContent()}
    </motion.div>
  );
}
