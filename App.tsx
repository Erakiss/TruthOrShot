import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
// 1. On importe la bibliothèque d'icônes classiques d'Android
import { MaterialIcons } from '@expo/vector-icons';

type Player = {
  name: string;
  gender: 'M' | 'F';
};

type GameState = 'setup' | 'playing';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
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
  };

  const nextTurn = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  };

  // --- ÉCRAN DE JEU ---
  if (gameState === 'playing') {
    const currentPlayer = players[currentPlayerIndex];

    return (
      <SafeAreaView style={styles.gameContainer}>
        {/* 2. Le bouton "Maison" pour revenir au menu */}
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => setGameState('setup')}
        >
          <MaterialIcons name="home" size={32} color="#aaa" />
        </TouchableOpacity>

        <Text style={styles.turnSubtitle}>C'est au tour de</Text>
        <Text style={[
          styles.turnName, 
          currentPlayer.gender === 'M' ? styles.textMale : styles.textFemale
        ]}>
          {currentPlayer.name}
        </Text>

        <View style={styles.choiceContainer}>
          <TouchableOpacity style={[styles.choiceButton, styles.actionButton]}>
            <Text style={styles.choiceText}>ACTION</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.choiceButton, styles.truthButton]}>
            <Text style={styles.choiceText}>VÉRITÉ</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={nextTurn}>
          <Text style={styles.nextButtonText}>Passer au joueur suivant ⏭️</Text>
        </TouchableOpacity>

        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  // --- ÉCRAN D'ACCUEIL ---
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Truth Or Shot ! 🍻</Text>

      <View style={styles.genderSelector}>
        <TouchableOpacity
          style={[styles.genderBtn, selectedGender === 'M' && styles.genderBtnActiveM]}
          onPress={() => setSelectedGender('M')}
        >
          <Text style={[styles.genderText, selectedGender === 'M' && styles.genderTextActive]}>👦 Garçon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.genderBtn, selectedGender === 'F' && styles.genderBtnActiveF]}
          onPress={() => setSelectedGender('F')}
        >
          <Text style={[styles.genderText, selectedGender === 'F' && styles.genderTextActive]}>👧 Fille</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Entrer un prénom..."
          placeholderTextColor="#888"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleAddPlayer}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Joueurs ({players.length}/10)</Text>

      <FlatList
        data={players}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={[
            styles.playerCard, 
            item.gender === 'M' ? styles.cardMale : styles.cardFemale
          ]}>
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
  
  // 3. Le style du bouton retour
  homeButton: {
    position: 'absolute',
    top: 50, // Décale un peu du haut pour éviter les encoches d'écran
    left: 20,
    padding: 10,
    zIndex: 10, // S'assure que le bouton reste toujours cliquable par-dessus le reste
  },

  turnSubtitle: { color: '#aaa', fontSize: 24, fontWeight: '600', marginBottom: 5 },
  turnName: { fontSize: 48, fontWeight: '900', marginBottom: 50, textTransform: 'uppercase', textAlign: 'center' },
  textMale: { color: '#00bfff' },
  textFemale: { color: '#ff69b4' },
  choiceContainer: { width: '100%', gap: 20 },
  choiceButton: { paddingVertical: 30, borderRadius: 20, alignItems: 'center', shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  actionButton: { backgroundColor: '#ff007f', shadowColor: '#ff007f' },
  truthButton: { backgroundColor: '#8a2be2', shadowColor: '#8a2be2' },
  choiceText: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 3 },
  nextButton: { marginTop: 60, padding: 15 },
  nextButtonText: { color: '#888', fontSize: 18, textDecorationLine: 'underline' }
});