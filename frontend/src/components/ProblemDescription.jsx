import React from 'react';

export default function ProblemDescription() {
    return (
        <div className="flex flex-col h-full bg-[#161b22] border-r border-[#30363d] overflow-y-auto w-1/4">
            <div className="p-4 border-b border-[#30363d]">
                <h2 className="text-xl font-bold text-white">Problem Description</h2>
            </div>
            <div className="p-4 space-y-4 text-sm text-[#8b949e]">
                <div>
                    <h3 className="text-white font-semibold mb-2">Two Sum</h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500/10 text-green-400 border border-green-500/20">Easy</span>
                </div>
                <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
                <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
                <p>You can return the answer in any order.</p>

                <div className="mt-4">
                    <p className="font-semibold text-white">Example 1:</p>
                    <pre className="bg-[#0d1117] p-3 rounded mt-2 border border-[#30363d]">
                        <code>
                            Input: nums = [2,7,11,15], target = 9
                            Output: [0,1]
                            Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
                        </code>
                    </pre>
                </div>
            </div>
        </div>
    );
}
