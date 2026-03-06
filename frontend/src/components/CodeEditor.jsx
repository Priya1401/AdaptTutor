import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, onChange }) {
    const editorRef = useRef(null);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117]">
            <div className="bg-[#161b22] px-4 py-2 flex items-center border-b border-[#30363d]">
                <div className="flex gap-2">
                    <div className="text-sm font-semibold text-[#c9d1d9] bg-[#21262d] px-3 py-1 rounded border border-[#30363d]">main.py</div>
                </div>
            </div>
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={code}
                    onChange={onChange}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        lineNumbersMinChars: 3,
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        folding: true,
                    }}
                />
            </div>
        </div>
    );
}
