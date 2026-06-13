import React, { useState } from 'react';

type Section = 'philosophy' | 'skills' | 'tactics' | 'positions' | 'age-groups';

export const CoachManualView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('philosophy');

  const SectionButton = ({ id, label, icon }: { id: Section; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all w-full text-left mb-2 ${
        activeSection === id 
          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
          : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
      }`}
    >
      <div className={`${activeSection === id ? 'text-white dark:text-slate-900' : 'text-slate-400'}`}>
        {icon}
      </div>
      <span className="font-bold text-sm uppercase tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="lg:w-1/4 flex-shrink-0">
        <div className="sticky top-6">
          <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-4 px-2">Coach Education</h3>
          <div className="flex flex-col">
            <SectionButton 
              id="philosophy" 
              label="Philosophy & Roles" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} 
            />
            <SectionButton 
              id="skills" 
              label="Core Skills" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" /></svg>} 
            />
            <SectionButton 
              id="tactics" 
              label="Attack & Defence" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>} 
            />
            <SectionButton 
              id="positions" 
              label="Positional Guides" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} 
            />
            <SectionButton 
              id="age-groups" 
              label="Age Objectives" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-[#1A1A1C] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
        
        {activeSection === 'philosophy' && (
          <div className="space-y-8">
            <header className="border-b border-gray-100 dark:border-white/10 pb-6">
              <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white mb-2">The Coach's Role</h2>
              <p className="text-lg text-slate-500 dark:text-gray-400">"It is impossible for a man to learn what he thinks he already knows."</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl">
                <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wide text-sm">Teaching</h4>
                <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">
                  How can you teach without knowledge? Your primary role is to impart fundamental skills, specialized techniques, and positional understanding. Knowledge gives you the confidence to lead.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl">
                <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2 uppercase tracking-wide text-sm">Managing People</h4>
                <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed">
                  Coaching is getting people to do what you want them to do, and like doing it. It goes beyond the game plan; it's about managing personalities, effort, and the environment.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Why Children Stay in Sport</h3>
              <ul className="space-y-3">
                {[
                  { title: "The Environment", desc: "Player selection, coach behavior, aspiration." },
                  { title: "Enjoyment & Mateship", desc: "Variety at training, communication, fun-based drills." },
                  { title: "Development", desc: "Feeling themselves improve as players and people." }
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">✓</span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-gray-200 block">{item.title}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-white dark:bg-black/20 rounded-xl border-l-4 border-red-500">
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300 italic">
                  "Junior coaching is not about winning, period. It's about creating a positive environment and teaching players the process required to be successful."
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-8">
            <header className="border-b border-gray-100 dark:border-white/10 pb-6">
              <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white mb-2">Core Skills</h2>
              <p className="text-lg text-slate-500 dark:text-gray-400">The fundamentals that underpin every play.</p>
            </header>

            <div className="space-y-6">
              {/* GRIP */}
              <div className="bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-6 py-3 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">Grip & Carry</h3>
                  <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded uppercase">Attack</span>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Technique (How)</h4>
                    <ul className="list-disc list-outside ml-4 text-sm text-slate-600 dark:text-gray-300 space-y-2">
                      <li>Carry ball in two hands.</li>
                      <li>Thumbs on top, fingers spread underneath.</li>
                      <li>Pull thumbs back on the ball.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Purpose (Why)</h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                      Allows you to do everything: run, pass, kick, or offload. It enables release with no rotation for better accuracy.
                    </p>
                  </div>
                </div>
              </div>

              {/* CATCH & PASS */}
              <div className="bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-6 py-3 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">The Perfect Pass</h3>
                  <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded uppercase">Attack</span>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Technique (How)</h4>
                    <ul className="list-disc list-outside ml-4 text-sm text-slate-600 dark:text-gray-300 space-y-2">
                      <li>Start from outside the hip (not the center).</li>
                      <li>Point ball to ground (thumbs/fingers down).</li>
                      <li>Arms straight, not over-extended.</li>
                      <li>Ball travels <strong>underneath</strong> the body.</li>
                      <li>Follow through towards target.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Purpose (Why)</h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mb-2">
                      <strong>Underneath vs Around:</strong> If released early underneath, it goes low but straight. If released late around the body, it goes behind the runner.
                    </p>
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                      Promote with arms, weight with wrists. A soft pass is easier to catch under pressure.
                    </p>
                  </div>
                </div>
              </div>

              {/* TACKLE */}
              <div className="bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-6 py-3 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">Front On Tackle</h3>
                  <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded uppercase">Defence</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="block text-red-500 font-bold mb-1">1. Approach</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Eyes up, back flat. Shorten steps (fast feet) as you enter the reaction zone.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="block text-red-500 font-bold mb-1">2. Contact</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Head in tight (cheek to cheek). Hit with the shoulder. Target the core/ball.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="block text-red-500 font-bold mb-1">3. Drive</span>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Drive UP and through. Leg drive is essential. Wrap arms (lock on) immediately.</p>
                    </div>
                  </div>
                  <div className="flex items-start bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-red-800 dark:text-red-200">
                      <strong>LeagueLens Tip:</strong> Monitor the "Tackles" stat in the tracker. High tackle counts are great, but watch for "Penalties Conceded" to identify technique issues (e.g., high shots or flopping).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tactics' && (
          <div className="space-y-8">
            <header className="border-b border-gray-100 dark:border-white/10 pb-6">
              <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white mb-2">Tactical Principles</h2>
              <p className="text-lg text-slate-500 dark:text-gray-400">Structure, Momentum, and Effort.</p>
            </header>

            {/* Effort Areas */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold">Effort Areas</h3>
              </div>
              <p className="text-white/80 text-sm mb-6 max-w-2xl">
                These require zero talent, only attitude. They are the difference between winning and losing close games.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <span className="font-bold text-green-400 block mb-1">Attack: Support Play</span>
                  <p className="text-xs text-white/70">Push through the line. Be an option even if you don't get the ball. It holds defenders.</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <span className="font-bold text-red-400 block mb-1">Defence: Kick Chase</span>
                  <p className="text-xs text-white/70">One straight line. Build pressure on the first two tackles. Don't wait for the ball.</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <span className="font-bold text-green-400 block mb-1">Attack: Quick PTB</span>
                  <p className="text-xs text-white/70">Fight to your knees/elbows. Clear separation. Generate momentum.</p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <span className="font-bold text-red-400 block mb-1">Defence: Fill The Space</span>
                  <p className="text-xs text-white/70">"A" Defender must plug the hole when the marker leaves. Don't spectate.</p>
                </div>
              </div>
            </div>

            {/* Attack Principles */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white border-l-4 border-blue-500 pl-3">Principles of Attack</h3>
              <ul className="space-y-4">
                <li className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">1. Draw & Pass (2v1)</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ball carrier attacks the inside shoulder. Isolate the defender. Pass <strong>fast then slow</strong> (approach fast, steady to pass). Support runner holds line, then accelerates into the hole.
                  </p>
                </li>
                <li className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">2. Earn the Right</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    You can't play expansive football without winning the middle first. Forward momentum creates the space for the backs.
                  </p>
                </li>
              </ul>
            </div>

            {/* Defence Principles */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white border-l-4 border-red-500 pl-3">Principles of Defence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-white/10 p-4 rounded-xl">
                  <h4 className="font-bold text-sm mb-2">Marker Defence</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 list-disc ml-4">
                    <li>Be verbal. Communicate.</li>
                    <li>First marker tracks ball (don't overchase).</li>
                    <li>Second marker fills the space ("A" Defender).</li>
                    <li>Marker square: "Push the rump".</li>
                  </ul>
                </div>
                <div className="border border-gray-200 dark:border-white/10 p-4 rounded-xl">
                  <h4 className="font-bold text-sm mb-2">The Defensive Line</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 list-disc ml-4">
                    <li>Line Speed: Move up together (Grenade).</li>
                    <li>Spacing: Trust your inside man.</li>
                    <li>Slide vs Wedge: Know the system.</li>
                    <li>Attitude: Defence is a choice.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'positions' && (
          <div className="space-y-8">
            <header className="border-b border-gray-100 dark:border-white/10 pb-6">
              <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white mb-2">Positional Guides</h2>
              <p className="text-lg text-slate-500 dark:text-gray-400">Specific roles and expectations for the modern game.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
              {/* Spine */}
              <div className="bg-white dark:bg-[#1A1A1C] border-l-4 border-purple-500 shadow-sm rounded-r-xl p-6">
                <h3 className="text-xl font-bold text-purple-600 mb-4">The Spine (1, 6, 7, 9)</h3>
                <div className="space-y-4">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Fullback (1):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong>Attack:</strong> Support play is key. High work rate. Regroup and attack multiple times per set. Good kick return.<br/>
                      <strong>Defence:</strong> The General. Organizes the line. Last line of defence. Catch on the full.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Halves (6, 7):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong>Attack:</strong> Play to structure but play what you see (Eyes Up). Excellent catch/pass. Direction and kicking game.<br/>
                      <strong>Defence:</strong> Must be strong 1-on-1. Communicate numbers.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Hooker (9):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong>Attack:</strong> Service is priority #1. Choosing when to run vs pass. Identifying markers not square.<br/>
                      <strong>Defence:</strong> High work rate. Lead the kick chase. "A" defender control.
                    </p>
                  </div>
                </div>
              </div>

              {/* Outside Backs */}
              <div className="bg-white dark:bg-[#1A1A1C] border-l-4 border-blue-500 shadow-sm rounded-r-xl p-6">
                <h3 className="text-xl font-bold text-blue-600 mb-4">Outside Backs (2, 3, 4, 5)</h3>
                <div className="space-y-4">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Wingers (2, 5):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong>Attack:</strong> Start sets well (Kick returns). Finish tries. Look for work in yardage.<br/>
                      <strong>Defence:</strong> Positional play for kicks. Trust inside man. Decision making (jam or slide).
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Centres (3, 4):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong>Attack:</strong> Strike power. Line running. Draw and pass to winger.<br/>
                      <strong>Defence:</strong> 1-on-1 tackling ability. Reading the attack.
                    </p>
                  </div>
                </div>
              </div>

              {/* Forwards */}
              <div className="bg-white dark:bg-[#1A1A1C] border-l-4 border-red-500 shadow-sm rounded-r-xl p-6">
                <h3 className="text-xl font-bold text-red-600 mb-4">Forwards (8, 10, 11, 12, 13)</h3>
                <div className="space-y-4">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Props (8, 10):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong>Attack:</strong> Go forward. Generate PTB speed. Draw defenders.<br/>
                      <strong>Defence:</strong> Control the middle. Intimidate. Slow the ruck.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Second Row (11, 12):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <strong>Attack:</strong> Line running on edges. Support play. Offloads.<br/>
                      <strong>Defence:</strong> Workaholic. Cover inside and out.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Lock (13):</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Versatile link player. High work rate. Third playmaker or extra prop depending on style.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'age-groups' && (
          <div className="space-y-8">
            <header className="border-b border-gray-100 dark:border-white/10 pb-6">
              <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white mb-2">Age Specific Objectives</h2>
              <p className="text-lg text-slate-500 dark:text-gray-400">Development milestones for each stage.</p>
            </header>

            <div className="space-y-4">
              <div className="bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-green-600 mb-2">Mini League (U7 - U8)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">"Fun & Participation"</p>
                <ul className="text-sm text-slate-700 dark:text-gray-200 list-disc ml-4 space-y-1">
                  <li>Basic rules understanding.</li>
                  <li>Hold the ball with two hands.</li>
                  <li>Correct Play the Ball technique.</li>
                  <li>Introduction to tackling (safe technique).</li>
                  <li><strong>Winning does not matter.</strong></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-yellow-600 mb-2">Mid League (U9 - U10)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">"Skill Acquisition"</p>
                <ul className="text-sm text-slate-700 dark:text-gray-200 list-disc ml-4 space-y-1">
                  <li>Running onto the ball.</li>
                  <li>Support play concepts.</li>
                  <li>Basic defensive line structure.</li>
                  <li>Introduction to kicking technique.</li>
                  <li>Draw and Pass (2v1) basics.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-blue-600 mb-2">Mod League (U11 - U12)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">"Game Understanding"</p>
                <ul className="text-sm text-slate-700 dark:text-gray-200 list-disc ml-4 space-y-1">
                  <li>Positional roles become clearer.</li>
                  <li>Backline formation.</li>
                  <li>Defensive roles (Markers, A, B, C).</li>
                  <li>Kick chase organization.</li>
                  <li>Importance of fitness introduction.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <h3 className="text-lg font-bold text-purple-600 mb-2">International (U13+)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">"Competition & Refinement"</p>
                <ul className="text-sm text-slate-700 dark:text-gray-200 list-disc ml-4 space-y-1">
                  <li>Ruck plays and game plans.</li>
                  <li>Advanced defensive structures (Slide/Wedge).</li>
                  <li>Slowing the ruck / Speeding up the ruck.</li>
                  <li>Weight training technique (body weight first).</li>
                  <li>Leadership and goal setting.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};