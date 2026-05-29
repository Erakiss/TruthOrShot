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
  // --- SOFT ---
  { type: 'ACTION', difficulty: 'SOFT', content: 'Fais le tour de la maison à cloche-pied.', shots: 1 },
  { type: 'ACTION', difficulty: 'SOFT', content: 'Fais un clin d\'œil au joueur de ton choix.', shots: 1 },
  { type: 'ACTION', difficulty: 'SOFT', content: 'Imite ton animal préféré pendant 30 secondes.', shots: 1 },
  { type: 'ACTION', difficulty: 'SOFT', content: 'Chante le refrain d\'une chanson de Disney.', shots: 1 },
  { type: 'ACTION', difficulty: 'SOFT', content: 'Fais 5 pompes ou squats.', shots: 1 },
  
  { type: 'VERITE', difficulty: 'SOFT', content: 'Combien de douches as-tu prises cette semaine ?', shots: 1 },
  { type: 'VERITE', difficulty: 'SOFT', content: 'Quelle est la dernière chose que tu as cherchée sur Google ?', shots: 1 },
  { type: 'VERITE', difficulty: 'SOFT', content: 'As-tu déjà menti pour éviter une sortie ?', shots: 1 },
  { type: 'VERITE', difficulty: 'SOFT', content: 'Quelle est ta plus grande peur ridicule ?', shots: 1 },
  { type: 'VERITE', difficulty: 'SOFT', content: 'As-tu déjà mangé quelque chose tombé par terre ?', shots: 1 },

  // --- FUN ---
  { type: 'ACTION', difficulty: 'FUN', content: 'Envoie un SMS de drague à la 3ème personne de ton répertoire.', shots: 2 },
  { type: 'ACTION', difficulty: 'FUN', content: 'Imite l\'accent d\'un étranger jusqu\'à ton prochain tour.', shots: 2 },
  { type: 'ACTION', difficulty: 'FUN', content: 'Laisse le joueur à ta droite poster une story sur ton Instagram.', shots: 2 },
  { type: 'ACTION', difficulty: 'FUN', content: 'Danse sans musique pendant 1 minute.', shots: 2 },
  { type: 'ACTION', difficulty: 'FUN', content: 'Fais un moonwalk (ou essaie).', shots: 2 },
  
  { type: 'VERITE', difficulty: 'FUN', content: 'Quel est ton type physique idéal ? (cheveux, taille, yeux...)', shots: 2 },
  { type: 'VERITE', difficulty: 'FUN', content: 'Raconte la pire honte de ta vie.', shots: 2 },
  { type: 'VERITE', difficulty: 'FUN', content: 'Quelle est la chose la plus illégale que tu aies faite ?', shots: 2 },
  { type: 'VERITE', difficulty: 'FUN', content: 'Si tu pouvais être invisible 1h, que ferais-tu ?', shots: 2 },
  { type: 'VERITE', difficulty: 'FUN', content: 'Quel est ton petit surnom mignon quand tu étais petit ?', shots: 2 },

  // --- HOT ---
  { type: 'ACTION', difficulty: 'HOT', content: 'Enlève un vêtement de ton choix.', shots: 3 },
  { type: 'ACTION', difficulty: 'HOT', content: 'Fais un massage des épaules de 30 secondes au joueur à ta gauche.', shots: 3 },
  { type: 'ACTION', difficulty: 'HOT', content: 'Choisis un joueur et laisse-le te faire un bisou dans le cou.', shots: 3 },
  { type: 'ACTION', difficulty: 'HOT', content: 'Chuchote quelque chose de coquin à l\'oreille de ton choix.', shots: 3 },
  { type: 'ACTION', difficulty: 'HOT', content: 'Fais une pose suggestive pendant 10 secondes.', shots: 3 },
  
  { type: 'VERITE', difficulty: 'HOT', content: 'As-tu déjà fantasmé sur un prof ou un supérieur ?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'Trouves-tu quelqu\'un du groupe attirant ? Qui ?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'Quel est ton fantasme le plus inavouable ?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'À quel âge as-tu perdu ton pucelage ?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'Quelle est la partie de ton corps que tu préfères montrer ?', shots: 4 },
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