import { useMemo, useState } from 'react';
import { useQuestionBankStore } from '../../state/questionBankStore';
import type { Question, QuestionType } from '../../types/quiz';
import type { Difficulty } from '../../types/questionBank';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import styles from './QuestionBankBrowser.module.css';

const TYPE_LABEL: Record<QuestionType, string> = {
  'multiple-choice': 'Multiple choice',
  text: 'Text answer',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
};
const TYPE_ICON: Record<QuestionType, string> = {
  'multiple-choice': '☰',
  text: 'Aa',
  image: '🖼',
  audio: '♪',
  video: '▶',
};
const TYPE_CHIPS: (QuestionType | 'all')[] = ['all', 'multiple-choice', 'text', 'image', 'audio', 'video'];

/**
 * Searchable, filterable, multi-select browser over the shared Question Bank.
 * Generic by design — usable for "Add from Question Bank" today, and for any
 * future feature (templates, AI generation, shared collections, import/export)
 * that needs to let a host pick questions from the repository.
 */
export function QuestionBankBrowser({ onAddSelected, onClose }: { onAddSelected: (questions: Question[]) => void; onClose: () => void }) {
  const entries = useQuestionBankStore((s) => s.entries);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<QuestionType | 'all'>('all');
  const [hasMediaOnly, setHasMediaOnly] = useState(false);
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const categories = useMemo(
    () => Array.from(new Set(entries.map((e) => e.question.category).filter(Boolean))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      const question = e.question;
      if (q && !question.text.toLowerCase().includes(q)) return false;
      if (type !== 'all' && question.type !== type) return false;
      if (hasMediaOnly && !(question.mediaId || question.mediaUrl)) return false;
      if (category !== 'all' && question.category !== category) return false;
      if (difficulty !== 'all' && e.difficulty !== difficulty) return false;
      return true;
    });
  }, [entries, query, type, hasMediaOnly, category, difficulty]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSelected() {
    const questions = filtered.filter((e) => selected.has(e.id)).map((e) => e.question);
    if (questions.length === 0) return;
    onAddSelected(questions);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Question Bank</h3>
          <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search question text…"
            autoFocus
          />
          <div className={styles.chips}>
            {TYPE_CHIPS.map((t) => (
              <button key={t} className={`${styles.chip} ${type === t ? styles.chipActive : ''}`} onClick={() => setType(t)}>
                {t === 'all' ? 'All types' : `${TYPE_ICON[t]} ${TYPE_LABEL[t]}`}
              </button>
            ))}
          </div>
          <div className={styles.filterRow}>
            <label className={styles.checkboxField}>
              <input type="checkbox" checked={hasMediaOnly} onChange={(e) => setHasMediaOnly(e.target.checked)} />
              📎 Has media
            </label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className={styles.select} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | 'all')} aria-label="Difficulty">
              <option value="all">Any difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className={styles.body}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>No questions match these filters.</p>
          ) : (
            <ul className={styles.list}>
              {filtered.map((e) => {
                const q = e.question;
                const isSelected = selected.has(e.id);
                return (
                  <li key={e.id} className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}>
                    <button className={styles.rowMain} onClick={() => toggle(e.id)}>
                      <input type="checkbox" checked={isSelected} readOnly tabIndex={-1} />
                      <div className={styles.rowBody}>
                        <span className={styles.qtext}>{q.text || <em>Untitled question</em>}</span>
                        <span className={styles.metaRow}>
                          <Badge tone="secondary">{TYPE_ICON[q.type]} {TYPE_LABEL[q.type]}</Badge>
                          {q.category && <Badge tone="neutral">{q.category}</Badge>}
                          <Badge tone="neutral">{q.points} pts</Badge>
                          {(q.mediaId || q.mediaUrl) && <Badge tone="neutral">📎 Media</Badge>}
                          {e.difficulty && <Badge tone="warning">{e.difficulty}</Badge>}
                          <span className={styles.date}>{new Date(e.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.selectedCount}>{selected.size} selected</span>
          <Button variant="primary" onClick={addSelected} disabled={selected.size === 0}>
            Add {selected.size > 0 ? selected.size : ''} Selected
          </Button>
        </div>
      </div>
    </div>
  );
}
