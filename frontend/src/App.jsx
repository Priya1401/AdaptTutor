import React, { useState } from 'react'
import axios from 'axios'
import ProblemDescription from './components/ProblemDescription'
import TutorChat from './components/TutorChat'
import CodeEditor from './components/CodeEditor'
import ExecutionConsole from './components/ExecutionConsole'
import SurveyForm from './components/SurveyForm'
import PostProblemSurvey from './components/PostProblemSurvey'
import ConsentScreen from './components/ConsentScreen'
import { useTelemetry } from './hooks/useTelemetry'

const PRE_SURVEY_QUESTIONS = [
  {
    id: 'experience', text: 'How many years of programming experience do you have?', type: 'radio', options: [
      { label: '< 1 year', value: '0' }, { label: '1–3 years', value: '1' }, { label: '3–5 years', value: '3' }, { label: '5+ years', value: '5' }
    ]
  },
  { id: 'python_skill', text: 'Rate your proficiency in Python (1 = Beginner, 5 = Expert):', type: 'likert' },
  {
    id: 'year_in_school', text: 'What is your current year of study?', type: 'radio', options: [
      { label: '1st year', value: '1' }, { label: '2nd year', value: '2' }, { label: '3rd year', value: '3' },
      { label: '4th year', value: '4' }, { label: 'Graduate student', value: 'grad' }, { label: 'Other', value: 'other' }
    ]
  },
  {
    id: 'primary_language', text: 'What is your primary programming language?', type: 'radio', options: [
      { label: 'Python', value: 'python' }, { label: 'Java', value: 'java' },
      { label: 'JavaScript', value: 'javascript' }, { label: 'C / C++', value: 'c_cpp' }, { label: 'Other', value: 'other' }
    ]
  },
  {
    id: 'ai_tool_use', text: 'How often do you use AI coding tools (e.g. ChatGPT, Copilot)?', type: 'radio', options: [
      { label: 'Never', value: 'never' }, { label: 'Occasionally', value: 'occasionally' },
      { label: 'Regularly', value: 'regularly' }, { label: 'Daily', value: 'daily' }
    ]
  }
];

const POST_SURVEY_QUESTIONS = [
  { id: 'usefulness', text: 'The AI Tutor was useful in helping me solve the problems.', type: 'likert' },
  { id: 'frustration', text: 'I felt frustrated during the coding tasks.', type: 'likert' },
  {
    id: 'preference', text: 'Thinking about both halves of the study, which tutor experience did you prefer?', type: 'radio', options: [
      { label: 'The tutor in the first half (problems 1–2)', value: 'first_half' },
      { label: 'The tutor in the second half (problems 3–4)', value: 'second_half' },
      { label: 'No preference — both felt similar', value: 'no_preference' }
    ]
  },
  {
    id: 'noticed_difference', text: 'Did you notice any difference in how the AI tutor responded between the first and second halves of the study?', type: 'radio', options: [
      { label: 'Yes, clearly different', value: 'yes_clearly' },
      { label: 'Somewhat different', value: 'somewhat' },
      { label: 'Not really', value: 'not_really' },
      { label: 'No difference noticed', value: 'no' }
    ]
  },
  { id: 'feedback', text: 'Any additional comments or feedback?', type: 'text', required: false }
];

// Group A: problems at index 0,1 → static, index 2,3 → adaptive
// Group B: problems at index 0,1 → adaptive, index 2,3 → static
// Problem order is randomized per participant via shuffleArray

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getConditionForProblem(group, problemIndex) {
  if (group === 'b') {
    return problemIndex < 2 ? 'adaptive' : 'static';
  }
  // default group a
  return problemIndex < 2 ? 'static' : 'adaptive';
}

