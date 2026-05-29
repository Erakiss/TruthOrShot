import * as SQLite from 'expo-sqlite';

// On définit la structure d'une carte pour que TypeScript nous aide
export type Card = {
  id: number;
  type: 'ACTION' | 'VERITE';
  difficulty: 'SOFT' | 'FUN' | 'HOT';
  content: string;
  shots: number;
};

// Fonction pour initialiser la BDD et la remplir avec des données de test
export async function initDatabase() {
  // Ouvre ou crée le fichier de base de données en local
  const db = await SQLite.openDatabaseAsync('truthorshot.db');

  // 1. Création de la table (équivalent de ton CREATE TABLE)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      content TEXT NOT NULL,
      shots INTEGER NOT NULL
    );
  `);

  // 2. Vérifier si la table est vide
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  
  // 3. Si elle est vide, on injecte nos premières cartes de test !
  if (result && result.count === 0) {
    console.log("Base de données vide : Insertion des cartes par défaut...");
    
    // Quelques données pour tester nos 3 niveaux et nos pénalités (shots)
    const initialCards = [
      { type: 'ACTION', difficulty: 'SOFT', content: 'Fais un clin d\'œil au joueur de ton choix.', shots: 1 },
      { type: 'VERITE', difficulty: 'SOFT', content: 'Quel est ton pire défaut ?', shots: 1 },
      { type: 'ACTION', difficulty: 'FUN', content: 'Imite un accent étranger jusqu\'à ton prochain tour.', shots: 2 },
      { type: 'VERITE', difficulty: 'FUN', content: 'Raconte la pire honte de ta vie.', shots: 2 },
      { type: 'ACTION', difficulty: 'HOT', content: 'Fais un massage des épaules de 30 secondes au joueur à ta gauche.', shots: 3 },
      { type: 'VERITE', difficulty: 'HOT', content: 'Quel est ton fantasme le plus inavouable ?', shots: 4 },
    ];

    // On prépare la requête d'insertion
    const statement = await db.prepareAsync(
      'INSERT INTO cards (type, difficulty, content, shots) VALUES ($type, $difficulty, $content, $shots)'
    );

    // On boucle sur nos cartes pour les insérer
    for (const card of initialCards) {
      await statement.executeAsync({
        $type: card.type,
        $difficulty: card.difficulty,
        $content: card.content,
        $shots: card.shots
      });
    }
    
    // On ferme la requête préparée pour libérer la mémoire
    await statement.finalizeAsync();
    console.log("Cartes insérées avec succès !");
  }
}

// Fonction pour tirer une carte aléatoire selon le type et la difficulté
export async function getRandomCard(type: 'ACTION' | 'VERITE', difficulty: 'SOFT' | 'FUN' | 'HOT'): Promise<Card | null> {
  const db = await SQLite.openDatabaseAsync('truthorshot.db');
  
  // ORDER BY RANDOM() est une fonction native très pratique de SQLite !
  const card = await db.getFirstAsync<Card>(
    'SELECT * FROM cards WHERE type = ? AND difficulty = ? ORDER BY RANDOM() LIMIT 1',
    [type, difficulty]
  );
  
  return card;
}