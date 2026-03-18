/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Dices, 
  Gamepad2, 
  History, 
  Info, 
  RotateCcw, 
  Trophy, 
  User,
  ChevronRight,
  ChevronLeft,
  Play,
  Hand,
  ArrowDownCircle
} from 'lucide-react';

// --- Types ---
type GameType = 'SLOTS' | 'BLACKJACK' | 'ROULETTE' | 'HOME';

interface GameState {
  balance: number;
  history: { game: string; amount: number; result: 'WIN' | 'LOSS' | 'PUSH'; timestamp: number }[];
}

// --- Components ---

const Header = ({ balance }: { balance: number }) => (
  <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
        <span className="text-black font-black text-xl">DP</span>
      </div>
      <h1 className="text-xl font-bold tracking-tighter text-white uppercase">Casino</h1>
    </div>
    <div className="flex items-center gap-4">
      <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="font-mono font-bold text-amber-400">${balance.toLocaleString()}</span>
      </div>
      <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
        <User className="w-5 h-5 text-zinc-400" />
      </button>
    </div>
  </header>
);

const Slots = ({ onWin, onLoss, balance }: { onWin: (amt: number) => void; onLoss: (amt: number) => void; balance: number }) => {
  const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍀'];
  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10);

  const spin = () => {
    if (balance < bet || spinning) return;
    setSpinning(true);
    
    // Initial deduction
    onLoss(bet);

    let spinCount = 0;
    const interval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      spinCount++;
      if (spinCount > 20) {
        clearInterval(interval);
        const finalReels = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ];
        setReels(finalReels);
        setSpinning(false);

        // Logic
        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          const multiplier = finalReels[0] === '7️⃣' ? 50 : 10;
          onWin(bet * multiplier);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
          onWin(bet * 2);
        }
      }
    }, 50);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="flex gap-4 p-8 bg-zinc-900 rounded-3xl border-4 border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        {reels.map((symbol, i) => (
          <motion.div 
            key={i}
            animate={spinning ? { y: [0, -20, 20, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.1 }}
            className="w-24 h-32 bg-black rounded-xl flex items-center justify-center text-5xl border border-white/5 shadow-inner"
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl border border-white/5">
          {[10, 50, 100, 500].map(amt => (
            <button 
              key={amt}
              onClick={() => setBet(amt)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${bet === amt ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-zinc-500 hover:text-white'}`}
            >
              ${amt}
            </button>
          ))}
        </div>
        <button 
          onClick={spin}
          disabled={spinning || balance < bet}
          className="group relative px-12 py-4 bg-amber-500 text-black font-black text-xl rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {spinning ? 'Spinning...' : 'Spin'}
          <div className="absolute -inset-1 bg-amber-500/20 blur-xl group-hover:bg-amber-500/40 transition-all rounded-2xl -z-10" />
        </button>
      </div>
    </div>
  );
};

const Blackjack = ({ onWin, onLoss, onPush, balance }: { onWin: (amt: number) => void; onLoss: (amt: number) => void; onPush: () => void; balance: number }) => {
  const [deck, setDeck] = useState<string[]>([]);
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'BETTING' | 'PLAYING' | 'RESULT'>('BETTING');
  const [bet, setBet] = useState(50);
  const [message, setMessage] = useState('');

  const createDeck = () => {
    const suits = ['♠', '♣', '♥', '♦'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck = [];
    for (const suit of suits) {
      for (const value of values) {
        newDeck.push(`${value}${suit}`);
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const getHandValue = (hand: string[]) => {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
      const val = card.slice(0, -1);
      if (['J', 'Q', 'K'].includes(val)) value += 10;
      else if (val === 'A') {
        value += 11;
        aces += 1;
      } else value += parseInt(val);
    }
    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }
    return value;
  };

  const startNewGame = () => {
    if (balance < bet) return;
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('PLAYING');
    setMessage('');
    onLoss(bet);
  };

  const hit = () => {
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);
    if (getHandValue(newHand) > 21) {
      setGameState('RESULT');
      setMessage('Bust! Dealer Wins');
    }
  };

  const stand = () => {
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    while (getHandValue(currentDealerHand) < 17) {
      currentDealerHand.push(currentDeck.pop()!);
    }
    setDealerHand(currentDealerHand);
    setDeck(currentDeck);
    setGameState('RESULT');

    const pVal = getHandValue(playerHand);
    const dVal = getHandValue(currentDealerHand);

    if (dVal > 21 || pVal > dVal) {
      setMessage('You Win!');
      onWin(bet * 2);
    } else if (dVal > pVal) {
      setMessage('Dealer Wins');
    } else {
      setMessage('Push');
      onPush();
      onWin(bet); // Return bet
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 py-8">
      <div className="w-full max-w-2xl bg-emerald-900/20 border border-emerald-500/20 rounded-[40px] p-12 flex flex-col gap-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-500/30 rounded-b-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
        
        {/* Dealer Area */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-500/60">Dealer</span>
          <div className="flex gap-2 min-h-[120px]">
            {dealerHand.map((card, i) => (
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                key={i} 
                className={`w-20 h-28 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg ${gameState === 'PLAYING' && i === 1 ? 'bg-zinc-800 border-2 border-zinc-700' : 'bg-white text-black'}`}
              >
                {gameState === 'PLAYING' && i === 1 ? '?' : card}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Message Overlay */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            >
              <div className="bg-black/80 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10 shadow-2xl">
                <span className="text-3xl font-black uppercase italic tracking-tighter text-amber-500">{message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Area */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 min-h-[120px]">
            {playerHand.map((card, i) => (
              <motion.div 
                initial={{ scale: 0, rotate: 45 }}
                animate={{ scale: 1, rotate: 0 }}
                key={i} 
                className="w-20 h-28 bg-white text-black rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg"
              >
                {card}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-500/60">Player</span>
            <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-xs font-bold">{getHandValue(playerHand)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {gameState === 'BETTING' || gameState === 'RESULT' ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl border border-white/5">
              {[50, 100, 250, 500].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setBet(amt)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${bet === amt ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <button 
              onClick={startNewGame}
              disabled={balance < bet}
              className="px-12 py-4 bg-emerald-500 text-black font-black text-xl rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              Deal Hand
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={hit}
              className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-2xl border border-white/10 hover:bg-zinc-700 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" /> Hit
            </button>
            <button 
              onClick={stand}
              className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Hand className="w-5 h-5" /> Stand
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Roulette = ({ onWin, onLoss, balance }: { onWin: (amt: number) => void; onLoss: (amt: number) => void; balance: number }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [bets, setBets] = useState<{ type: 'RED' | 'BLACK' | 'EVEN' | 'ODD'; amount: number }[]>([]);
  const [currentBetAmount, setCurrentBetAmount] = useState(50);

  const spin = () => {
    if (bets.length === 0 || spinning) return;
    setSpinning(true);
    
    const totalBet = bets.reduce((acc, b) => acc + b.amount, 0);
    if (balance < totalBet) {
      setSpinning(false);
      return;
    }

    onLoss(totalBet);

    setTimeout(() => {
      const num = Math.floor(Math.random() * 37);
      setResult(num);
      setSpinning(false);

      let totalWin = 0;
      const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
      const isBlack = num !== 0 && !isRed;
      const isEven = num !== 0 && num % 2 === 0;
      const isOdd = num !== 0 && num % 2 !== 0;

      bets.forEach(b => {
        if (b.type === 'RED' && isRed) totalWin += b.amount * 2;
        if (b.type === 'BLACK' && isBlack) totalWin += b.amount * 2;
        if (b.type === 'EVEN' && isEven) totalWin += b.amount * 2;
        if (b.type === 'ODD' && isOdd) totalWin += b.amount * 2;
      });

      if (totalWin > 0) onWin(totalWin);
      setBets([]);
    }, 2000);
  };

  const addBet = (type: 'RED' | 'BLACK' | 'EVEN' | 'ODD') => {
    if (spinning) return;
    setBets([...bets, { type, amount: currentBetAmount }]);
  };

  return (
    <div className="flex flex-col items-center gap-12 py-8">
      <div className="relative w-64 h-64 rounded-full border-8 border-zinc-800 bg-zinc-900 flex items-center justify-center shadow-2xl overflow-hidden">
        <motion.div 
          animate={spinning ? { rotate: 3600 } : { rotate: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-full h-full rounded-full border-4 border-white/5 flex items-center justify-center">
             <div className="w-2 h-full bg-white/10 absolute rotate-45" />
             <div className="w-2 h-full bg-white/10 absolute -rotate-45" />
          </div>
        </motion.div>
        <div className="z-10 bg-black w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center shadow-inner">
          <span className="text-4xl font-black text-white">{spinning ? '?' : result ?? '--'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <button onClick={() => addBet('RED')} className="h-20 bg-red-600 rounded-2xl border-b-4 border-red-800 hover:brightness-110 transition-all flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Red</span>
          <span className="font-black text-xl">2:1</span>
        </button>
        <button onClick={() => addBet('BLACK')} className="h-20 bg-zinc-900 rounded-2xl border-b-4 border-black hover:brightness-110 transition-all flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Black</span>
          <span className="font-black text-xl text-white">2:1</span>
        </button>
        <button onClick={() => addBet('EVEN')} className="h-20 bg-zinc-800 rounded-2xl border-b-4 border-zinc-950 hover:brightness-110 transition-all flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Even</span>
          <span className="font-black text-xl text-white">2:1</span>
        </button>
        <button onClick={() => addBet('ODD')} className="h-20 bg-zinc-800 rounded-2xl border-b-4 border-zinc-950 hover:brightness-110 transition-all flex flex-col items-center justify-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Odd</span>
          <span className="font-black text-xl text-white">2:1</span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-2xl border border-white/5">
            {[10, 50, 100, 500].map(amt => (
              <button 
                key={amt}
                onClick={() => setCurrentBetAmount(amt)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${currentBetAmount === amt ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                ${amt}
              </button>
            ))}
          </div>
          <button onClick={() => setBets([])} className="p-4 bg-zinc-900 rounded-2xl border border-white/5 hover:bg-zinc-800 transition-all">
            <RotateCcw className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-500">Current Bets: ${bets.reduce((a, b) => a + b.amount, 0)}</div>
          <button 
            onClick={spin}
            disabled={spinning || bets.length === 0}
            className="px-12 py-4 bg-white text-black font-black text-xl rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            Spin Wheel
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = ({ onSelect }: { onSelect: (game: GameType) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
    {[
      { id: 'SLOTS' as GameType, name: 'Slots', icon: RotateCcw, color: 'bg-amber-500', desc: 'Triple 7s for x50 payout' },
      { id: 'BLACKJACK' as GameType, name: 'Blackjack', icon: Hand, color: 'bg-emerald-500', desc: 'Beat the dealer to 21' },
      { id: 'ROULETTE' as GameType, name: 'Roulette', icon: RotateCcw, color: 'bg-red-500', desc: 'Bet on colors or numbers' },
    ].map(game => (
      <motion.button
        whileHover={{ y: -8 }}
        key={game.id}
        onClick={() => onSelect(game.id)}
        className="group relative bg-zinc-900/50 border border-white/5 rounded-3xl p-8 text-left hover:bg-zinc-900 transition-all overflow-hidden"
      >
        <div className={`w-12 h-12 ${game.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
          <game.icon className="w-6 h-6 text-black" />
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{game.name}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{game.desc}</p>
        <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
          Play Now <ChevronRight className="w-4 h-4 ml-1" />
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <game.icon className="w-24 h-24 text-white" />
        </div>
      </motion.button>
    ))}
  </div>
);

export default function App() {
  const [balance, setBalance] = useState(1000);
  const [currentGame, setCurrentGame] = useState<GameType>('HOME');
  const [history, setHistory] = useState<GameState['history']>([]);

  const handleWin = (amount: number, game: string) => {
    setBalance(prev => prev + amount);
    setHistory(prev => [{ game, amount, result: 'WIN', timestamp: Date.now() }, ...prev].slice(0, 10));
  };

  const handleLoss = (amount: number, game: string) => {
    setBalance(prev => prev - amount);
    setHistory(prev => [{ game, amount, result: 'LOSS', timestamp: Date.now() }, ...prev].slice(0, 10));
  };

  const handlePush = (game: string) => {
    setHistory(prev => [{ game, amount: 0, result: 'PUSH', timestamp: Date.now() }, ...prev].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      <Header balance={balance} />

      <main className="max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {currentGame === 'HOME' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="py-12 flex flex-col items-center text-center">
                <motion.h2 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 mb-4"
                >
                  DP's Casino
                </motion.h2>
                <p className="text-zinc-500 max-w-lg text-lg">
                  Welcome to the digital underground. High stakes, low latency, pure adrenaline.
                </p>
              </div>
              <Home onSelect={setCurrentGame} />
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-8"
            >
              <button 
                onClick={() => setCurrentGame('HOME')}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Lobby</span>
              </button>

              <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl">
                {currentGame === 'SLOTS' && (
                  <Slots 
                    balance={balance} 
                    onWin={(amt) => handleWin(amt, 'Slots')} 
                    onLoss={(amt) => handleLoss(amt, 'Slots')} 
                  />
                )}
                {currentGame === 'BLACKJACK' && (
                  <Blackjack 
                    balance={balance} 
                    onWin={(amt) => handleWin(amt, 'Blackjack')} 
                    onLoss={(amt) => handleLoss(amt, 'Blackjack')} 
                    onPush={() => handlePush('Blackjack')}
                  />
                )}
                {currentGame === 'ROULETTE' && (
                  <Roulette 
                    balance={balance} 
                    onWin={(amt) => handleWin(amt, 'Roulette')} 
                    onLoss={(amt) => handleLoss(amt, 'Roulette')} 
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Activity */}
        <section className="py-12 border-t border-white/5 mt-12">
          <div className="flex items-center gap-2 mb-8">
            <History className="w-5 h-5 text-zinc-500" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recent Activity</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {history.length === 0 ? (
              <div className="col-span-full text-center py-12 text-zinc-600 italic">No activity yet. Place your bets!</div>
            ) : (
              history.map((item, i) => (
                <div key={i} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.game}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.result === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' : item.result === 'LOSS' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                      {item.result}
                    </span>
                  </div>
                  <div className="text-lg font-black tracking-tighter">
                    {item.result === 'WIN' ? '+' : item.result === 'LOSS' ? '-' : ''}${Math.abs(item.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 text-center px-6">
        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
          &copy; 2026 DP'S CASINO. PLAY RESPONSIBLY. NO REAL MONEY INVOLVED.
        </p>
      </footer>
    </div>
  );
}
