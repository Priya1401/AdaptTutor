import React, { useState } from 'react';

const ConsentScreen = ({ onAgree }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d1117] text-white p-4">
      <div className="w-full max-w-2xl bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-2">Informed Consent Form</h1>
        <p className="text-gray-400 mb-6 text-sm">Please read the following carefully before participating.</p>

        <div className="space-y-4 text-sm text-gray-300 bg-[#0d1117] border border-[#30363d] rounded-md p-6 mb-6 max-h-96 overflow-y-auto">
          <div>
            <h2 className="text-white font-semibold mb-1">Study Title</h2>
            <p>AdaptTutor: An Emotion-Aware Adaptive Coding Tutoring System</p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-1">Research Team</h2>
            <p>Team Sudo Teach — Khoury College of Computer Sciences, Northeastern University</p>
            <p className="mt-1">Contact: <span className="text-blue-400">khurdi.s@northeastern.edu</span></p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-1">Purpose</h2>
            <p>This study investigates whether an AI tutoring system that adapts to your emotional and cognitive state improves learning outcomes and reduces frustration during programming tasks, compared to a static AI tutor.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-1">What You Will Do</h2>
            <p>You will solve 4 short coding problems in a web-based editor while interacting with an AI tutor. The session takes approximately 30–45 minutes. You will complete short surveys before, during, and after the tasks.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-1">What Data Is Collected</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Your coding activity: keystrokes, pauses, edits, run and submit actions</li>
              <li>Your interactions with the AI tutor (chat messages)</li>
              <li>Your survey responses (experience level, frustration ratings, preferences)</li>
              <li>Task outcomes (whether you solved each problem and how long it took)</li>
            </ul>
            <p className="mt-2">No personally identifiable information beyond an anonymous session ID is stored. Your name, email, and NEU ID are never collected or linked to your data.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-1">Risks and Benefits</h2>
            <p>There are no known risks beyond mild frustration from coding tasks. The problems are low-stakes and unrelated to any course grades. You may benefit from practicing Python problem-solving with AI assistance.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-1">Voluntary Participation</h2>
            <p>Participation is entirely voluntary. You may withdraw at any time without penalty by closing the browser window. Data collected up to that point may be retained in anonymized form.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-1">Data Storage</h2>
            <p>All data is stored securely on a local research server, accessible only to the research team. Data will be anonymized and may be used in academic publications or course reports.</p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-300 text-sm">
            I have read and understood the above information. I am 18 years of age or older and voluntarily agree to participate in this study. I understand that my data will be kept anonymous and used only for research purposes.
          </span>
        </label>

        <div className="flex justify-end">
          <button
            onClick={onAgree}
            disabled={!agreed}
            className={`px-6 py-2 rounded-md font-semibold transition-colors duration-200 ${
              agreed
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            I Agree — Continue to Study
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentScreen;
