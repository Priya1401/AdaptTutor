import React, { useState } from 'react';

const EMOTIONAL_STATES = [
    'Frustrated',
    'Confused',
    'Confident',
    'Stuck but calm',
    'Progressing'
];

export default function PostProblemSurvey({ problemTitle, onSubmit }) {
    const [frustration, setFrustration] = useState(null);
    const [helpfulness, setHelpfulness] = useState(null);
    const [emotionalState, setEmotionalState] = useState('');

    const isComplete = frustration !== null && helpfulness !== null && emotionalState !== '';

    const handleSubmit = () => {
        if (!isComplete) return;
        onSubmit({
            frustration: frustration.toString(),
            helpfulness: helpfulness.toString(),
            self_reported_state: emotionalState
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 w-full max-w-lg shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-1">Quick Check-In</h2>
                <p className="text-gray-400 text-sm mb-6">You completed <span className="text-white font-semibold">{problemTitle}</span>. Please answer before moving on.</p>

                <div className="space-y-6">
                    <div className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                        <label className="block text-sm font-medium text-white mb-3">
                            How frustrated did you feel during this problem? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                            <span>Not at all</span>
                            <span>Extremely</span>
                        </div>
                        <div className="flex justify-between items-center">
                            {[1, 2, 3, 4, 5].map(val => (
                                <label key={val} className="flex flex-col items-center cursor-pointer space-y-1">
                                    <input
                                        type="radio"
                                        name="frustration"
                                        checked={frustration === val}
                                        onChange={() => setFrustration(val)}
                                        className="form-radio h-5 w-5 text-blue-600"
                                    />
                                    <span className="text-gray-400 text-xs">{val}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                        <label className="block text-sm font-medium text-white mb-3">
                            How helpful was the tutor for this problem? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
                            <span>Not helpful</span>
                            <span>Very helpful</span>
                        </div>
                        <div className="flex justify-between items-center">
                            {[1, 2, 3, 4, 5].map(val => (
                                <label key={val} className="flex flex-col items-center cursor-pointer space-y-1">
                                    <input
                                        type="radio"
                                        name="helpfulness"
                                        checked={helpfulness === val}
                                        onChange={() => setHelpfulness(val)}
                                        className="form-radio h-5 w-5 text-blue-600"
                                    />
                                    <span className="text-gray-400 text-xs">{val}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                        <label className="block text-sm font-medium text-white mb-3">
                            Which best describes how you felt during this problem? <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {EMOTIONAL_STATES.map(state => (
                                <label key={state} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="emotionalState"
                                        checked={emotionalState === state}
                                        onChange={() => setEmotionalState(state)}
                                        className="form-radio h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-gray-300 text-sm">{state}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!isComplete}
                        className={`px-5 py-2 rounded font-semibold text-sm ${isComplete
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            } transition-colors`}
                    >
                        Continue to Next Problem
                    </button>
                </div>
            </div>
        </div>
    );
}
