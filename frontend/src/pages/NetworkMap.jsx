import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import api from "../lib/api";
import { Panel } from "../components/common";

const SEV_COLOR = { critical: "#EF4444", high: "#F97316", medium: "#F59E0B", low: "#10B981", info: "#38BDF8" };

export default function NetworkMap() {
  const svgRef = useRef(null);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = () => api.get("/network/graph").then((r) => setGraph(r.data)).catch(() => {});
    load(); const id = setInterval(load, 6000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = svgRef.current.clientWidth || 900;
    const height = 520;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    if (graph.nodes.length === 0) return;

    const nodes = graph.nodes.map((d) => ({ ...d }));
    const links = graph.links.map((d) => ({ ...d }));

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(90))
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(28));

    const g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([0.3, 3]).on("zoom", (e) => g.attr("transform", e.transform)));

    const link = g.append("g").attr("stroke-opacity", 0.5)
      .selectAll("line").data(links).join("line")
      .attr("stroke", (d) => SEV_COLOR[d.severity] || "#334155")
      .attr("stroke-width", 1.5);

    const node = g.append("g").selectAll("g").data(nodes).join("g")
      .attr("data-testid", (d) => `network-node-${d.id}`)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelected(d))
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append("circle")
      .attr("r", (d) => (d.type === "target" ? 11 : 8))
      .attr("fill", (d) => (d.type === "target" ? "#0F1522" : SEV_COLOR[d.severity] || "#38BDF8"))
      .attr("stroke", (d) => (d.type === "target" ? "#06B6D4" : "#0B0F16"))
      .attr("stroke-width", 2);

    node.append("text").text((d) => d.id)
      .attr("x", 14).attr("y", 4).attr("fill", "#94A3B8")
      .style("font-size", "9px").style("font-family", "JetBrains Mono, monospace");

    sim.on("tick", () => {
      link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
    return () => sim.stop();
  }, [graph]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <Panel title="Network Attack Topology (D3 Force Graph)" className="lg:col-span-9"
        right={<span className="text-[10px] font-mono text-slate-500">drag nodes · scroll to zoom · click to inspect</span>}>
        <div className="bg-[#080B10] border border-[#141C2E] rounded-sm overflow-hidden">
          <svg ref={svgRef} width="100%" height="520" />
        </div>
        {graph.nodes.length === 0 && <div className="text-center text-slate-500 font-mono text-sm mt-2">No attack edges yet — trigger a scenario to populate the map.</div>}
      </Panel>

      <Panel title="Node Inspector" className="lg:col-span-3">
        {selected ? (
          <div className="font-mono text-xs space-y-2">
            <div><span className="text-slate-500 uppercase text-[10px]">Node</span><div className="text-cyan-300 break-all">{selected.id}</div></div>
            <div><span className="text-slate-500 uppercase text-[10px]">Type</span><div className="text-slate-200">{selected.type}</div></div>
            <div><span className="text-slate-500 uppercase text-[10px]">Severity</span><div style={{ color: SEV_COLOR[selected.severity] }}>{selected.severity}</div></div>
          </div>
        ) : <div className="text-slate-500 text-sm font-mono">Click a node to view metadata.</div>}
        <div className="mt-4 pt-3 border-t border-[#1E293B] text-[10px] font-mono text-slate-500 space-y-1">
          <div><span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" /> Target host</div>
          <div><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> Attacker source</div>
          <div>{graph.nodes.length} nodes · {graph.links.length} edges</div>
        </div>
      </Panel>
    </div>
  );
}
