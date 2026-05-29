import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// 1. On importe les fonctions et le type de notre base de données
import { initDatabase, getRandomCard, Card } from './database';

type Player = {
  name: string;
  gender: 'M' | 'F';
};

type GameState = 'setup' | 'playing';

export default function App() {
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  // --- ÉTATS GLOBAUX ---
  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  // --- ÉTATS DU TOUR EN COURS ---
  // Stocke si le joueur a cliqué sur Action ou Vérité
  const [chosenType, setChosenType] = useState<'ACTION' | 'VERITE' | null>(null);
  // Stocke la carte tirée depuis la base de données
  const [currentCard, setCurrentCard] = useState<Card | null>(null);

  const [inputText, setInputText] = useState('');
  const [selectedGender, setSelectedGender] = useState<'M' | 'F'>('M');
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Victor', gender: 'M' },
    { name: 'Julie', gender: 'F' }
  ]);

  const handleAddPlayer = () => {
    if (inputText.trim().length > 0 && players.length < 10) {
      setPlayers([...players, { name: inputText.trim(), gender: selectedGender }]);
      setInputText('');
    }
  };

  const handleRemovePlayer = (indexToRemove: number) => {
    setPlayers(players.filter((_, index) => index !== indexToRemove));
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentPlayerIndex(0);
    setChosenType(null);
    setCurrentCard(null);
  };

  const nextTurn = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    // On réinitialise l'écran pour le joueur suivant
    setChosenType(null);
    setCurrentCard(null);
  };

  // 2. Fonction appelée quand on clique sur un niveau de difficulté
  const handleDrawCard = async (difficulty: 'SOFT' | 'FUN' | 'HOT') => {
    if (chosenType) {
      // On interroge SQLite
      const card = await getRandomCard(chosenType, difficulty);
      // On met la carte dans l'état (ce qui va mettre à jour l'écran instantanément)
      setCurrentCard(card);
    }
  };

  // --- ÉCRAN DE JEU ---
  if (gameState === 'playing') {
    const currentPlayer = players[currentPlayerIndex];

    return (
      <SafeAreaView style={styles.gameContainer}>
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => {
            setGameState('setup');
            setChosenType(null);
            setCurrentCard(null);
          }}
        >
          <MaterialIcons name="home" size={32} color="#aaa" />
        </TouchableOpacity>

        <Text style={styles.turnSubtitle}>C'est au tour de</Text>
        <Text style={[styles.turnName, currentPlayer.gender === 'M' ? styles.textMale : styles.textFemale]}>
          {currentPlayer.name}
        </Text>

        {/* --- LE RENDU CONDITIONNEL MAGIQUE --- */}
        {currentCard ? (
          // ÉTAPE 3 : La carte est affichée
          <View style={styles.cardDisplay}>
            <Text style={styles.cardType}>{currentCard.type} • {currentCard.difficulty}</Text>
            <Text style={styles.cardContent}>{currentCard.content}</Text>
            <Text style={styles.cardShots}>Pénalité : {currentCard.shots} gorgée(s) 🍺</Text>
            
            <View style={styles.cardButtons}>
              <TouchableOpacity style={styles.successButton} onPress={nextTurn}>
                <Text style={styles.btnText}>C'est fait ! 😎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.failButton} onPress={nextTurn}>
                <Text style={styles.btnText}>Refusé 🥴</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : chosenType ? (
          // ÉTAPE 2 : Choix de la difficulté
          <View style={styles.difficultyContainer}>
            <Text style={styles.instructionText}>Choisis ton niveau :</Text>
            <TouchableOpacity style={[styles.diffBtn, styles.softBtn]} onPress={() => handleDrawCard('SOFT')}>
              <Text style={styles.diffText}>SOFT 🟢</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.diffBtn, styles.funBtn]} onPress={() => handleDrawCard('FUN')}>
              <Text style={styles.diffText}>FUN 🟠</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.diffBtn, styles.hotBtn]} onPress={() => handleDrawCard('HOT')}>
              <Text style={styles.diffText}>HOT 🔴</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ÉTAPE 1 : Choix Action / Vérité
          <View style={styles.choiceContainer}>
            <TouchableOpacity style={[styles.choiceButton, styles.actionButton]} onPress={() => setChosenType('ACTION')}>
              <Text style={styles.choiceText}>ACTION</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.choiceButton, styles.truthButton]} onPress={() => setChosenType('VERITE')}>
              <Text style={styles.choiceText}>VÉRITÉ</Text>
            </TouchableOpacity>
          </View>
        )}

        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // --- ÉCRAN D'ACCUEIL ---
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>Truth Or Shot ! 🍻</Text>

      <View style={styles.genderSelector}>
        <TouchableOpacity style={[styles.genderBtn, selectedGender === 'M' && styles.genderBtnActiveM]} onPress={() => setSelectedGender('M')}>
          <Text style={[styles.genderText, selectedGender === 'M' && styles.genderTextActive]}>👦 Garçon</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.genderBtn, selectedGender === 'F' && styles.genderBtnActiveF]} onPress={() => setSelectedGender('F')}>
          <Text style={[styles.genderText, selectedGender === 'F' && styles.genderTextActive]}>👧 Fille</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Entrer un prénom..." placeholderTextColor="#888" value={inputText} onChangeText={setInputText} onSubmitEditing={handleAddPlayer} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Joueurs ({players.length}/10)</Text>

      <FlatList
        data={players}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={[styles.playerCard, item.gender === 'M' ? styles.cardMale : styles.cardFemale]}>
            <Text style={styles.playerName}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleRemovePlayer(index)}>
              <Text style={styles.deleteText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
      />

      {players.length >= 2 && (
        <TouchableOpacity style={styles.playButton} onPress={startGame}>
          <Text style={styles.playButtonText}>JOUER 🚀</Text>
        </TouchableOpacity>
      )}
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Accueil
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 20 },
  title: { color: '#ff007f', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase' },
  genderSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  genderBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#1e1e1e', borderRadius: 8, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  genderBtnActiveM: { backgroundColor: '#00bfff', borderColor: '#00bfff' },
  genderBtnActiveF: { backgroundColor: '#ff69b4', borderColor: '#ff69b4' },
  genderText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
  genderTextActive: { color: '#fff' },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1e1e1e', color: '#fff', height: 55, borderRadius: 10, paddingHorizontal: 15, fontSize: 18, borderWidth: 1, borderColor: '#333' },
  addButton: { backgroundColor: '#8a2be2', width: 55, height: 55, borderRadius: 10, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  subtitle: { color: '#aaa', fontSize: 16, marginBottom: 10, fontWeight: '600' },
  list: { flex: 1 },
  playerCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderLeftWidth: 5 },
  cardMale: { backgroundColor: '#1a2a3a', borderLeftColor: '#00bfff' },
  cardFemale: { backgroundColor: '#3a1a2a', borderLeftColor: '#ff69b4' },
  playerName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  deleteText: { fontSize: 16 },
  playButton: { backgroundColor: '#28a745', paddingVertical: 18, borderRadius: 15, marginBottom: 40, shadowColor: '#28a745', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  playButtonText: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2 },
  
  // Jeu
  gameContainer: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 20 },
  homeButton: { position: 'absolute', top: 50, left: 20, padding: 10, zIndex: 10 },
  turnSubtitle: { color: '#aaa', fontSize: 24, fontWeight: '600', marginBottom: 5 },
  turnName: { fontSize: 48, fontWeight: '900', marginBottom: 30, textTransform: 'uppercase', textAlign: 'center' },
  textMale: { color: '#00bfff' },
  textFemale: { color: '#ff69b4' },
  choiceContainer: { width: '100%', gap: 20 },
  choiceButton: { paddingVertical: 30, borderRadius: 20, alignItems: 'center', shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  actionButton: { backgroundColor: '#ff007f', shadowColor: '#ff007f' },
  truthButton: { backgroundColor: '#8a2be2', shadowColor: '#8a2be2' },
  choiceText: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 3 },

  // Nouveaux styles pour les Difficultés
  difficultyContainer: { width: '100%', gap: 15, marginTop: 20 },
  instructionText: { color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },
  diffBtn: { paddingVertical: 20, borderRadius: 15, alignItems: 'center' },
  softBtn: { backgroundColor: '#28a745' },
  funBtn: { backgroundColor: '#fd7e14' },
  hotBtn: { backgroundColor: '#dc3545' },
  diffText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },

  // Nouveaux styles pour la Carte tirée
  cardDisplay: { backgroundColor: '#1e1e1e', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#333', marginTop: 20 },
  cardType: { color: '#888', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
  cardContent: { color: '#fff', fontSize: 26, fontWeight: '600', textAlign: 'center', marginBottom: 30, lineHeight: 35 },
  cardShots: { color: '#ff007f', fontSize: 20, fontWeight: 'bold', marginBottom: 30 },
  cardButtons: { flexDirection: 'row', gap: 15, width: '100%' },
  successButton: { flex: 1, backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  failButton: { flex: 1, backgroundColor: '#333', paddingVertical: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});