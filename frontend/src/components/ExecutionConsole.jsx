import React from 'react';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ExecutionConsole({
    output,
    error,
    isExecuting,
    onRun,
    onSubmit
}) {
    return (
        <div className="h-64 bg-[#161b22] border-t border-[#30363d] flex flex-col">
            <div className="p-2 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]">
                <h3 className="text-sm font-semibold text-white px-2">Console</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onRun}
                        disabled={isExecuting}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded border border-[#30363d] transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                        {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        Run
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isExecuting}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                        {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Submit
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap">
                {error ? (
                    <div className="text-red-400 flex flex-col gap-2">
                        <div className="flex items-center gap-2 font-semibold">
                            <AlertCircle size={16} /> Runtime Error
                        </div>
                        <div className="bg-red-950/30 p-3 rounded border border-red-900/50">
                            {error}
                        </div>
                    </div>
                ) : output ? (
                    <div className="text-[#c9d1d9]">
                        <div className="text-[#8b949e] mb-2 font-semibold">Output:</div>
                        {output}
                    </div>
                ) : (
                    <div className="text-[#8b949e] italic h-full flex flex-col items-center justify-center">
                        Run your code to see the output here.
                    </div>
                )}
            </div>
        </div>
    );
}
