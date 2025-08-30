
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { Spinner } from './components/Spinner';
import { generateTryOnImage } from './services/geminiService';
import type { ImageData } from './types';

const ShareIcon = () => (
    <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
);

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ImageData | null>(null);
  const [topImage, setTopImage] = useState<ImageData | null>(null);
  const [trousersImage, setTrousersImage] = useState<ImageData | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState<boolean>(false);

  useEffect(() => {
    if (navigator.share) {
      setCanShare(true);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
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
      const result = await generateTryOnImage(personImage, clothingItems);
      if(result) {
        setOutputImage(result);
      } else {
        setError('The AI could not generate an image. Please try different images.');
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while generating the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [personImage, topImage, trousersImage]);
  
  const handleShare = async () => {
    if (!outputImage || !navigator.share) {
      alert("Sharing is not supported on this browser or there is no image to share.");
      return;
    }

    try {
      const response = await fetch(outputImage);
      const blob = await response.blob();
      const file = new File([blob], 'virtual-try-on.png', { type: blob.type });

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

  // Gracefully handle missing API key, common issue on deployment platforms like Vercel
  if (!process.env.API_KEY) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-red-200">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 text-lg">
            The application is missing a required configuration.
          </p>
          <p className="mt-4 text-gray-600 bg-red-100 p-4 rounded-lg">
            The <code>API_KEY</code> environment variable has not been set. Please make sure it is configured in your deployment environment (e.g., Vercel project settings) for the app to function.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Welcome to the Virtual Try-On experience. Upload a full-body photo of a person and clear images of garments to see the magic happen.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <ImageUploader title="Upload Person" onImageUpload={setPersonImage} />
            <ImageUploader title="Upload Top" onImageUpload={setTopImage} />
            <ImageUploader title="Upload Trousers" onImageUpload={setTrousersImage} />
          </div>

          <div className="text-center mb-8">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`px-8 py-3 text-lg font-semibold text-white rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                canGenerate ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-1' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Generating...' : 'Virtual Try-On'}
            </button>
          </div>
          
          {(isLoading || error || outputImage) && (
             <div className="mt-10 border-t-2 border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Result</h2>
                 <div className="w-full max-w-lg mx-auto p-4 bg-gray-100 rounded-xl min-h-[300px] flex flex-col items-center justify-center">
                   {isLoading && <Spinner />}
                   {error && <p className="text-red-500 text-center font-medium">{error}</p>}
                   {outputImage && (
                     <>
                        <img 
                          src={outputImage} 
                          alt="Generated virtual try-on"
                          className="rounded-lg shadow-xl object-contain max-h-[600px] w-full" 
                        />
                        <div className="text-center mt-6 flex flex-wrap justify-center gap-4">
                            <a
                                href={outputImage}
                                download="virtual-try-on.png"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                                aria-label="Download generated image"
                            >
                                <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download
                            </a>
                            {canShare && (
                                <button
                                    onClick={handleShare}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                                    aria-label="Share generated image"
                                >
                                    <ShareIcon />
                                    Share
                                </button>
                            )}
                        </div>
                     </>
                   )}
                 </div>
             </div>
          )}

        </div>
      </main>
       <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
