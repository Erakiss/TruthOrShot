import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export type Card = {
  id?: number;
  type: 'ACTION' | 'VERITE';
  difficulty: 'SOFT' | 'FUN' | 'HOT';
  content: string;
  shots: number;
};

// On sort nos cartes de test pour pouvoir y accéder directement sur le web
const initialCards: Card[] = [
  { type: 'ACTION', difficulty: 'SOFT', content: 'Fais un clin d\'œil au joueur de ton choix.', shots: 1 },
  { type: 'VERITE', difficulty: 'SOFT', content: 'Quel est ton pire défaut ?', shots: 1 },
  { type: 'ACTION', difficulty: 'FUN', content: 'Imite un accent étranger jusqu\'à ton prochain tour.', shots: 2 },
  { type: 'VERITE', difficulty: 'FUN', content: 'Raconte la pire honte de ta vie.', shots: 2 },
  { type: 'ACTION', difficulty: 'HOT', content: 'Fais un massage des épaules de 30 secondes au joueur à ta gauche.', shots: 3 },
  { type: 'VERITE', difficulty: 'HOT', content: 'Quel est ton fantasme le plus inavouable ?', shots: 4 },
];

export async function initDatabase() {
  // Si on est sur le navigateur web, on coupe la fonction ici
  if (Platform.OS === 'web') {
    console.log("Mode Web détecté : SQLite désactivé, utilisation des cartes de test en mémoire.");
    return;
  }

  // Mode Smartphone (Le vrai SQLite)
  const db = await SQLite.openDatabaseAsync('truthorshot.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      content TEXT NOT NULL,
      shots INTEGER NOT NULL
    );
  `);

  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  
  if (result && result.count === 0) {
    console.log("Base de données vide : Insertion des cartes...");
    const statement = await db.prepareAsync(
      'INSERT INTO cards (type, difficulty, content, shots) VALUES ($type, $difficulty, $content, $shots)'
    );

    for (const card of initialCards) {
      await statement.executeAsync({
        $type: card.type,
        $difficulty: card.difficulty,
        $content: card.content,
        $shots: card.shots
      });
    }
    await statement.finalizeAsync();
  }
}

export async function getRandomCard(type: 'ACTION' | 'VERITE', difficulty: 'SOFT' | 'FUN' | 'HOT'): Promise<Card | null> {
  // Sur navigateur, on pioche simplement une carte au hasard dans notre tableau initialCards
  if (Platform.OS === 'web') {
    const filteredCards = initialCards.filter(c => c.type === type && c.difficulty === difficulty);
    if (filteredCards.length === 0) return null; // Sécurité si la catégorie est vide
    const randomIndex = Math.floor(Math.random() * filteredCards.length);
    return filteredCards[randomIndex];
  }

  // Sur mobile, on interroge la vraie base de données
  const db = await SQLite.openDatabaseAsync('truthorshot.db');
  const card = await db.getFirstAsync<Card>(
    'SELECT * FROM cards WHERE type = $type AND difficulty = $diff ORDER BY RANDOM() LIMIT 1',
    { $type: type, $diff: difficulty } // Utilisation de variables sécurisées
  );
  
  return card;
}