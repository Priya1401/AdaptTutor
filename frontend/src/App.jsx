import React, { useState } from 'react'
import axios from 'axios'
import ProblemDescription from './components/ProblemDescription'
import TutorChat from './components/TutorChat'
import CodeEditor from './components/CodeEditor'
import ExecutionConsole from './components/ExecutionConsole'
import { useTelemetry } from './hooks/useTelemetry'

function App() {
  const [code, setCode] = useState('def twoSum(nums, target):\n    # Write your code here\n    pass');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [condition, setCondition] = useState('adaptive'); // 'adaptive' or 'static'
  const { trackKeystroke, trackAction } = useTelemetry(1); // Mock Session ID = 1

  const handleCodeChange = (newCode) => {
    if (code.length - newCode.length > 20) {
      trackKeystroke({ isMassiveDeletion: true, charsDeleted: code.length - newCode.length });
    } else {
      trackKeystroke();
    }
    setCode(newCode || '');
  };


  const handleRun = async () => {
    setIsExecuting(true);
    trackAction('run_click');
    try {
      const resp = await axios.post('http://localhost:8000/api/execute', {
        source_code: code,
        language_id: 71
      });
      const data = resp.data;
      if (data.stderr || data.compile_output) {
        setError(data.stderr || data.compile_output);
        setOutput('');
      } else {
        setOutput(data.stdout || 'Success (No Output)');
        setError('');
      }
    } catch (err) {
      setError('Failed to connect to execution server.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    setIsExecuting(true);
    trackAction('submit_click');
    try {
      const resp = await axios.post('http://localhost:8000/api/execute', {
        source_code: code,
        language_id: 71
      });
      const data = resp.data;
      if (data.stderr || data.compile_output) {
        setError(data.stderr || data.compile_output);
        setOutput('');
      } else {
        setOutput(data.stdout || 'Success (No Output)\nAll tests passed.');
        setError('');
      }
    } catch (err) {
      setError('Failed to connect to execution server.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#0d1117] overflow-hidden">
      {/* Left panel: Problem Description */}
      <ProblemDescription />

      {/* Center panel: Editor & Console */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#30363d]">
        <div className="h-10 bg-[#0d1117] flex items-center justify-between px-4 border-b border-[#30363d]">
          <span className="text-sm font-semibold text-gray-400">Study Condition:</span>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="bg-[#21262d] border border-[#30363d] text-white text-sm rounded px-2 py-1 outline-none"
          >
            <option value="adaptive">Adaptive Tutor</option>
            <option value="static">Static Control</option>
          </select>
        </div>
        <CodeEditor code={code} onChange={handleCodeChange} />
        <ExecutionConsole
          output={output}
          error={error}
          isExecuting={isExecuting}
          onRun={handleRun}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Right panel: Adaptation Chat */}
      <TutorChat
        onHelpClick={() => trackAction('help_click')}
        code={code}
        error={error}
        sessionId={1}
        condition={condition}
      />
    </div>
  )
}

export default App
