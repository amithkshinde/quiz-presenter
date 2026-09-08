import type { Question, Quiz } from '../types/quiz';
import { makeId } from '../utils/id';

function mc(category: string, questionText: string, points: number, timerSeconds: number, hint: string, options: string[], correctIndex: number): Question {
  return {
    id: makeId('q'),
    type: 'multiple-choice',
    category,
    text: questionText,
    points,
    hint,
    timerSeconds,
    options: options.map((label, i) => ({ id: makeId('opt'), text: label, isCorrect: i === correctIndex })),
  };
}

function textQ(category: string, questionText: string, points: number, timerSeconds: number, hint: string, correctText: string): Question {
  return { id: makeId('q'), type: 'text', category, text: questionText, points, hint, timerSeconds, correctText };
}

function imageQ(category: string, questionText: string, points: number, timerSeconds: number, hint: string, correctText: string, mediaUrl: string): Question {
  return { id: makeId('q'), type: 'image', category, text: questionText, points, hint, timerSeconds, correctText, mediaUrl };
}

/**
 * A complete "General Knowledge" quiz used to seed a fresh install — 20
 * questions across easy/medium/hard difficulty (via points) and all three
 * question types, so the product can be evaluated as a real quiz in
 * progress rather than an empty shell. See also: seedDemoSessions.ts, which
 * builds a live in-progress session and a completed session against this
 * exact quiz.
 */
export function seedQuiz(): Quiz {
  const now = new Date().toISOString();
  return {
    id: makeId('quiz'),
    title: 'General Knowledge Night',
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    teams: [
      { id: makeId('team'), name: 'Team Alpha' },
      { id: makeId('team'), name: 'Team Bravo' },
      { id: makeId('team'), name: 'Team Charlie' },
      { id: makeId('team'), name: 'Team Delta' },
    ],
    questions: [
      // ---- Easy (10 pts) ----
      mc('Geography', 'Which is the largest ocean on Earth by surface area?', 10, 20,
        'It borders both Asia and the Americas.',
        ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'], 2),
      mc('Science', 'Which planet is known as the Red Planet?', 10, 20,
        'Its reddish colour comes from iron oxide on its surface.',
        ['Venus', 'Mars', 'Jupiter', 'Mercury'], 1),
      textQ('History', 'In which year did World War II end?', 10, 20,
        'The United Nations was founded the same year.', '1945'),
      mc('Music', 'Which band released the album "Abbey Road"?', 10, 20,
        'They were from Liverpool.',
        ['The Rolling Stones', 'The Beatles', 'Led Zeppelin', 'Pink Floyd'], 1),
      mc('Food & Drink', 'Sushi originated in which country?', 10, 20,
        'Its capital is Tokyo.',
        ['China', 'Thailand', 'Japan', 'South Korea'], 2),

      // ---- Medium (15-20 pts) ----
      mc('Movies', 'Which film won the Academy Award for Best Picture in 1994?', 15, 25,
        'It stars Tom Hanks running across America.',
        ['Pulp Fiction', 'Forrest Gump', 'The Shawshank Redemption', 'Speed'], 1),
      textQ('Literature', "Who wrote the novel '1984'?", 15, 25,
        "He also wrote 'Animal Farm'.", 'George Orwell'),
      mc('Sports', 'How many players does a football (soccer) team have on the field, including the goalkeeper?', 15, 20,
        "It's the same number as a cricket team.",
        ['9', '10', '11', '12'], 2),
      imageQ('Geography', "This photo shows a dramatic mountain landscape. Earth's tallest peak, Everest, rises from this range — name it.", 20, 30,
        'It stretches across five countries, including Nepal and Bhutan.',
        'The Himalayas', 'https://picsum.photos/id/1036/900/500'),
      textQ('History', 'Who was the first President of the United States?', 20, 20,
        'He appears on the one-dollar bill.', 'George Washington'),
      mc('Science', 'What is the chemical symbol for gold?', 20, 20,
        "It comes from the Latin word 'aurum'.",
        ['Go', 'Gd', 'Au', 'Ag'], 2),
      mc('Art', 'Who painted the Mona Lisa?', 20, 20,
        'He also painted "The Last Supper".',
        ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'], 2),

      // ---- Hard (25-30 pts) ----
      textQ('Mythology', 'In Greek mythology, who is the god of the sea?', 25, 25,
        'His Roman equivalent is Neptune.', 'Poseidon'),
      textQ('Geography', 'What is the longest river in the world?', 25, 25,
        'It flows through eleven countries in northeastern Africa.', 'The Nile'),
      mc('Science', 'What is the powerhouse of the cell called?', 25, 25,
        "It's often abbreviated using its first two letters.",
        ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], 2),
      mc('History', 'The Berlin Wall fell in which year?', 25, 25,
        'It was the same year as the Tiananmen Square protests.',
        ['1987', '1989', '1991', '1993'], 1),
      imageQ('Geography', "This vast, arid landscape belongs to the world's largest hot desert. Name it.", 30, 30,
        'It covers most of North Africa.',
        'The Sahara', 'https://picsum.photos/id/1018/900/500'),
      textQ('Technology', "What does 'HTTP' stand for?", 30, 30,
        "It's the foundation of data communication on the web.", 'HyperText Transfer Protocol'),
      textQ('Music', "Which composer wrote his 'Ninth Symphony' while completely deaf?", 30, 30,
        'He was born in Bonn, Germany.', 'Ludwig van Beethoven'),
      mc('Sports', 'Which country has won the most FIFA World Cup titles?', 30, 25,
        'Their national team is nicknamed "Seleção".',
        ['Germany', 'Argentina', 'Italy', 'Brazil'], 3),
    ],
  };
}
