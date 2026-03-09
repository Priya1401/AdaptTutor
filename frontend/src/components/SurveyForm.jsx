import React, { useState } from 'react';

const SurveyForm = ({ title, description, questions, onSubmit }) => {
    const [responses, setResponses] = useState({});

    const handleChange = (questionId, value) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(responses);
    };

    const isComplete = questions.every(q => {
        if (q.required === false) return true;
        return responses[q.id] !== undefined && responses[q.id] !== '';
    });

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-white p-4">
            <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl p-8">
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                <p className="text-gray-400 mb-8">{description}</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {questions.map((q) => (
                        <div key={q.id} className="bg-[#0d1117] p-6 rounded-md border border-[#30363d]">
                            <label className="block text-lg font-medium mb-4">
                                {q.text} {q.required !== false && <span className="text-red-500">*</span>}
                            </label>

                            {q.type === 'radio' && (
                                <div className="space-y-2">
                                    {q.options.map(opt => (
                                        <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={opt.value}
                                                checked={responses[q.id] === opt.value}
                                                onChange={(e) => handleChange(q.id, e.target.value)}
                                                className="form-radio h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-300">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'likert' && (
                                <div className="flex flex-col space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500 mb-2 px-2">
                                        <span>Strongly Disagree</span>
                                        <span>Strongly Agree</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-[#161b22] p-4 rounded-md">
                                        {[1, 2, 3, 4, 5].map(val => (
                                            <label key={val} className="flex flex-col items-center cursor-pointer space-y-1">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value={val.toString()}
                                                    checked={responses[q.id] === val.toString()}
                                                    onChange={(e) => handleChange(q.id, e.target.value)}
                                                    className="form-radio h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                                />
                                                <span className="text-gray-400 text-xs">{val}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {q.type === 'text' && (
                                <textarea
                                    rows="3"
                                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Your answer..."
                                    value={responses[q.id] || ''}
                                    onChange={(e) => handleChange(q.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={!isComplete}
                            className={`px-6 py-2 rounded-md font-semibold ${isComplete
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                } transition-colors duration-200`}
                        >
                            Submit Survey
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SurveyForm;
