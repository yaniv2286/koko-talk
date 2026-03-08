'use client';

import { useState, useEffect } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

interface VisualAidProps {
  className?: string;
}

export const VisualAid: React.FC<VisualAidProps> = ({ className = '' }) => {
  const { visualAid, setVisualAid } = useVoiceStore();
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Early validation
  if (!visualAid || !visualAid.isVisible) {
    return null;
  }

  if (!visualAid.word) {
    console.error('🖼️ VisualAid: No word provided');
    return null;
  }

  // Reset letter index when visual aid changes
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
        // Fallback to placeholder service
        const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(visualAid.imageQuery)}/400/300.jpg`;
        setImageUrl(fallbackUrl);
      }
    } catch (error) {
      console.error('🖼️ Failed to fetch image:', error);
      // Fallback to placeholder service
      const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(visualAid.imageQuery)}/400/300.jpg`;
      setImageUrl(fallbackUrl);
    } finally {
      setIsLoading(false);
    }
  };

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
  const word = visualAid.word ? visualAid.word.toUpperCase() : '';
  const letters = word ? word.split('') : [];

  // If no letters after validation, don't render
  if (!letters || letters.length === 0) {
    console.error('🖼️ VisualAid: No valid letters to display');
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Let's Spell Together! 🎯</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Image Section */}
        <div className="mb-6">
          {isLoading ? (
            <div className="w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center">
              <div className="text-gray-500">Loading image...</div>
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
            <div className="w-full h-64 bg-gray-200 rounded-2xl flex items-center justify-center">
              <div className="text-gray-500">No image available</div>
            </div>
          )}
        </div>

        {/* Word Display */}
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600 mb-2">Can you spell this word?</p>
          <div className="text-3xl font-bold text-blue-600 mb-4">{word}</div>
        </div>

        {/* Letter Slots */}
        <div className="flex justify-center gap-2 mb-8">
          {letters.map((letter, index) => (
            <div
              key={`${letter}-${index}`}
              className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                index < currentLetterIndex
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
            >
              {index < currentLetterIndex ? letter : '_'}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={resetSpelling}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={nextLetter}
            disabled={currentLetterIndex >= letters.length}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {currentLetterIndex >= letters.length ? 'Complete!' : 'Next Letter'}
          </button>
        </div>

        {/* Completion Message */}
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
