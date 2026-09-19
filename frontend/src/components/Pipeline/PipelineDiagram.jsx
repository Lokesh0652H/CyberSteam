import React from 'react';
import PipelineNode from './PipelineNode';
import { Database, Server, Cpu, Globe, Zap, Radio } from 'lucide-react';

const PipelineDiagram = ({ nodes }) => {
  // Hardcoded layout for the pipeline just for visual structure
  // In a real app, this would be computed or use a library like react-flow
  
  const getNode = (id) => nodes?.find(n => n.id === id) || { name: id, status: 'DISCONNECTED', metrics: [] };
  
  return (
    <div style={{ width: '100%', overflowX: 'auto', padding: '40px 20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-primary)', position: 'relative', minHeight: '500px' }}>
      
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .flow-line {
          stroke: var(--severity-info);
          stroke-width: 2;
          fill: none;
          stroke-dasharray: 5, 5;
          animation: dash 1s linear infinite;
        }
        .flow-line.disconnected {
          stroke: var(--severity-critical);
          animation: none;
        }
        .pipeline-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-width: 800px;
          gap: 40px;
          position: relative;
        }
        .col {
          display: flex;
          flex-direction: column;
          gap: 60px;
          z-index: 2;
        }
      `}</style>

      {/* SVG Background for lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
        {/* Simplified lines using absolute percentages (approximate for the hardcoded layout) */}
        <path d="M 280 250 L 400 250" className={`flow-line ${getNode('kafka').status === 'DISCONNECTED' ? 'disconnected' : ''}`} />
        <path d="M 640 250 L 760 160" className={`flow-line ${getNode('spark').status === 'DISCONNECTED' ? 'disconnected' : ''}`} />
        <path d="M 640 250 L 760 340" className={`flow-line ${getNode('spark').status === 'DISCONNECTED' ? 'disconnected' : ''}`} />
      </svg>

      <div className="pipeline-container">
        <div className="col">
          <PipelineNode icon={Globe} {...getNode('generator')} />
        </div>
        
        <div className="col">
          <PipelineNode icon={Radio} {...getNode('kafka')} />
        </div>
        
        <div className="col">
          <PipelineNode icon={Cpu} {...getNode('spark')} />
        </div>
        
        <div className="col">
          <PipelineNode icon={Database} {...getNode('postgres')} />
          <PipelineNode icon={Server} {...getNode('hdfs')} />
        </div>
        
        <div className="col">
          <PipelineNode icon={Zap} {...getNode('fastapi')} />
        </div>
      </div>
    </div>
  );
};

export default PipelineDiagram;
