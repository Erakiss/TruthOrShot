import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { initDatabase, getRandomCard, Card } from './database';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, withSpring } from 'react-native-reanimated';
import PlayingCard from './PlayingCard';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Image, PanResponder, ImageBackground, Animated as RNAnimated } from 'react-native';

type Player = {
  name: string;
  gender: 'M' | 'F';
  score: number;
};

type GameState = 'setup' | 'playing';

export default function App() {
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [chosenType, setChosenType] = useState<'ACTION' | 'VERITE' | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- LOGIQUE SWIPE (TINDER) CORRIGÉE ---
  const isFlippedRef = useRef(false);
  useEffect(() => { isFlippedRef.current = isFlipped; }, [isFlipped]);

  const swipePan = useRef(new RNAnimated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Le swipe ne s'active que si la carte est retournée et qu'on bouge un peu le doigt
        return isFlippedRef.current && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: RNAnimated.event(
        [null, { dx: swipePan.x, dy: swipePan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          RNAnimated.timing(swipePan, { toValue: { x: 500, y: 0 }, duration: 250, useNativeDriver: false }).start(() => handleFail());
        } else if (gestureState.dx < -120) {
          RNAnimated.timing(swipePan, { toValue: { x: -500, y: 0 }, duration: 250, useNativeDriver: false }).start(() => handleSuccess());
        } else {
          // Rebond fluide pour revenir pile au centre si on n'a pas swipé assez loin
          RNAnimated.spring(swipePan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  const swipeRotation = swipePan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-15deg', '0deg', '15deg']
  });

  // --- COULEURS D'ÉCRAN PROGRESSIVES ---
  const bgGreenOpacity = swipePan.x.interpolate({
    inputRange: [-200, -50, 0],
    outputRange: [0.8, 0, 0], // Devient vert jusqu'à 80% d'opacité en allant à gauche
    extrapolate: 'clamp'
  });

  const bgRedOpacity = swipePan.x.interpolate({
    inputRange: [0, 50, 200],
    outputRange: [0, 0, 0.8], // Devient rouge jusqu'à 80% d'opacité en allant à droite
    extrapolate: 'clamp'
  });

  // --- ANIMATIONS D'ENTRÉE ET DE RETOURNEMENT ---
  const flipRotation = useSharedValue(0);
  const drawTranslateY = useSharedValue(800); // La carte commence hors de l'écran (en bas)
  const drawScale = useSharedValue(0.5); // Elle commence toute petite

  const drawAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: drawTranslateY.value },
        { scale: drawScale.value }
      ]
    };
  });

  const flipToFront = () => {
    setIsFlipped(true);
    flipRotation.value = withTiming(180, { duration: 600 });
  };

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return { transform: [{ rotateY: `${spin}deg` }] };
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return { transform: [{ rotateY: `${spin}deg` }] };
  });

  // --- GESTION DES JOUEURS ---
  const [inputText, setInputText] = useState('');
  const [selectedGender, setSelectedGender] = useState<'M' | 'F'>('M');
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Victor', gender: 'M', score: 0 },
    { name: 'Julie', gender: 'F', score: 0 }
  ]);

  const handleAddPlayer = () => {
    if (inputText.trim().length > 0 && players.length < 10) {
      setPlayers([...players, { name: inputText.trim(), gender: selectedGender, score: 0 }]);
      setInputText('');
    }
  };

  const handleRemovePlayer = (indexToRemove: number) => {
    setPlayers(players.filter((_, index) => index !== indexToRemove));
  };

  // --- LOGIQUE DU JEU ---
  const startGame = () => {
    setGameState('playing');
    setCurrentPlayerIndex(0);
    setChosenType(null);
    setCurrentCard(null);
  };

  const nextTurn = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    setChosenType(null);
    setCurrentCard(null);
    setIsFlipped(false);
    flipRotation.value = 0;
    drawTranslateY.value = 800;
    drawScale.value = 0.5;
    swipePan.setValue({ x: 0, y: 0 }); 
  };

  const handleSuccess = () => {
    nextTurn();
  };

  const handleFail = () => {
    if (currentCard) {
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].score += currentCard.shots; 
      setPlayers(updatedPlayers);
    }
    nextTurn();
  };

  const handleDrawCard = async (difficulty: 'SOFT' | 'FUN' | 'HOT') => {
    if (chosenType) {
      const currentPlayer = players[currentPlayerIndex];
      
      const card = await getRandomCard(chosenType, difficulty, currentPlayer.gender);
      
      if (card) {
        setCurrentCard(card);
        drawTranslateY.value = withSpring(0, { damping: 14, stiffness: 100 });
        drawScale.value = withSpring(1, { damping: 14, stiffness: 100 });
        setTimeout(() => flipToFront(), 800);
      } else {
        alert("Oups, aucune carte trouvée pour ce niveau et ce genre !");
      }
    }
  };

  // ================= AFFICHAGE DU JEU =================
  if (gameState === 'playing') {
    const currentPlayer = players[currentPlayerIndex];

    return (
      <View style={styles.webContainer}>
        <ImageBackground 
          source={require('./assets/tapis.jpg')} 
          style={styles.playmatBackground}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.gameContainer}>
            
            <TouchableOpacity style={styles.homeButton} onPress={() => setGameState('setup')}>
              <MaterialIcons name="home" size={32} color="#aaa" />
            </TouchableOpacity>

            <Text style={styles.turnSubtitle}>C'est au tour de</Text>
            <Text style={[styles.turnName, currentPlayer.gender === 'M' ? styles.textMale : styles.textFemale]}>
              {currentPlayer.name}
            </Text>
            
            <Text style={styles.scoreText}>Gorgées accumulées : {currentPlayer.score} 🍺</Text>

            {currentCard ? (
              <>
                {/* ÉCRAN VERT PROGRESSIF (FAIT) */}
                <RNAnimated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#28a745', opacity: bgGreenOpacity, justifyContent: 'center', alignItems: 'center', zIndex: 0 }]} pointerEvents="none">
                  <Text style={{ fontSize: 60, fontWeight: '900', color: 'white', transform: [{ rotate: '-15deg' }] }}>FAIT ! 😎</Text>
                </RNAnimated.View>

                {/* ÉCRAN ROUGE PROGRESSIF (REFUSÉ) */}
                <RNAnimated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#dc3545', opacity: bgRedOpacity, justifyContent: 'center', alignItems: 'center', zIndex: 0 }]} pointerEvents="none">
                  <Text style={{ fontSize: 60, fontWeight: '900', color: 'white', transform: [{ rotate: '15deg' }] }}>REFUSÉ ! 🥴</Text>
                </RNAnimated.View>

                {/* LA CARTE */}
                <RNAnimated.View 
                  style={{ zIndex: 10, transform: [{ translateX: swipePan.x }, { translateY: swipePan.y }, { rotate: swipeRotation }] }} 
                  {...panResponder.panHandlers}
                >
                  <Animated.View style={drawAnimatedStyle}>
                    <PlayingCard 
                      difficulty={currentCard.difficulty}
                      isFlipped={isFlipped}
                      onFlip={flipToFront}
                      backAnimatedStyle={backAnimatedStyle}
                      frontAnimatedStyle={frontAnimatedStyle}
                    >
                      <Text style={styles.cardTypeLabel}>{currentCard.type} • {currentCard.difficulty}</Text>
                      <Text style={styles.cardMainText}>{currentCard.content}</Text>
                      <Text style={styles.penaltyText}>Pénalité : {currentCard.shots} 🍺</Text>
                      
                      {isFlipped && (
                        <View style={styles.swipeGuideContainer}>
                          <Text style={styles.swipeGuideText}>👈 Fait</Text>
                          <Text style={styles.swipeGuideText}>Refusé 👉</Text>
                        </View>
                      )}
                    </PlayingCard>
                  </Animated.View>
                </RNAnimated.View>
              </>
            ) : chosenType ? (
              
              <View style={styles.difficultyContainer}>
                <Text style={styles.instructionText}>Pioche dans le tas de ton choix :</Text>
                <View style={styles.decksRow}>
                  <TouchableOpacity style={styles.deckBtn} onPress={() => handleDrawCard('SOFT')}>
                    <Image source={require('./assets/card_green.png')} style={styles.deckImage} />
                    <Text style={styles.deckLabel}>SOFT 🟢</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deckBtn} onPress={() => handleDrawCard('FUN')}>
                    <Image source={require('./assets/card_orange.png')} style={styles.deckImage} />
                    <Text style={styles.deckLabel}>FUN 🟠</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deckBtn} onPress={() => handleDrawCard('HOT')}>
                    <Image source={require('./assets/card_red.png')} style={styles.deckImage} />
                    <Text style={styles.deckLabel}>HOT 🔴</Text>
                  </TouchableOpacity>
                </View>
              </View>

            ) : (
              
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
        </ImageBackground>
      </View>
    );
  }

  // ================= AFFICHAGE DU MENU PRINCIPAL =================
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>Truth Or Shot ! 🍻</Text>
      
      <View style={styles.genderSelector}>
        <TouchableOpacity style={[styles.genderBtn, selectedGender === 'M' && styles.genderBtnActiveM]} onPress={() => setSelectedGender('M')}>
          <Text style={styles.genderText}>👦 Garçon</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.genderBtn, selectedGender === 'F' && styles.genderBtnActiveF]} onPress={() => setSelectedGender('F')}>
          <Text style={styles.genderText}>👧 Fille</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Prénom..." placeholderTextColor="#888" value={inputText} onChangeText={setInputText} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={players} renderItem={({ item, index }) => (
        <View style={[styles.playerCard, item.gender === 'M' ? styles.cardMale : styles.cardFemale]}>
          <Text style={styles.playerName}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleRemovePlayer(index)}><Text>❌</Text></TouchableOpacity>
        </View>
      )} />

      {players.length >= 2 && (
        <TouchableOpacity style={styles.playButton} onPress={startGame}>
          <Text style={styles.playButtonText}>JOUER 🚀</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  // --- Conteneur global et fond ---
  webContainer: {flex: 1,backgroundColor: '#0f0f0f', alignItems: 'center',justifyContent: 'center'},
  playmatBackground: { width: '100%', height: '100%',maxWidth: 1400,maxHeight: 900,overflow: 'hidden',borderRadius: Platform.OS === 'web' ? 20 : 0},
  gameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 20 },
  
  // --- Textes du jeu ---
  homeButton: { position: 'absolute', top: 50, left: 20 },
  turnSubtitle: { color: '#aaa', fontSize: 20 },
  turnName: { fontSize: 40, fontWeight: '900', color: '#fff' },
  textMale: { color: '#00bfff' },
  textFemale: { color: '#ff69b4' },
  scoreText: { color: '#ff007f', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  title: { color: '#ff007f', fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  instructionText: { color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 10 },

  // --- Menu des joueurs ---
  genderSelector: { flexDirection: 'row', marginBottom: 10 },
  genderBtn: { flex: 1, padding: 10, backgroundColor: '#1e1e1e', borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  genderBtnActiveM: { backgroundColor: '#00bfff' },
  genderBtnActiveF: { backgroundColor: '#ff69b4' },
  genderText: { color: '#fff' },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#1e1e1e', color: '#fff', height: 50, borderRadius: 10, paddingHorizontal: 15 },
  addButton: { backgroundColor: '#8a2be2', width: 50, borderRadius: 10, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  playerCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 5 },
  cardMale: { backgroundColor: '#1a2a3a', borderLeftColor: '#00bfff' },
  cardFemale: { backgroundColor: '#3a1a2a', borderLeftColor: '#ff69b4' },
  playerName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  playButton: { backgroundColor: '#28a745', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 40 },
  playButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  // --- Boutons Action/Vérité ---
  choiceContainer: { width: '100%', gap: 20 },
  choiceButton: { padding: 30, borderRadius: 20, alignItems: 'center' },
  actionButton: { backgroundColor: '#ff007f' },
  truthButton: { backgroundColor: '#8a2be2' },
  choiceText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  difficultyContainer: { width: '100%', gap: 15 },

  // --- Paquets de cartes (Pioche) ---
  decksRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, width: '100%', marginTop: 20 },
  deckBtn: { alignItems: 'center' },
  deckImage: { width: 180, height: 270, borderRadius: 7, borderWidth: 3, borderColor: '#333' },
  deckLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 10 },

  // --- Contenu de la PlayingCard ---
  cardTypeLabel: { color: '#888', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  cardMainText: { color: '#222', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  penaltyText: { color: '#ff007f', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  
  // --- Textes d'aide au Swipe ---
  swipeGuideContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 40, paddingHorizontal: 10 },
  swipeGuideText: { color: '#ccc', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase' }
});