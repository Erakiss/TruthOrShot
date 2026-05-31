import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export type Card = {
  id?: number;
  type: 'ACTION' | 'VERITE';
  difficulty: 'SOFT' | 'FUN' | 'HOT';
  content: string;
  shots: number;
  targetGender?: 'M' | 'F'; // <-- LE NOUVEAU CHAMP OPTIONNEL
};

// Nos cartes de test
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
  { type: 'ACTION', difficulty: 'HOT', content: 'Choisis un joueur et laisse-le te faire un bisou sur la joue ou dans le cou.', shots: 3 },
  { type: 'ACTION', difficulty: 'HOT', content: 'Chuchote quelque chose de coquin à l\'oreille de ton choix.', shots: 3 },
  { type: 'ACTION', difficulty: 'HOT', content: 'Fais une pose suggestive pendant 10 secondes.', shots: 3 },
  
  { type: 'VERITE', difficulty: 'HOT', content: 'As-tu déjà fantasmé sur un prof ou un supérieur ?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'Trouves-tu quelqu\'un du groupe attirant ? Qui ?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'Quel est ton fantasme le plus inavouable ?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'À quel âge as-tu perdu ta viginité?', shots: 4 },
  { type: 'VERITE', difficulty: 'HOT', content: 'Quelle est la partie de ton corps que tu préfères montrer ?', shots: 4 },
  
  // --- NOUVELLES CARTES GENRÉES (TEST) ---
  { type: 'ACTION', difficulty: 'HOT', content: 'Enlève ton soutif sans enlever ton t-shirt, tu as 30 secondes.', shots: 3, targetGender: 'F' }, 
  { type: 'ACTION', difficulty: 'HOT', content: 'Enlève ton t-shirt en utilisant qu\'une seule main.', shots: 3, targetGender: 'M' }, 
  { type: 'VERITE', difficulty: 'FUN', content: 'Quel est le pire tue-l\'amour chez un garçon selon toi ?', shots: 2, targetGender: 'F' },
  { type: 'VERITE', difficulty: 'FUN', content: 'Quel est le pire tue-l\'amour chez une fille selon toi ?', shots: 2, targetGender: 'M' },
];

export async function initDatabase() {
  if (Platform.OS === 'web') return;
  const db = await SQLite.openDatabaseAsync('truthorshot.db');
  
  // ASTUCE : On supprime l'ancienne table pour forcer la recréation avec la nouvelle colonne "targetGender"
  await db.execAsync('DROP TABLE IF EXISTS cards');
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      difficulty TEXT,
      content TEXT,
      shots INTEGER,
      targetGender TEXT
    );
  `);

  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  
  if (result && result.count === 0) {
    const statement = await db.prepareAsync(
      'INSERT INTO cards (type, difficulty, content, shots, targetGender) VALUES ($type, $difficulty, $content, $shots, $targetGender)'
    );

    for (const card of initialCards) {
      await statement.executeAsync({
        $type: card.type,
        $difficulty: card.difficulty,
        $content: card.content,
        $shots: card.shots,
        $targetGender: card.targetGender || null // On met NULL si la carte est mixte
      });
    }
    await statement.finalizeAsync();
  }
}

// On ajoute le paramètre "playerGender" à la pioche
export async function getRandomCard(type: 'ACTION' | 'VERITE', difficulty: 'SOFT' | 'FUN' | 'HOT', playerGender: 'M' | 'F'): Promise<Card | null> {
  if (Platform.OS === 'web') {
    // Sur navigateur : on filtre pour ne garder que les cartes mixtes OU celles du bon sexe
    const filteredCards = initialCards.filter(c => 
      c.type === type && 
      c.difficulty === difficulty &&
      (!c.targetGender || c.targetGender === playerGender)
    );
    if (filteredCards.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * filteredCards.length);
    return filteredCards[randomIndex];
  }

  // Sur mobile : Requête SQL adaptée
  const db = await SQLite.openDatabaseAsync('truthorshot.db');
  const card = await db.getFirstAsync<Card>(
    'SELECT * FROM cards WHERE type = ? AND difficulty = ? AND (targetGender IS NULL OR targetGender = ?) ORDER BY RANDOM() LIMIT 1',
    [type, difficulty, playerGender]
  );
  return card;
}