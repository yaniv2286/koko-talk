'use client';

import { useState, useEffect } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

interface VisualAidProps {
  className?: string;
}

export const VisualAid = ({ className = '' }: VisualAidProps = {}) => {
  // HOIST ALL HOOKS TO TOP - Rules of Hooks compliance
  const [isMounted, setIsMounted] = useState(false);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { visualAid, setVisualAid } = useVoiceStore();
  
  useEffect(() => setIsMounted(true), []);
  
  const fetchImage = async () => {
    if (!visualAid) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Use Unsplash API or placeholder service for images
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(visualAid.imageQuery)}&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || ''}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.urls.regular);
      } else {
        throw new Error('Failed to fetch image');
      }
    } catch (error) {
      console.error('🖼️ Error fetching image:', error);
      setError('Failed to load image');
      setImageUrl(''); // Clear image on error
    } finally {
      setIsLoading(false);
    }
  };

  // Reset letter index when visual aid changes - moved to top for Rules of Hooks compliance
  useEffect(() => {
    if (visualAid) {
      console.log('🖼️ Visual Aid triggered for:', visualAid.word);
      setCurrentLetterIndex(0);
      setError('');
      fetchImage();
    } else {
      setImageUrl('');
      setCurrentLetterIndex(0);
      setError('');
    }
  }, [visualAid]);

  const handleClose = () => {
    setVisualAid(null);
  };

  const nextLetter = () => {
    if (visualAid && currentLetterIndex < visualAid.word.length) {
      setCurrentLetterIndex(prev => prev + 1);
    }
  };

  const resetSpelling = () => {
    setCurrentLetterIndex(0);
  };

  // Safely get word and letters
  const word = visualAid?.word ? visualAid.word.toUpperCase() : '';
  const letters = word ? word.split('') : [];

  // ALL GUARD CLAUSES MOVED TO END - No hooks can be skipped during render
  if (!isMounted) return null;
  
  if (!visualAid || !visualAid.isVisible) {
    return null;
  }

  if (!visualAid.word) {
    console.error('🖼️ VisualAid: No word provided');
    return null;
  }

  // If no letters after validation, don't render
  if (!letters || letters.length === 0) {
    console.error('🖼️ VisualAid: No valid letters to display');
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="glass-dark rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Let's Spell Together! 🎯</h2>
          <button
            onClick={handleClose}
            className="text-secondary hover:text-primary text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Image Section */}
        <div className="mb-6">
          {isLoading ? (
            <div className="w-full h-64 bg-gray-800/50 rounded-2xl flex items-center justify-center glass">
              <div className="text-secondary">Loading image...</div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl || '/placeholder-image.png'}
              alt={visualAid.imageQuery || 'Visual aid image'}
              className="w-full h-64 object-cover rounded-2xl"
              onError={() => {
                console.error('🖼️ Failed to load image:', imageUrl);
                setError('Image failed to load');
              }}
            />
          ) : (
            <div className="w-full h-64 bg-gray-800/50 rounded-2xl flex items-center justify-center glass">
              <div className="text-secondary">No image available</div>
            </div>
          )}
        </div>

        {/* Word Display */}
        <div className="text-center mb-8">
          <h3 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
            {word}
          </h3>
          <p className="text-secondary">Let's spell it together!</p>
        </div>

        {/* Letter-by-Letter Spelling */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
          {letters.map((letter, index) => (
            <div
              key={`${letter}-${index}`}
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-300 ${
                index < currentLetterIndex
                  ? 'bg-green-500 text-white neon-green'
                  : 'bg-gray-800/50 text-secondary glass'
              }`}
            >
              {index < currentLetterIndex ? letter : '_'}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={resetSpelling}
            className="px-6 py-3 btn-glass rounded-lg font-semibold transition-all"
          >
            Reset
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all neon-green"
          >
            Got it!
          </button>
        </div>
        {currentLetterIndex >= letters.length && (
          <div className="mt-6 text-center">
            <p className="text-xl font-bold text-green-600">Great job! 🎉</p>
            <p className="text-gray-600 mt-2">You spelled {word} correctly!</p>
          </div>
        )}
      </div>
    </div>
  );
};
