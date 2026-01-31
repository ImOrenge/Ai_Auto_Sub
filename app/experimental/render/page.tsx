"use client";

import { useState, useRef, useEffect } from "react";
import { ClientRenderer } from "@/lib/renderer/ClientRenderer";

export default function RenderPOCPage() {
    const [log, setLog] = useState<string[]>([]);
    const [status, setStatus] = useState("Idle");
    const [mp4boxLib, setMp4boxLib] = useState<any>(null);
    const rendererRef = useRef<ClientRenderer | null>(null);

    useEffect(() => {
        import("mp4box").then(mod => {
            setMp4boxLib((mod as any).default || mod);
            addLog("MP4Box library loaded.");
        });
    }, []);

    const addLog = (msg: string) => {
        setLog((prev) => [...prev, `${new Date().toISOString().split("T")[1].slice(0, -1)}: ${msg}`]);
        console.log(msg);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !mp4boxLib) return;

        addLog(`File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        try {
            if (rendererRef.current) {
                rendererRef.current.cancel();
            }

            const renderer = new ClientRenderer(file, {
                onStatus: (s) => {
                    setStatus(s);
                    addLog(`[Renderer] ${s}`);
                },
                onProgress: (p) => setStatus(`Rendering ${(p * 100).toFixed(1)}%`)
            }, mp4boxLib);

            rendererRef.current = renderer;
            addLog("Renderer initialized.");
            setStatus("Ready to Start");

        } catch (err: any) {
            addLog(`Error: ${err.message}`);
        }
    };

    const startRender = async () => {
        if (!rendererRef.current) return;

        try {
            addLog("Starting render process...");
            const outputMuxer = await rendererRef.current.start();

            addLog("Render completed. Saving file...");
            setStatus("Saving...");
            outputMuxer.save("rendered_output.mp4");
            setStatus("Finished");

        } catch (e: any) {
            addLog(`Render Failed: ${e.message}`);
            setStatus("Error");
            console.error(e);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Client-Side Rendering POC (Class Based)</h1>
            <div className="flex justify-between items-center">
                <div>Import local video file to test ClientRenderer class.</div>
                <div className="space-x-4">
                    <button
                        onClick={startRender}
                        disabled={status !== "Ready to Start"}
                        className={`px-4 py-2 rounded font-bold text-white ${status === "Ready to Start" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"}`}
                    >
                        Start Render
                    </button>
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border rounded-lg bg-gray-900 text-green-400 font-mono text-xs overflow-y-auto h-[400px]">
                    <h2 className="font-semibold text-gray-400 mb-2 sticky top-0 bg-gray-900">Logs</h2>
                    {log.map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>
            </div>

            <div className="text-sm font-medium">Status: {status}</div>
        </div>
    );
}
