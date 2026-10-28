import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Brush, Check, ChevronDown, CircleHelp, Copy, Download,
  Eye, EyeOff, FilePlus2, FolderOpen, Grid2X2, Layers, Lock, MousePointer2,
  PaintBucket, Redo2, Save, Search, Settings2, Square, Undo2, ZoomIn, ZoomOut, Eraser
} from "lucide-react";
import { createProject, DEFAULT_PALETTE, exportProject, exportTiledJson, importProject, type TileMapProject, type Tool } from "./model";

const toolItems: { id: Tool; label: string; icon: typeof Brush; shortcut: string }[] = [
  { id: "select", label: "Select", icon: MousePointer2, shortcut: "V" },
  { id: "paint", label: "Paint", icon: Brush, shortcut: "B" },
  { id: "erase", label: "Erase", icon: Eraser, shortcut: "E" },
  { id: "fill", label: "Fill", icon: PaintBucket, shortcut: "G" },
  { id: "rect", label: "Rectangle", icon: Square, shortcut: "U" },
  { id: "eyedropper", label: "Eyedropper", icon: Search, shortcut: "I" }
];
type Snapshot = TileMapProject;
export default function App() {
  const [project, setProject] = useState<TileMapProject>(() => {
    try { const raw = localStorage.getItem("tileforge.project"); return raw ? importProject(raw) : createProject(); }
    catch { return createProject(); }
  });
  const [activeLayer, setActiveLayer] = useState(0);
  const [selectedTile, setSelectedTile] = useState(2);
  const [tool, setTool] = useState<Tool>("paint");
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);
  const [panel, setPanel] = useState<"layers" | "tiles">("layers");
  const [toast, setToast] = useState("");
  const [mapName, setMapName] = useState(project.name);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const rectStart = useRef<{x:number;y:number}|null>(null);
  const palette = project.palette.length ? project.palette : DEFAULT_PALETTE;
  const layer = project.layers[activeLayer] ?? project.layers[0];
  const cellCount = project.width * project.height;

  const announce = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const record = useCallback((next: TileMapProject) => {
    setUndoStack(s => [...s.slice(-49), project]);
    setRedoStack([]);
    setProject(next); setDirty(true);
  }, [project]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const unit = project.tileWidth;
    canvas.width = project.width * unit;
    canvas.height = project.height * project.tileHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#20252b"; ctx.fillRect(0,0,canvas.width,canvas.height);
    project.layers.forEach((lay, layerIndex) => {
      if (!lay.visible) return;
      lay.data.forEach((tile, i) => {
        if (tile === null) return;
        const x = (i % project.width) * unit, y = Math.floor(i / project.width) * project.tileHeight;
        ctx.fillStyle = palette[tile] ?? "#ff00ff";
        ctx.fillRect(x, y, unit, project.tileHeight);
        ctx.fillStyle = "rgba(255,255,255,.10)";
        ctx.fillRect(x + 3, y + 3, Math.max(0, unit - 6), Math.max(0, project.tileHeight * .18));
        if ((tile + i) % 5 === 0) {
          ctx.fillStyle = "rgba(0,0,0,.12)";
          ctx.fillRect(x + unit * .58, y + project.tileHeight * .55, unit * .18, project.tileHeight * .18);
        }
      });
    });
    if (showGrid) {
      ctx.strokeStyle = "rgba(8, 12, 16, .34)"; ctx.lineWidth = 1;
      for (let x=0; x<=project.width; x++) { ctx.beginPath(); ctx.moveTo(x*unit+.5,0); ctx.lineTo(x*unit+.5,canvas.height); ctx.stroke(); }
      for (let y=0; y<=project.height; y++) { ctx.beginPath(); ctx.moveTo(0,y*project.tileHeight+.5); ctx.lineTo(canvas.width,y*project.tileHeight+.5); ctx.stroke(); }
    }
  }, [project, palette, showGrid]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);
  useEffect(() => { try { localStorage.setItem("tileforge.project", exportProject(project)); } catch { /* Storage can be unavailable. */ } }, [project]);

  const getCell = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const bounds = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - bounds.left) * (canvas.width / bounds.width) / project.tileWidth);
    const y = Math.floor((event.clientY - bounds.top) * (canvas.height / bounds.height) / project.tileHeight);
    return { x: Math.max(0,Math.min(project.width-1,x)), y: Math.max(0,Math.min(project.height-1,y)) };
  };
  const paintAt = (x:number,y:number, selectedTool = tool) => {
    if (!layer || layer.locked) return;
    if (selectedTool === "eyedropper") {
      const tile = layer.data[y*project.width+x]; if (tile !== null) setSelectedTile(tile); return;
    }
    const next = structuredClone(project);
    const data = next.layers[activeLayer].data;
    if (selectedTool === "fill") {
      const target = data[y*project.width+x], replacement = selectedTile;
      if (target === replacement) return;
      const queue = [[x,y]];
      const seen = new Set<number>();
      while (queue.length) {
        const [cx,cy] = queue.pop()!;
        const index = cy*project.width+cx;
        if (cx<0 || cy<0 || cx>=project.width || cy>=project.height || seen.has(index) || data[index] !== target) continue;
        seen.add(index); data[index] = replacement;
        queue.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
      }
    } else if (selectedTool === "rect" && rectStart.current) {
      const a = rectStart.current;
      for (let yy=Math.min(a.y,y); yy<=Math.max(a.y,y); yy++)
        for (let xx=Math.min(a.x,x); xx<=Math.max(a.x,x); xx++)
          data[yy*project.width+xx] = selectedTile;
    } else {
      data[y*project.width+x] = selectedTool === "erase" ? null : selectedTile;
    }
    setProject(next); setDirty(true);
  };
  const beginPaint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "select") return;
    const {x,y}=getCell(event);
    if (tool === "rect") { rectStart.current={x,y}; drawing.current=true; paintAt(x,y,"paint"); return; }
    drawing.current=true; paintAt(x,y);
  };
  const continuePaint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current || tool === "rect") return;
    const {x,y}=getCell(event); paintAt(x,y);
  };
  const endPaint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "rect" && rectStart.current) {
      const {x,y}=getCell(event);
      const a=rectStart.current;
      const next=structuredClone(project);
      for(let yy=Math.min(a.y,y);yy<=Math.max(a.y,y);yy++)
        for(let xx=Math.min(a.x,x);xx<=Math.max(a.x,x);xx++)
          next.layers[activeLayer].data[yy*project.width+xx]=selectedTile;
      record(next);
    } else if (drawing.current) {
      setUndoStack(s=>[...s.slice(-49),project]); setRedoStack([]);
    }
    drawing.current=false; rectStart.current=null;
  };
  const undo = () => {
    if (!undoStack.length) return;
    const previous=undoStack[undoStack.length-1];
    setRedoStack(s=>[...s,project]); setUndoStack(s=>s.slice(0,-1)); setProject(previous); setDirty(true);
  };
  const redo = () => {
    if (!redoStack.length) return;
    const next=redoStack[redoStack.length-1];
    setUndoStack(s=>[...s,project]); setRedoStack(s=>s.slice(0,-1)); setProject(next); setDirty(true);
  };
  const download = (name:string, text:string, type="application/json") => {
    const url=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
  };
  const saveNative = () => { download((project.name||"map").replace(/[^a-z0-9-_]/gi,"-")+".tileforge.json",exportProject(project)); setDirty(false); announce("Project exported"); };
  const saveTiled = () => { download((project.name||"map").replace(/[^a-z0-9-_]/gi,"-")+".tiled.json",JSON.stringify(exportTiledJson(project),null,2)); announce("Tiled-style JSON exported"); };
  const newMap = () => { if (dirty && !confirm("Discard unsaved changes?")) return; const next=createProject(); record(next); setMapName(next.name); setUndoStack([]); setRedoStack([]); };
  const openFile = () => fileRef.current?.click();
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0]; if(!file) return;
    try { const next=importProject(await file.text()); record(next); setMapName(next.name); announce("Project loaded"); }
    catch (error) { alert(error instanceof Error ? error.message : "Unable to load project"); }
    event.target.value="";
  };
  const addLayer = () => {
    const next=structuredClone(project); const id=`layer-${Date.now()}`;
    next.layers.push({id,name:`Layer ${next.layers.length+1}`,visible:true,locked:false,data:Array.from({length:cellCount},()=>null)});
    record(next); setActiveLayer(next.layers.length-1); announce("Layer added");
  };
  const updateLayer = (index:number, patch:Partial<TileMapProject["layers"][number]>) => {
    const next=structuredClone(project); next.layers[index]={...next.layers[index],...patch}; record(next);
  };
  const reorderLayer = (index:number, delta:number) => {
    const target=index+delta;if(target<0||target>=project.layers.length)return;
    const next=structuredClone(project);[next.layers[index],next.layers[target]]=[next.layers[target],next.layers[index]];
    record(next); setActiveLayer(target);
  };
  const resizeMap = (width:number,height:number) => {
    width=Math.max(4,Math.min(128,Math.round(width)));height=Math.max(4,Math.min(128,Math.round(height)));
    const next=structuredClone(project);
    next.layers=next.layers.map(lay=>({...lay,data:Array.from({length:width*height},(_,i)=>{
      const x=i%width,y=Math.floor(i/width);return x<project.width&&y<project.height?lay.data[y*project.width+x]:null;
    })}));
    next.width=width;next.height=height;record(next);
  };
  useEffect(() => {
    const onKey = (event:KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement)?.tagName ?? "")) return;
      const key=event.key.toLowerCase();
      if ((event.metaKey||event.ctrlKey)&&key==="z"){event.preventDefault();undo();}
      else if ((event.metaKey||event.ctrlKey)&&(key==="y"||(event.shiftKey&&key==="z"))){event.preventDefault();redo();}
      else if ((event.metaKey||event.ctrlKey)&&key==="s"){event.preventDefault();saveNative();}
      else {const match=toolItems.find(item=>item.shortcut.toLowerCase()===key);if(match)setTool(match.id);}
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  });
  const mapSummary=useMemo(()=>`${project.width} × ${project.height} tiles · ${project.tileWidth} × ${project.tileHeight} px`,[project]);
  const Icon = ({ icon: I }: {icon: typeof Brush}) => <I size={16}/>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Grid2X2 size={21}/></div><div><strong>TileForge</strong><span>MAP EDITOR</span></div></div>
      <div className="menu"><button onClick={newMap}><FilePlus2 size={15}/> New</button><button onClick={openFile}><FolderOpen size={15}/> Open</button><button onClick={saveNative}><Save size={15}/> Save</button><button onClick={saveTiled}><Download size={15}/> Export Tiled JSON</button></div>
      <div className="top-actions"><span className={dirty?"dirty-dot":"saved-dot"}/><span>{dirty?"Unsaved changes":"Saved locally"}</span><button className="icon-button" title="Help" onClick={()=>announce("Shortcuts: B paint, E erase, G fill, U rectangle, I eyedropper, Ctrl/Cmd+Z undo")}><CircleHelp size={18}/></button></div>
    </header>
    <div className="projectbar"><span className="breadcrumb">Projects <b>/</b> <input aria-label="Map name" value={mapName} onChange={e=>{setMapName(e.target.value);setProject(p=>({...p,name:e.target.value}));setDirty(true);}} onBlur={()=>setProject(p=>({...p,name:mapName}))}/></span><span className="project-meta">{mapSummary}</span></div>
    <div className="workspace">
      <aside className="left-sidebar">
        <div className="side-tabs"><button className={panel==="layers"?"active":""} onClick={()=>setPanel("layers")}><Layers size={15}/> Layers</button><button className={panel==="tiles"?"active":""} onClick={()=>setPanel("tiles")}><Grid2X2 size={15}/> Tiles</button></div>
        {panel==="layers"? <div className="panel-content">
          <div className="panel-heading"><span>MAP LAYERS</span><button onClick={addLayer} title="Add layer">+</button></div>
          {[...project.layers].map((lay,index)=>({lay,index})).reverse().map(({lay,index})=><div key={lay.id} className={activeLayer===index?"layer-row selected":"layer-row"} onClick={()=>setActiveLayer(index)}>
            <button className="mini-icon" title={lay.visible?"Hide layer":"Show layer"} onClick={e=>{e.stopPropagation();updateLayer(index,{visible:!lay.visible});}}>{lay.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button>
            <span className="layer-glyph"><Grid2X2 size={15}/></span>
            <span className="layer-name">{lay.name}</span><button className="mini-icon" title={lay.locked?"Unlock":"Lock"} onClick={e=>{e.stopPropagation();updateLayer(index,{locked:!lay.locked});}}>{lay.locked?<Lock size={13}/>:<span className="unlock-symbol">◇</span>}</button>
          </div>)}
          <div className="layer-controls"><button onClick={()=>reorderLayer(activeLayer,-1)} title="Move layer down"><ArrowDown size={14}/></button><button onClick={()=>reorderLayer(activeLayer,1)} title="Move layer up"><ArrowUp size={14}/></button><button onClick={()=>{if(project.layers.length<2)return;const next=structuredClone(project);next.layers.splice(activeLayer,1);record(next);setActiveLayer(Math.max(0,activeLayer-1));}} title="Delete selected layer">−</button></div>
          {layer&&<div className="layer-properties"><label>Layer name<input value={layer.name} onChange={e=>updateLayer(activeLayer,{name:e.target.value})}/></label><p>Type <span>Tile Layer</span></p><p>Cells <span>{layer.data.filter(t=>t!==null).length}</span></p></div>}
        </div>:<div className="panel-content">
          <div className="panel-heading"><span>COLOR TILESET</span><span className="tiny-count">{palette.length} tiles</span></div>
          <p className="muted-note">Starter palette · click a tile to paint with it.</p>
          <div className="palette-grid">{palette.map((color,index)=><button key={color+index} aria-label={`Tile ${index+1}`} title={`Tile ${index+1}`} className={selectedTile===index?"palette-tile chosen":"palette-tile"} style={{backgroundColor:color}} onClick={()=>{setSelectedTile(index);setTool("paint");}}><span>{index+1}</span></button>)}</div>
          <div className="tile-properties"><b>Selected tile</b><div className="selected-preview" style={{backgroundColor:palette[selectedTile]}}/><span>Tile ID: {selectedTile}</span><span>Tile size: {project.tileWidth}×{project.tileHeight}</span><p className="muted-note">Image tileset slicing is planned.</p></div>
        </div>}
      </aside>
      <main className="editor">
        <div className="toolbar">
          <div className="tool-group">{toolItems.map(item=><button key={item.id} className={tool===item.id?"tool active":"tool"} title={`${item.label} (${item.shortcut})`} aria-label={item.label} onClick={()=>setTool(item.id)}><Icon icon={item.icon}/></button>)}</div>
          <div className="tool-divider"/>
          <button className="tool" title="Undo (Ctrl/Cmd+Z)" disabled={!undoStack.length} onClick={undo}><Undo2 size={16}/></button><button className="tool" title="Redo (Ctrl/Cmd+Y)" disabled={!redoStack.length} onClick={redo}><Redo2 size={16}/></button>
          <div className="toolbar-spacer"/>
          <button className={showGrid?"toggle on":"toggle"} onClick={()=>setShowGrid(v=>!v)}><Grid2X2 size={14}/> Grid</button>
          <button className="tool" onClick={()=>setZoom(z=>Math.max(.5,z-.1))} title="Zoom out"><ZoomOut size={16}/></button><span className="zoom-label">{Math.round(zoom*100)}%</span><button className="tool" onClick={()=>setZoom(z=>Math.min(2,z+.1))} title="Zoom in"><ZoomIn size={16}/></button>
        </div>
        <div className="canvas-workspace"><div className="canvas-label"><span><span className="live-dot"/> EDITOR CANVAS</span><span>{toolItems.find(t=>t.id===tool)?.label} tool</span></div>
          <div className="canvas-scroller"><div className="canvas-frame" style={{width:project.width*project.tileWidth*zoom,height:project.height*project.tileHeight*zoom}}><canvas ref={canvasRef} aria-label="Editable tile map canvas" style={{width:"100%",height:"100%",imageRendering:"pixelated",cursor:tool==="select"?"default":"crosshair"}} onMouseDown={beginPaint} onMouseMove={continuePaint} onMouseUp={endPaint} onMouseLeave={()=>{if(drawing.current){drawing.current=false;rectStart.current=null;}}}/></div></div>
        </div>
        <div className="statusbar"><span><Check size={13}/> {dirty?"Modified":"Ready"}</span><span>{mapSummary}</span><span>Layer: {layer?.name??"None"}</span><span>Tile: {selectedTile}</span></div>
      </main>
      <aside className="right-sidebar"><div className="right-heading"><Settings2 size={16}/> Inspector</div>
        <section className="inspector-section"><h3>MAP SETTINGS</h3><label>Map width <input aria-label="Map width" type="number" min={4} max={128} value={project.width} onChange={e=>resizeMap(Number(e.target.value),project.height)}/></label><label>Map height <input aria-label="Map height" type="number" min={4} max={128} value={project.height} onChange={e=>resizeMap(project.width,Number(e.target.value))}/></label><div className="settings-two"><label>Tile width<input aria-label="Tile width" type="number" min={8} max={128} value={project.tileWidth} onChange={e=>{const n=structuredClone(project);n.tileWidth=Math.max(8,Math.min(128,Number(e.target.value)||32));record(n);}}/></label><label>Tile height<input aria-label="Tile height" type="number" min={8} max={128} value={project.tileHeight} onChange={e=>{const n=structuredClone(project);n.tileHeight=Math.max(8,Math.min(128,Number(e.target.value)||32));record(n);}}/></label></div><label>Orientation<div className="select-like">Orthogonal <ChevronDown size={14}/></div></label></section>
        <section className="inspector-section"><h3>SELECTED TILE</h3><div className="inspector-tile"><div style={{backgroundColor:palette[selectedTile]}}/><div><b>Tile {selectedTile}</b><span>Palette entry</span></div></div><div className="property-line"><span>Color</span><code>{palette[selectedTile]}</code></div><div className="property-line"><span>Tile index</span><code>{selectedTile}</code></div></section>
        <section className="inspector-section"><h3>PROJECT</h3><div className="property-line"><span>Format</span><code>TileForge v1</code></div><div className="property-line"><span>Non-empty cells</span><code>{layer?.data.filter(t=>t!==null).length??0}</code></div><div className="property-line"><span>Total cells</span><code>{cellCount}</code></div><button className="full-button" onClick={saveTiled}><Download size={14}/> Export Tiled-style JSON</button><button className="full-button secondary" onClick={saveNative}><Save size={14}/> Download project</button></section>
        <section className="hint-card"><b>Quick tip</b><span>Choose a tile in the Tiles panel, then click or drag on the map to paint.</span><span>Press <kbd>B</kbd> to paint, <kbd>E</kbd> to erase, or <kbd>G</kbd> to fill.</span></section>
      </aside>
    </div>
    <input ref={fileRef} type="file" accept=".json,.tileforge.json,application/json" hidden onChange={importFile}/>
    {toast&&<div role="status" className="toast">{toast}</div>}
  </div>;
}