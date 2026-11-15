import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SKILLS_DATA } from '../data/portfolioData';
import { TiltCard3D } from './TiltCard3D';
import {
  Pause,
  Play,
  ArrowRight,
  Mail,
  Box,
  Terminal,
  Compass,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number>(0);

  const activeSkill = SKILLS_DATA[selectedToolIndex];

  const fresherHighlights = [
    { value: '6 Core Tools', label: 'Excel · BI · SQL · Python' },
    { value: '0->1 Focus', label: 'Fresher · Seeking First Project' },
    { value: 'Daily Labs', label: 'SQL · Pandas · Cleaning Drills' },
    { value: 'Immediate', label: 'Fresher · Open to Work' },
  ];

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-black pt-22 sm:pt-28 pb-16 sm:pb-12 px-4 sm:px-8">
      {/* Ambient Cinematic Backdrop */}
      <div
        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 ${
          isPlaying ? 'animate-ambient-zoom' : 'scale-100'
        }`}
        style={{
          backgroundImage: `url('/src/assets/images/skyline_subway_bg_1793876519490.jpg')`,
        }}
      />

      {/* Contrast Scrim & Vignette */}
      <div className="absolute inset-0 bg-black/82 backdrop-contrast-125" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06)_0%,transparent_50%),radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />

      {/* Main Responsive Editorial Split */}
      <div className="relative z-10 w-full max-w-6xl mx-auto my-auto py-4 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-stretch">
          {/* Left Column: Fresher Identity, Typography & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6 text-left"
          >
            <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] sm:tracking-[0.24em] text-zinc-400">
              Kundan Patidar · Entry-Level Data Analyst (Fresher)
            </div>

            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Exploring Data.{' '}
              <span className="font-semibold block sm:inline text-zinc-100">
                Creating Insights.
              </span>
            </h1>

            <p className="text-sm sm:text-base font-light text-zinc-300 leading-relaxed max-w-2xl">
              I am an aspiring Data Analyst building a strong practical foundation in cleaning messy datasets, writing analytical SQL queries, automating exploratory analysis in Python, and presenting clear stories through{' '}
              <span className="text-white font-medium">
                Excel, Power BI, MySQL, Python, Pandas, and NumPy
              </span>
              .
            </p>

            {/* Primary & Secondary Action Row */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
              <motion.a
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                href="#data-lab"
                className="group px-6 py-3.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold uppercase tracking-[0.18em] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap min-h-[48px] sm:min-h-[44px]"
              >
                <Box className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Explore 3D Stack</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </motion.a>

              <motion.a
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                href="#contact"
                className="group px-6 py-3.5 bg-zinc-950/80 hover:bg-zinc-900 text-white border border-zinc-700 hover:border-white text-xs font-semibold uppercase tracking-[0.18em] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap min-h-[48px] sm:min-h-[44px]"
              >
                <Mail className="w-4 h-4 transition-transform duration-200 group-hover:-rotate-6" />
                <span>Get In Touch</span>
              </motion.a>
            </div>
          </motion.div>

          {/* Right Column: Interactive Analytical Toolkit Explorer (3D Tilt Surface) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col"
          >
            <TiltCard3D maxTilt={6} hoverY={-4} className="h-full group">
              <div className="h-full bg-zinc-950/90 backdrop-blur-md border border-zinc-800 hover:border-zinc-600 transition-colors duration-300 p-5 sm:p-7 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-zinc-300" />
                      <h2 className="text-xs uppercase font-semibold tracking-[0.2em] text-white">
                        Interactive Toolkit Explorer
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Click a tool
                    </span>
                  </div>

                  {/* Interactive Segmented Selector Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-4">
                    {SKILLS_DATA.map((skill, idx) => {
                      const isSelected = idx === selectedToolIndex;
                      return (
                        <motion.button
                          key={skill.name}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedToolIndex(idx)}
                          className={`relative px-2 py-2.5 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer text-center border min-h-[44px] truncate ${
                            isSelected
                              ? 'text-black border-white font-semibold'
                              : 'text-zinc-400 hover:text-white border-zinc-800 bg-black/60 hover:border-zinc-600'
                          }`}
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="hero-tool-pill"
                              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                              className="absolute inset-0 bg-white -z-0"
                            />
                          )}
                          <span className="relative z-10 truncate block">
                            {skill.name.replace('Microsoft ', '')}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Animated Tool Practice Card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSkill.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-5 space-y-4"
                      style={{ transform: 'translateZ(16px)' }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>{activeSkill.category}</span>
                        <span>{activeSkill.stage}</span>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-white">
                          {activeSkill.name}
                        </h3>
                        <p className="text-xs text-zinc-300 font-light leading-relaxed mt-1.5">
                          {activeSkill.practiceTask}
                        </p>
                      </div>

                      <div className="bg-black border border-zinc-800 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                        <code>{activeSkill.sampleCommand}</code>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5 min-w-0">
                    <Compass className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span className="truncate">Actively seeking Data Analyst roles</span>
                  </span>
                  <a
                    href="#skills"
                    className="text-white hover:underline uppercase tracking-wider shrink-0 min-h-[44px] inline-flex items-center px-1"
                  >
                    Full Stack -&gt;
                  </a>
                </div>
              </div>
            </TiltCard3D>
          </motion.div>
        </div>
      </div>

      {/* Bottom 4-Column Fresher Snapshot Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-6xl mx-auto mt-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 hover:border-zinc-700 transition-colors duration-300 text-center">
          {fresherHighlights.map((item, idx) => (
            <TiltCard3D
              key={item.value}
              maxTilt={10}
              hoverY={-4}
              glareOpacity={0.05}
              className={`group p-2 transition-colors ${
                idx < 3 ? 'md:border-r md:border-zinc-800' : ''
              }`}
            >
              <div className="text-base sm:text-xl font-mono font-light text-white tabular-nums">
                {item.value}
              </div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-400 font-mono mt-1">
                {item.label}
              </div>
            </TiltCard3D>
          ))}
        </div>
      </motion.div>

      {/* Background Animation Control */}
      <div className="relative sm:absolute mt-4 sm:mt-0 sm:bottom-5 sm:right-5 z-20 flex justify-end max-w-6xl w-full sm:w-auto mx-auto">
        <button
          type="button"
          onClick={() => setIsPlaying((prev) => !prev)}
          aria-label={isPlaying ? 'Pause Background Animation' : 'Play Background Animation'}
          className="p-2.5 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-white border border-zinc-700 backdrop-blur-sm transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
        </button>
      </div>
    </section>
  );
};
