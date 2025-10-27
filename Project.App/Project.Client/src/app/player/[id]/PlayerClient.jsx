'use client';

import { useState } from 'react';
import AddCreditsModal from '../../components/AddCreditsModal';
import { useAuth } from '@/lib/hooks';
import { userService } from '@/lib/api';

export default function PlayerClient({ _id, initialBalance }) {
  const { user, loading: isLoadingUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(user?.balance || null);

  // Update balance when user data changes
  useState(() => {
    if (user?.balance !== undefined) {
      setBalance(user.balance);
    }
  }, [user]);

  const handleAddCredits = async (e) => {
    e.preventDefault();
    const amount = parseFloat(creditsToAdd);

    if (!user?.id) {
      alert('Player ID not loaded. Please refresh the page.');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      const data = await userService.addCredits(user.id, amount);
      console.log('Credits added successfully. New balance:', data.balance);

      setBalance(data.balance);
      setCreditsToAdd(0);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding credits:', error);
      alert(`Failed to add credits: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCreditsToAdd('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-8 relative overflow-hidden flex items-center justify-center">
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
        {/* Player Name */}
        <h1 className="text-4xl font-bold bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-4 text-center">
          {user?.name || 'Loading...'}
        </h1>
        {/* Player Credits */}
        <div className="bg-black/50 rounded-lg p-4 mb-6 border border-yellow-600 max-w-xs w-full text-center">
          <p className="text-gray-300 text-sm mb-1">Current Credits</p>
          {isLoadingUser ? (
            <p className="text-3xl font-bold text-yellow-400">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-yellow-400">{balance ?? 0} Devito Bucks</p>
          )}
        </div>
        {/* Add Credits Button */}
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:shadow-[0_0_25px_rgba(234,179,8,0.8)] border-2 border-yellow-700"
        >
          Add Credits
        </button>
      </div>

      <AddCreditsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        balance={balance ?? 0}
        creditsToAdd={creditsToAdd}
        setCreditsToAdd={setCreditsToAdd}
        onSubmit={handleAddCredits}
        isLoading={isLoading}
      />
    </div>
  );
}
