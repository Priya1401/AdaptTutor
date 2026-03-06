import React from 'react';

export default function ProblemDescription({ problem }) {
    if (!problem) return (
        <div className="flex flex-col h-full bg-[#161b22] border-r border-[#30363d] overflow-y-auto w-1/4 p-4 text-[#8b949e]">
            Loading problem...
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#161b22] border-r border-[#30363d] overflow-y-auto w-1/4">
            <div className="p-4 border-b border-[#30363d]">
                <h2 className="text-xl font-bold text-white">Problem Description</h2>
            </div>
            <div className="p-4 space-y-4 text-sm text-[#8b949e]">
                <div>
                    <h3 className="text-white font-semibold mb-2">{problem.title}</h3>
                </div>
                {/* 
                  Safely rendering HTML description from the database.
                  In production, you'd want to sanitize this (e.g., DOMPurify)
                */}
                <div
                    className="prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: problem.description }}
                />
            </div>
        </div>
    );
}