function App() {
  const [appState, setAppState] = useState('consent');
  const [allProblems, setAllProblems] = useState([]);
  const [studyProblems, setStudyProblems] = useState([]);
  // Randomize problem order once per participant session
  const [studyProblemOrder] = useState(() => shuffleArray([1, 2, 3, 4]));
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [activeProblem, setActiveProblem] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [condition, setCondition] = useState('');
  const [sessionId, setSessionId] = useState(() => {
    const stored = localStorage.getItem('adapttutor_session_id');
    return stored ? parseInt(stored) : null;
  });
  const [showProblemSurvey, setShowProblemSurvey] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const { trackKeystroke, trackAction } = useTelemetry(sessionId);

  const urlParams = new URLSearchParams(window.location.search);
  const group = urlParams.get('group') || 'a';

  React.useEffect(() => {
    axios.get('http://localhost:8000/api/problems')
      .then(res => {
        setAllProblems(res.data);
        // Map problems in the randomized order for this participant
        const filtered = studyProblemOrder
          .map(id => res.data.find(p => p.id === id))
          .filter(Boolean);
        setStudyProblems(filtered);
        if (filtered.length > 0) {
          setActiveProblem(filtered[0]);
          setCode(filtered[0].initial_code);
        }
      })
      .catch(err => console.error("Error fetching problems:", err));
  }, []);

  // update backend with current problem and condition
  React.useEffect(() => {
    if (sessionId && activeProblem) {
      const cond = getConditionForProblem(group, currentProblemIndex);
      setCondition(cond);
      axios.post('http://localhost:8000/api/sessions/problem', {
        session_id: sessionId,
        problem_id: activeProblem.id,
        condition: cond
      }).catch(err => console.error("Error setting problem:", err));
    }
  }, [sessionId, activeProblem, currentProblemIndex]);

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
      case 1: return '\n\nprint(twoSum([2,7,11,15], 9))\nprint(twoSum([3,2,4], 6))';
      case 2: return '\n\nprint(isPalindrome(121))\nprint(isPalindrome(-121))\nprint(isPalindrome(0))\nprint(isPalindrome(10))';
      case 3: return '\n\nprint(fizzBuzz(15))';
      case 4: return '\n\ns = ["h","e","l","l","o"]\nreverseString(s)\nprint(s)\ns2 = ["H","a","n","n","a","h"]\nreverseString(s2)\nprint(s2)';
      case 5: return '\n\nprint(isValid("()"))\nprint(isValid("([)]"))';
      case 6: return '\n\nprint(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))\nprint(maxSubArray([1]))';
      default: return '';
    }
  };

  const getExpectedOutputText = (problemId) => {
    switch (problemId) {
      case 1: return '[0, 1]\n[1, 2]';
      case 2: return 'True\nFalse\nTrue\nFalse';
      case 3: return "['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz']";
      case 4: return "['o', 'l', 'l', 'e', 'h']\n['h', 'a', 'n', 'n', 'a', 'H']";
      case 5: return 'True\nFalse';
      case 6: return '6\n1';
      default: return '';
    }
  };

  const classifyError = (errorStr) => {
    if (!errorStr) return 'unknown';
    if (errorStr.includes('SyntaxError')) return 'SyntaxError';
    if (errorStr.includes('IndentationError')) return 'SyntaxError';
    if (errorStr.includes('TypeError')) return 'TypeError';
    if (errorStr.includes('IndexError')) return 'IndexError';
    if (errorStr.includes('NameError')) return 'NameError';
    if (errorStr.includes('ValueError')) return 'ValueError';
    if (errorStr.includes('KeyError')) return 'KeyError';
    if (errorStr.includes('AttributeError')) return 'AttributeError';
    if (errorStr.startsWith('Wrong Answer')) return 'wrong_answer';
    return 'runtime_error';
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
        const errStr = data.stderr || data.compile_output;
        setError(errStr);
        setOutput('');
        trackAction('submission_result', { status: 'runtime_error', error_type: classifyError(errStr) });
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
        const errStr = data.stderr || data.compile_output;
        setError(errStr);
        setOutput('');
        trackAction('submission_result', { status: 'compilation_error', error_type: classifyError(errStr) });
      } else {
        const actualOutput = (data.stdout || '').trim();
        const expectedOutput = getExpectedOutputText(activeProblem?.id);

        if (actualOutput === expectedOutput) {
          setOutput(`${actualOutput}\n\nSuccess! All tests passed.`);
          setError('');
          trackAction('submission_result', { status: 'success' });
          setSolvedProblems(prev => new Set([...prev, activeProblem.id]));
          setShowProblemSurvey(true);
        } else {
          const errStr = `Wrong Answer.\nExpected:\n${expectedOutput}\n\nGot:\n${actualOutput}`;
          setError(errStr);
          setOutput('');
          trackAction('submission_result', { status: 'wrong_answer', error_type: 'wrong_answer' });
        }
      }
    } catch (err) {
      setError('Failed to connect to execution server.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleProblemSurveySubmit = async (responses) => {
    if (sessionId) {
      try {
        await axios.post('http://localhost:8000/api/survey', {
          session_id: sessionId,
          survey_type: `post_problem_${activeProblem.id}`,
          responses: {
            ...responses,
            problem_id: activeProblem.id,
            problem_title: activeProblem.title,
            condition: getConditionForProblem(group, currentProblemIndex)
          }
        });
      } catch (err) {
        console.error("Failed to submit problem survey", err);
      }
    }

    setShowProblemSurvey(false);

    // advance to next problem in sequence
    const nextIndex = currentProblemIndex + 1;
    if (nextIndex < studyProblems.length) {
      setCurrentProblemIndex(nextIndex);
      setActiveProblem(studyProblems[nextIndex]);
      setCode(studyProblems[nextIndex].initial_code);
      setOutput('');
      setError('');
    } else {
      // all problems done, go to post survey
      handleFinishStudy();
    }
  };

  const handleFinishStudy = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to finish the study?\n\nThis will end your session and take you to the final survey. You won't be able to return to the coding problems."
    );
    if (!confirmed) return;

    if (sessionId) {
      try {
        await axios.post(`http://localhost:8000/api/sessions/${sessionId}/end`);
      } catch (err) {
        console.error("Failed to end session", err);
      }
    }
    setAppState('post-survey');
  };

  const handleSurveySubmit = async (surveyType, responses) => {
    try {
      let currentSessionId = sessionId;

      if (surveyType === 'pre' && !sessionId) {
        const initialCondition = getConditionForProblem(group, 0);
        const sessionResp = await axios.post('http://localhost:8000/api/sessions/start', {
          condition: initialCondition
        });
        currentSessionId = sessionResp.data.session_id;
        setSessionId(currentSessionId);
        localStorage.setItem('adapttutor_session_id', currentSessionId);
        setCondition(sessionResp.data.condition);
      }

      if (currentSessionId) {
        await axios.post('http://localhost:8000/api/survey', {
          session_id: currentSessionId,
          survey_type: surveyType,
          responses: { ...responses, group, problem_order: studyProblemOrder }
        });
      }

      if (surveyType === 'pre') {
        setAppState('coding');
      } else {
        localStorage.removeItem('adapttutor_session_id');
        setAppState('completed');
      }
    } catch (err) {
      console.error("Failed to submit survey", err);
      setAppState(surveyType === 'pre' ? 'coding' : 'completed');
    }
  };

  if (appState === 'consent') {
    return <ConsentScreen onAgree={() => setAppState('pre-survey')} />;
  }

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
      {showProblemSurvey && (
        <PostProblemSurvey
          problemTitle={activeProblem?.title}
          onSubmit={handleProblemSurveySubmit}
        />
      )}

      <ProblemDescription problem={activeProblem} />

      <div className="flex-1 flex flex-col min-w-0 border-r border-[#30363d]">
        <div className="h-10 bg-[#0d1117] flex items-center justify-between px-4 border-b border-[#30363d]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-400">Problem {currentProblemIndex + 1} of {studyProblems.length}:</span>
              <span className="text-sm text-white font-semibold">{activeProblem?.title}</span>
            </div>
            <div className="text-xs text-gray-500">
              {solvedProblems.size}/{studyProblems.length} solved
            </div>
          </div>
          <div>
            <button
              onClick={handleFinishStudy}
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

      <TutorChat
        key={activeProblem?.id}
        onHelpClick={() => trackAction('help_click')}
        code={code}
        error={error}
        sessionId={sessionId}
        condition={condition}
      />
    </div>
  )
}

export default App
