import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MapPin, Briefcase, FileText, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { TiltCard3D } from './TiltCard3D';

export const AboutSection: React.FC = () => {
  const [showResumeModal, setShowResumeModal] = useState(false);

  return (
    <section
      id="about"
      className="py-20 sm:py-28 bg-black text-white px-4 sm:px-8 border-t border-zinc-900"
    >
      <div className="max-w-5xl mx-auto">
        {/* Sub-header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase mb-3">
            Journey &amp; Focus
          </p>
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-white uppercase mb-4"
            style={{ textWrap: 'balance' }}
          >
            About KundanVerse
          </h2>
          <div className="w-12 h-0.5 bg-white mx-auto mt-2" />
        </motion.div>

        {/* Core Biography Box wrapped in subtle 3D Tilt */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <TiltCard3D
            maxTilt={3.5}
            hoverY={-3}
            className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-600 transition-colors duration-300 p-6 sm:p-10 space-y-6"
          >
            <div className="space-y-4 text-xs sm:text-sm font-light text-zinc-300 leading-relaxed">
              <p className="text-sm sm:text-base text-zinc-200">
                KundanVerse is my personal portfolio website, where I share my learning journey, core technical skills, and interactive 3D stack in the field of Data Analytics. It showcases my passion for working with data, discovering insights, and preparing to contribute to meaningful analytical solutions.
              </p>
              <p className="text-sm sm:text-base font-medium text-white tracking-wider pt-2">
                KundanVerse – Exploring Data, Creating Insights.
              </p>
            </div>

          <div className="pt-6 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400">
            <div>
              <h4 className="text-xs uppercase font-semibold text-white tracking-wider mb-2 font-mono">
                My Learning &amp; Analytical Approach
              </h4>
              <p className="font-light leading-relaxed text-zinc-300">
                As a fresher entering Data Analytics, I focus on mastering core fundamentals first—auditing messy tables, verifying joins, writing readable SQL and Python code, and translating raw numbers into clear, honest answers that help teams make better decisions.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase font-semibold text-white tracking-wider mb-2 font-mono">
                What I Bring as a Fresher
              </h4>
              <ul className="space-y-2.5 font-light text-zinc-300">
                <li className="flex items-start gap-2 hover:translate-x-1 hover:text-white transition-all duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Solid SQL querying with joins, aggregations, CTEs, and window functions</span>
                </li>
                <li className="flex items-start gap-2 hover:translate-x-1 hover:text-white transition-all duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Structured data cleaning &amp; EDA in Python, Pandas, NumPy, and Excel</span>
                </li>
                <li className="flex items-start gap-2 hover:translate-x-1 hover:text-white transition-all duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Strong curiosity, attention to detail, and fast adaptability to team workflows</span>
                </li>
              </ul>
            </div>
          </div>
          </TiltCard3D>
        </motion.div>

        {/* Status Meta Row with 3D Perspective Tilt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          <TiltCard3D
            maxTilt={8}
            hoverY={-5}
            className="group p-4 bg-zinc-950 border border-zinc-800 flex items-center gap-3 hover:border-zinc-500 transition-colors"
          >
            <div
              style={{ transform: 'translateZ(18px)' }}
              className="p-2 bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-105 transition-all shrink-0"
            >
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                Email
              </span>
              <a
                href="mailto:patidarkundan971@gmail.com"
                className="text-xs text-white hover:underline break-all sm:truncate min-h-[44px] sm:min-h-0 flex items-center"
              >
                patidarkundan971@gmail.com
              </a>
            </div>
          </TiltCard3D>

          <TiltCard3D
            maxTilt={8}
            hoverY={-5}
            className="group p-4 bg-zinc-950 border border-zinc-800 flex items-center gap-3 hover:border-zinc-500 transition-colors"
          >
            <div
              style={{ transform: 'translateZ(18px)' }}
              className="p-2 bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-105 transition-all shrink-0"
            >
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                Availability
              </span>
              <span className="text-xs text-white block">
                Immediate · Remote or On-Site
              </span>
            </div>
          </TiltCard3D>

          <TiltCard3D
            maxTilt={8}
            hoverY={-5}
            className="group p-4 bg-zinc-950 border border-zinc-800 flex items-center gap-3 hover:border-zinc-500 transition-colors"
          >
            <div
              style={{ transform: 'translateZ(18px)' }}
              className="p-2 bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-105 transition-all shrink-0"
            >
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                Target Roles
              </span>
              <span className="text-xs text-white block">
                Data Analyst Intern · Entry-Level Analyst
              </span>
            </div>
          </TiltCard3D>
        </motion.div>

        {/* Action Button Row */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowResumeModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-zinc-200 text-xs font-semibold uppercase tracking-[0.18em] transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Fresher Profile</span>
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="#data-lab"
            className="w-full sm:w-auto px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold uppercase tracking-[0.18em] transition-colors min-h-[44px] flex items-center justify-center"
          >
            Interactive 3D Lab
          </motion.a>
          <motion.a
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="https://www.fiverr.com/s/8xyj60o"
            target="_blank"
            rel="noreferrer noopener"
            className="group w-full sm:w-auto px-6 py-3 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50 hover:text-emerald-200 border border-emerald-800/80 hover:border-emerald-500 text-xs font-semibold uppercase tracking-[0.18em] transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <span>Fiverr Profile</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.a>
          <a
            href="#contact"
            className="w-full sm:w-auto px-6 py-3 bg-transparent text-zinc-400 hover:text-white underline text-xs font-medium uppercase tracking-[0.18em] transition-colors min-h-[44px] flex items-center justify-center"
          >
            Send a Message
          </a>
        </div>

        {/* Animated Fresher Profile Modal */}
        <AnimatePresence>
          {showResumeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowResumeModal(false);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-white max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
                  <div>
                    <h3 className="text-xs uppercase font-semibold tracking-[0.2em] text-white">
                      Kundan Patidar · Fresher Candidate Profile
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Aspiring Data Analyst (Entry-Level / Internship Ready)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResumeModal(false)}
                    className="text-zinc-400 hover:text-white cursor-pointer p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-6 space-y-6 text-xs text-zinc-300 font-light leading-relaxed">
                  <div>
                    <h4 className="text-xs uppercase font-semibold text-white tracking-wider mb-1.5 font-mono">
                      Career Objective
                    </h4>
                    <p>
                      Motivated Data Analytics fresher seeking an entry-level Data Analyst role or internship to apply hands-on skills in Microsoft Excel, Power BI, MySQL, Python, Pandas, and NumPy toward real-world data cleaning, reporting, and exploratory analysis.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-semibold text-white tracking-wider mb-2 font-mono">
                      Core Technical Foundations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400 font-mono text-[11px]">
                      <div>• Excel: XLOOKUP, Pivot Tables &amp; Power Query</div>
                      <div>• Power BI: Data Modeling &amp; DAX Basics</div>
                      <div>• MySQL: Joins, CTEs &amp; Window Functions</div>
                      <div>• Python: Data Cleaning &amp; Scripting</div>
                      <div>• Pandas: DataFrame Merging &amp; Grouping</div>
                      <div>• NumPy: Stats, Arrays &amp; Outlier Checks</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-semibold text-white tracking-wider mb-1.5 font-mono">
                      Availability &amp; Contact
                    </h4>
                    <p>
                      Email:{' '}
                      <a href="mailto:patidarkundan971@gmail.com" className="text-white underline">
                        patidarkundan971@gmail.com
                      </a>
                    </p>
                    <p>Portfolio: KundanVerse – Exploring Data, Creating Insights</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setShowResumeModal(false)}
                    className="px-5 py-2.5 text-xs uppercase font-semibold tracking-wider bg-white text-black hover:bg-zinc-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
