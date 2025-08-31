import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { UrlImageFetcher } from './components/UrlImageFetcher';
import { Spinner } from './components/Spinner';
import { ApiKeyModal } from './components/ApiKeyModal';
import { generateTryOnImage } from './services/geminiService';
import type { ImageData } from './types';

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);


const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ImageData | null>(null);
  const [topImage, setTopImage] = useState<ImageData | null>(null);
  const [trousersImage, setTrousersImage] = useState<ImageData | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [canShare, setCanShare] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (navigator.share) {
      setCanShare(true);
    }
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
        setApiKey(storedKey);
    } else {
        setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    if (key.trim()) {
        setApiKey(key);
        localStorage.setItem('gemini-api-key', key);
        setIsApiKeyModalOpen(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError('Please set your Google AI API key to continue.');
      setIsApiKeyModalOpen(true);
      return;
    }
    if (!personImage) {
      setError('Please upload a photo of a person.');
      return;
    }
    if (!topImage && !trousersImage) {
      setError('Please upload at least one clothing item.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutputImage(null);

    try {
      const clothingItems = {
        ...(topImage && { top: topImage }),
        ...(trousersImage && { trousers: trousersImage }),
      };
      const result = await generateTryOnImage(apiKey, personImage, clothingItems);
      if(result) {
        setOutputImage(result);
      } else {
        setError('The AI could not generate an image. Please try different images.');
      }
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        if (e.message === 'RATE_LIMIT_EXCEEDED') {
            setError(
                <>
                    You've hit the request limit. Please chill for a minute and try again.
                    <br />
                    For higher limits,{' '}
                    <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer" className="underline text-cyan-400 hover:text-cyan-300">
                        check your plan & billing details
                    </a>.
                </>
            );
        } else if (e.message === 'INVALID_API_KEY') {
            setError(<>Your API Key is invalid. Please enter a valid key. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-cyan-400 hover:text-cyan-300">Get a new key here.</a></>);
            localStorage.removeItem('gemini-api-key');
            setApiKey(null);
            setIsApiKeyModalOpen(true);
        } else {
             setError('An error occurred while generating the image. Please check the console for details.');
        }
      } else {
         setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, personImage, topImage, trousersImage]);

  const handleShare = async () => {
    if (!outputImage || !navigator.share) {
      alert("Sharing is not supported on this browser or there is no image to share.");
      return;
    }

    try {
      const fileName = 'virtual-try-on.png';
      
      const response = await fetch(outputImage);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Virtual Try-On',
          text: 'Check out my new look created with the Virtual Try-On AI!',
        });
      } else {
        alert("Your browser doesn't support sharing this file.");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        alert('An error occurred while sharing the image.');
      }
    }
  };

  const canGenerate = personImage && (topImage || trousersImage) && !isLoading;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col font-sans">
      <Header />
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onSave={handleSaveApiKey}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400">
              AI Virtual Try-On
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
              Style your avatar. Upload a photo and clothes to generate a fresh look in seconds.
            </p>
          </div>
          
          <div className="bg-gray-800/50 rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-700 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className="w-full">
                  <h3 className="text-xl font-bold text-center text-gray-200 mb-4">1. The Person</h3>
                  <ImageUploader value={personImage} onImageUpload={setPersonImage} />
              </div>
              <UrlImageFetcher title="2. The Top" value={topImage} onImageUpload={setTopImage} />
              <UrlImageFetcher title="3. The Trousers" value={trousersImage} onImageUpload={setTrousersImage} />
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`px-10 py-4 text-lg font-bold text-white rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-400 transform hover:scale-105 ${
                canGenerate ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 glow-on-hover' : 'bg-gray-600 cursor-not-allowed opacity-70'
              }`}
              aria-label={isLoading ? "Generating your virtual try-on" : "Generate virtual try-on"}
            >
              {isLoading ? 'Generating...' : '✨ Generate Fit'}
            </button>
          </div>
          
          {(isLoading || error || outputImage) && (
             <div className="mt-10">
                <div className="w-full max-w-2xl mx-auto bg-gray-800/50 rounded-3xl shadow-2xl p-4 sm:p-6 min-h-[300px] flex flex-col items-center justify-center border border-gray-700">
                   {isLoading && <Spinner />}
                   {error && (
                    <div className="text-center text-red-400 font-medium p-4 bg-red-900/50 rounded-2xl border border-red-500/50">
                      <h3 className="font-bold text-lg mb-2">Something Went Wrong</h3>
                      <p className="text-sm">{error}</p>
                    </div>
                   )}
                   {outputImage && (
                     <div className="w-full">
                        <img 
                          src={outputImage} 
                          alt="Generated virtual try-on"
                          className="rounded-2xl shadow-lg object-contain max-h-[70vh] w-full" 
                        />
                        <div className="text-center mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href={outputImage}
                                download="virtual-try-on.png"
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all"
                                aria-label="Download generated image"
                            >
                                <DownloadIcon />
                                Download
                            </a>
                            {canShare && (
                                <button
                                    onClick={handleShare}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-full shadow-sm text-gray-200 bg-gray-700/50 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all"
                                    aria-label="Share generated image"
                                >
                                    <ShareIcon />
                                    Share
                                </button>
                            )}
                        </div>
                     </div>
                   )}
                 </div>
             </div>
          )}

        </div>
      </main>
       <footer className="text-center p-6 text-gray-500 text-sm">
        <p>Powered by Google's Gemini AI</p>
        <button onClick={() => setIsApiKeyModalOpen(true)} className="mt-2 text-cyan-400 hover:text-cyan-300 underline text-xs">
          Edit API Key
        </button>
      </footer>
    </div>
  );
};

export default App;
