import React, { useEffect, useMemo, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const getWinnerSymbol = (board) => {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

const TicTacToe = ({ coupleId, user, coupleData }) => {
  const socket = useSocket();

  const user1Id = coupleData?.user1?._id?.toString();
  const user2Id = coupleData?.user2?._id?.toString();
  const myUserId = user?.id?.toString();

  const mySymbol = myUserId && user1Id && myUserId === user1Id ? 'X' : 'O';
  const partnerSymbol = mySymbol === 'X' ? 'O' : 'X';

  const partner = useMemo(() => {
    if (!coupleData?.user1 || !coupleData?.user2) return null;
    return myUserId === user1Id ? coupleData.user2 : coupleData.user1;
  }, [coupleData?.user1, coupleData?.user2, myUserId, user1Id]);

  const [board, setBoard] = useState(Array(9).fill(null));
  const [nextTurn, setNextTurn] = useState(user1Id || myUserId || null);
  const [winner, setWinner] = useState(null);

  const isMyTurn = !winner && nextTurn?.toString() === myUserId;

  useEffect(() => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setNextTurn(user1Id || myUserId || null);
  }, [coupleId, user1Id, myUserId]);

  useEffect(() => {
    if (!socket || !coupleId) return;

    // Join room from this feature as well to avoid cross-tab room race conditions.
    socket.emit('join-room', { coupleId });
    socket.emit('tictactoe-sync-request', { coupleId });

    const onConnect = () => {
      socket.emit('join-room', { coupleId });
      socket.emit('tictactoe-sync-request', { coupleId });
    };

    const syncInterval = setInterval(() => {
      socket.emit('tictactoe-sync-request', { coupleId });
    }, 1500);

    const onUpdate = (payload) => {
      if (!payload || payload.coupleId?.toString() !== coupleId?.toString()) return;
      setBoard(Array.isArray(payload.board) ? payload.board : Array(9).fill(null));
      setNextTurn(payload.nextTurn || null);
      setWinner(payload.winner || null);
    };

    const onReset = (payload) => {
      if (!payload || payload.coupleId?.toString() !== coupleId?.toString()) return;
      setBoard(Array(9).fill(null));
      setWinner(null);
      setNextTurn(user1Id || myUserId || null);
    };

    socket.on('connect', onConnect);
    socket.on('tictactoe-update', onUpdate);
    socket.on('tictactoe-reset', onReset);

    return () => {
      clearInterval(syncInterval);
      socket.off('connect', onConnect);
      socket.off('tictactoe-update', onUpdate);
      socket.off('tictactoe-reset', onReset);
    };
  }, [socket, coupleId, user1Id, myUserId]);

  const handleCellClick = (index) => {
    if (!socket || !coupleId) return;
    if (!isMyTurn) return;
    if (board[index] || winner) return;

    const nextBoard = [...board];
    nextBoard[index] = mySymbol;

    const winnerSymbol = getWinnerSymbol(nextBoard);
    let nextWinner = null;

    if (winnerSymbol === 'X') nextWinner = user1Id;
    if (winnerSymbol === 'O') nextWinner = user2Id;
    if (!winnerSymbol && nextBoard.every((cell) => cell)) nextWinner = 'draw';

    const payload = {
      coupleId,
      board: nextBoard,
      nextTurn: nextWinner ? null : (mySymbol === 'X' ? user2Id : user1Id),
      winner: nextWinner
    };

    setBoard(payload.board);
    setNextTurn(payload.nextTurn);
    setWinner(payload.winner);

    socket.emit('tictactoe-move', payload);
  };

  const handleRestart = () => {
    if (!socket || !coupleId) return;
    socket.emit('tictactoe-restart', { coupleId });
  };

  const statusText = useMemo(() => {
    if (winner === 'draw') return "It's a draw 💞";
    if (winner) {
      return winner?.toString() === myUserId
        ? 'You won this round!'
        : `${partner?.name || 'Partner'} won this round!`;
    }
    if (isMyTurn) return `Your turn (${mySymbol})`;
    return `Waiting for ${partner?.name || 'Partner'}... (${partnerSymbol})`;
  }, [winner, myUserId, partner?.name, isMyTurn, mySymbol, partnerSymbol]);

  return (
    <div className="h-full min-h-0 rounded-2xl border border-white/40 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-rose-50/80 via-pink-50/60 to-purple-50/70">
      <div className="max-w-xl mx-auto ustwo-glass rounded-2xl p-4 sm:p-6 border border-white/60">
        <h2 className="text-2xl font-black ustwo-text-gradient">Shared Tic-Tac-Toe</h2>
        <p className="text-sm text-gray-600 mt-1">Play together in real time.</p>

        <div className="mt-4 mb-4 rounded-xl bg-white/60 border border-pink-100 px-4 py-3">
          <p className="font-semibold text-gray-800">{statusText}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCellClick(index)}
              disabled={!isMyTurn || Boolean(cell) || Boolean(winner)}
              className="bg-white/50 hover:bg-white/80 disabled:hover:bg-white/50 disabled:opacity-70 backdrop-blur-md rounded-xl text-4xl aspect-square flex items-center justify-center transition-all shadow-sm border border-white/60"
            >
              <span className={cell === 'X' ? 'text-rose-500 font-black' : 'text-violet-500 font-black'}>{cell}</span>
            </button>
          ))}
        </div>

        {winner ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={handleRestart}
              className="ustwo-brand-gradient text-white rounded-xl px-5 py-2.5 font-semibold"
            >
              Play Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TicTacToe;
