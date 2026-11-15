import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SKILLS_DATA } from '../data/portfolioData';
import { TiltCard3D } from './TiltCard3D';
import {
  FileSpreadsheet,
  BarChart3,
  Database,
  Code,
  Layers,
  Binary,
  CheckCircle2,
  Cpu,
  ChevronDown,
} from 'lucide-react';

export const SkillsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedSkill, setExpandedSkill] = useState<string | null>('Microsoft Excel');

  const categories = [
    'All',
    'BI & Reporting',
    'Databases & Querying',
    'Programming & Analysis',
    'Analytics & Math',
  ];

  const filteredSkills =
    selectedCategory === 'All'
      ? SKILLS_DATA
      : SKILLS_DATA.filter((s) => s.category === selectedCategory);

  const renderIcon = (name: string) => {
    switch (name) {
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-amber-400" />;
      case 'Database':
        return <Database className="w-5 h-5 text-sky-400" />;
      case 'Code':
        return <Code className="w-5 h-5 text-indigo-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-rose-400" />;
      case 'Binary':
        return <Binary className="w-5 h-5 text-purple-400" />;
      default:
        return <Cpu className="w-5 h-5 text-white" />;
    }
  };

  return (
    <section
      id="skills"
      className="py-20 sm:py-28 bg-zinc-950 text-white px-4 sm:px-8 border-t border-zinc-900"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase mb-3">
            Technical Foundation
          </p>
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-white uppercase mb-4"
            style={{ textWrap: 'balance' }}
          >
            Core Analytical Stack
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
            Practical entry-level skills developed through structured practice, public datasets, and daily hands-on analytical exercises.
          </p>
        </motion.div>

        {/* Animated Filter Tabs (Swipeable single row on mobile, centered wrap on sm+) */}
        <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-2 mb-10 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[44px] border ${
                  isActive
                    ? 'text-black border-white'
                    : 'bg-zinc-900/70 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="skills-filter-active"
                    transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                    className="absolute inset-0 bg-white"
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Animated Skills Cards Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSkills.map((skill, idx) => {
              const isExpanded = expandedSkill === skill.name;
              return (
                <motion.div
                  layout
                  key={skill.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.35,
                    delay: idx * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="h-full"
                >
                  <TiltCard3D
                    maxTilt={7}
                    hoverY={-6}
                    className="h-full p-6 bg-black border border-zinc-800 hover:border-zinc-500 transition-colors duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Header row with 3D translateZ elevation */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          style={{ transform: 'translateZ(20px)' }}
                          className="p-2.5 bg-zinc-900 border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-110 transition-all duration-200"
                        >
                          {renderIcon(skill.iconName)}
                        </div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors">
                          {skill.stage}
                        </span>
                      </div>

                    {/* Skill Name & Category */}
                    <h3 className="text-base font-medium text-white mb-1 group-hover:text-zinc-200">
                      {skill.name}
                    </h3>
                    <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-3 font-mono">
                      {skill.category}
                    </p>

                    <p className="text-xs text-zinc-300 font-light leading-relaxed mb-5">
                      {skill.description}
                    </p>

                    {/* Key Highlights */}
                    <div className="space-y-2 mb-5">
                      {skill.keyHighlights.map((hl, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-zinc-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>

                    {/* Interactive Practice Snapshot Toggle */}
                    <div className="mb-5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSkill(isExpanded ? null : skill.name)
                        }
                        className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-[11px] font-mono uppercase tracking-wider text-zinc-300 transition-colors cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        <span>Practice Highlight</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-white' : 'text-zinc-500'
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 bg-zinc-950/70 border-x border-b border-zinc-800 space-y-2 text-[11px]">
                              <p className="text-zinc-300 font-light leading-relaxed">
                                {skill.practiceTask}
                              </p>
                              <div className="p-2 bg-black border border-zinc-900 font-mono text-[10px] text-zinc-400 overflow-x-auto">
                                <code>{skill.sampleCommand}</code>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Animated Proficiency Bar */}
                  <div className="pt-4 border-t border-zinc-900">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                      <span>Comfort Level</span>
                      <span className="text-white font-medium tabular-nums">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: skill.level / 100 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full w-full bg-white origin-left"
                      />
                    </div>
                  </div>
                  </TiltCard3D>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
