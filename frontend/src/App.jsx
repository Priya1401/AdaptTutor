import React, { useState } from 'react'
import axios from 'axios'
import ProblemDescription from './components/ProblemDescription'
import TutorChat from './components/TutorChat'
import CodeEditor from './components/CodeEditor'
import ExecutionConsole from './components/ExecutionConsole'
import SurveyForm from './components/SurveyForm'
import { useTelemetry } from './hooks/useTelemetry'

const PRE_SURVEY_QUESTIONS = [
  {
    id: 'experience', text: 'How many years of programming experience do you have?', type: 'radio', options: [
      { label: '< 1 year', value: '0' }, { label: '1-3 years', value: '1' }, { label: '3-5 years', value: '3' }, { label: '5+ years', value: '5' }
    ]
  },
  { id: 'python_skill', text: 'Rate your proficiency in Python:', type: 'likert' }
];

const POST_SURVEY_QUESTIONS = [
  { id: 'usefulness', text: 'The AI Tutor was useful in helping me solve the problems.', type: 'likert' },
  { id: 'frustration', text: 'I felt frustrated during the coding tasks.', type: 'likert' },
  { id: 'feedback', text: 'Any additional feedback?', type: 'text', required: false }
];

function App() {
  const [appState, setAppState] = useState('pre-survey'); // 'pre-survey', 'coding', 'post-survey', 'completed'
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [condition, setCondition] = useState('adaptive'); // 'adaptive' or 'static'
  const { trackKeystroke, trackAction } = useTelemetry(1); // Mock Session ID = 1

  React.useEffect(() => {
    // Fetch available problems
    axios.get('http://localhost:8000/api/problems')
      .then(res => {
        setProblems(res.data);
        if (res.data.length > 0) {
          setActiveProblem(res.data[0]);
          setCode(res.data[0].initial_code);
        }
      })
      .catch(err => console.error("Error fetching problems:", err));
  }, []);

  const handleProblemChange = (e) => {
    const selected = problems.find(p => p.id === parseInt(e.target.value));
    if (selected) {
      setActiveProblem(selected);
      setCode(selected.initial_code);
      setOutput('');
      setError('');
    }
  };

  const handleCodeChange = (newCode) => {
    if (code.length - newCode.length > 20) {
      trackKeystroke({ isMassiveDeletion: true, charsDeleted: code.length - newCode.length });
    } else {
      trackKeystroke();
    }
    setCode(newCode || '');
  };


  const getDriverCode = (problemId) => {
    switch (problemId) {
      case 1: return '\n\nprint(twoSum([2,7,11,15], 9))';
      case 2: return '\n\nprint(isPalindrome(121))\nprint(isPalindrome(-121))';
      case 3: return '\n\nprint(fizzBuzz(3))';
      default: return '';
    }
  };

  const getExpectedOutputText = (problemId) => {
    switch (problemId) {
      case 1: return '[0, 1]';
      case 2: return 'True\nFalse';
      case 3: return "['1', '2', 'Fizz']";
      default: return '';
    }
  };

  const handleRun = async () => {
    setIsExecuting(true);
    trackAction('run_click');
    try {
      const codeToRun = code + getDriverCode(activeProblem?.id);
      const resp = await axios.post('http://localhost:8000/api/execute', {
        source_code: codeToRun,
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
      const codeToRun = code + getDriverCode(activeProblem?.id);
      const resp = await axios.post('http://localhost:8000/api/execute', {
        source_code: codeToRun,
        language_id: 71
      });
      const data = resp.data;
      if (data.stderr || data.compile_output) {
        setError(data.stderr || data.compile_output);
        setOutput('');
      } else {
        const actualOutput = (data.stdout || '').trim();
        const expectedOutput = getExpectedOutputText(activeProblem?.id);

        if (actualOutput === expectedOutput) {
          setOutput(`${actualOutput}\n\nSuccess! All tests passed.`);
          setError('');
          trackAction('submission_result', { status: 'success' });
        } else {
          setError(`Wrong Answer.\nExpected:\n${expectedOutput}\n\nGot:\n${actualOutput}`);
          setOutput('');
          trackAction('submission_result', { status: 'wrong_answer' });
        }
      }
    } catch (err) {
      setError('Failed to connect to execution server.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSurveySubmit = async (surveyType, responses) => {
    try {
      await axios.post('http://localhost:8000/api/survey', {
        session_id: 1, // Currently hardcoded
        survey_type: surveyType,
        responses: responses
      });

      if (surveyType === 'pre') {
        setAppState('coding');
      } else {
        setAppState('completed');
      }
    } catch (err) {
      console.error("Failed to submit survey", err);
      // Proceed anyway for robustness in study
      setAppState(surveyType === 'pre' ? 'coding' : 'completed');
    }
  };

  if (appState === 'pre-survey') {
    return <SurveyForm
      title="Pre-Study Questionnaire"
      description="Please answer a few questions before beginning the coding tasks."
      questions={PRE_SURVEY_QUESTIONS}
      onSubmit={(responses) => handleSurveySubmit('pre', responses)}
    />;
  }

  if (appState === 'post-survey') {
    return <SurveyForm
      title="Post-Study Questionnaire"
      description="Thank you for participating! Please provide your feedback on the experience."
      questions={POST_SURVEY_QUESTIONS}
      onSubmit={(responses) => handleSurveySubmit('post', responses)}
    />;
  }

  if (appState === 'completed') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117] text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Study Completed</h1>
          <p className="text-gray-400">Thank you for your participation. You may now close this window.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-[#0d1117] overflow-hidden">
      {/* Left panel: Problem Description */}
      <ProblemDescription problem={activeProblem} />

      {/* Center panel: Editor & Console */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#30363d]">
        <div className="h-10 bg-[#0d1117] flex items-center justify-between px-4 border-b border-[#30363d]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-400">Problem:</span>
              <select
                value={activeProblem?.id || ''}
                onChange={handleProblemChange}
                className="bg-[#21262d] border border-[#30363d] text-white text-sm rounded px-2 py-1 outline-none max-w-[200px]"
              >
                {problems.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 border-l border-[#30363d] pl-4">
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
          </div>
          <div>
            <button
              onClick={() => setAppState('post-survey')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
              Finish Study
            </button>
          </div>
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
