import React, { useState } from 'react';
import type { ImageData } from '../types';
import { ImageUploader } from './ImageUploader';

interface UrlImageFetcherProps {
  title: string;
  value: ImageData | null;
  onImageUpload: (data: ImageData | null) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const getMimeTypeFromUrl = (url: string): string | null => {
    try {
        const path = new URL(url).pathname;
        const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
        
        switch (extension) {
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.png':
                return 'image/png';
            case '.webp':
                return 'image/webp';
            case '.gif':
                return 'image/gif';
            default:
                return null;
        }
    } catch (e) {
        return null;
    }
}


export const UrlImageFetcher: React.FC<UrlImageFetcherProps> = ({ title, value, onImageUpload }) => {
    const [url, setUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const handleFetch = async () => {
        if (!url.trim()) {
            setFetchError("Please enter a URL.");
            return;
        }
        setIsFetching(true);
        setFetchError(null);
        onImageUpload(null);

        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];

        let success = false;
        let lastError: Error | null = null;

        for (const proxyUrl of proxies) {
            try {
                // Abort fetch after 15 seconds to prevent long waits and timeouts
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                
                const response = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Proxy failed with status: ${response.status}`);
                }
                
                const blob = await response.blob();
                let finalMimeType = blob.type;

                if (!finalMimeType.startsWith('image/')) {
                    const inferredMimeType = getMimeTypeFromUrl(url);
                    if (inferredMimeType) {
                        finalMimeType = inferredMimeType;
                    } else {
                        throw new Error("The fetched file is not a valid image. Ensure you're using a direct link to an image file.");
                    }
                }

                const base64 = await blobToBase64(blob);
                onImageUpload({ base64, mimeType: finalMimeType });
                setUrl('');
                success = true;
                break; // Exit loop on success

            } catch (error) {
                console.error(`Fetch attempt failed with proxy:`, error);
                lastError = error as Error;
            }
        }
        
        if (!success && lastError) {
             let errorMessage = "Could not fetch image. The URL may be invalid or protected.";
             if (lastError.name === 'AbortError' || (lastError.message && lastError.message.includes('408'))) {
                 errorMessage = "Could not fetch image: The request timed out. The server may be busy.";
             } else if (lastError.message.includes('not a valid image')) {
                errorMessage = lastError.message;
             }
             setFetchError(`${errorMessage} Please try again or upload manually.`);
        }

        setIsFetching(false);
    };


    return (
        <div className="w-full">
            <h3 className="text-xl font-bold text-center text-gray-200 mb-4">{title}</h3>
            <div className="relative mb-2">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                    placeholder="or paste direct image link"
                    className="block w-full pl-3 pr-24 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                    disabled={isFetching}
                    aria-label="Image URL input"
                />
                <button
                    onClick={handleFetch}
                    disabled={isFetching || !url}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-r-lg hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-500 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed"
                    aria-label={isFetching ? "Fetching image" : "Fetch image from URL"}
                >
                    {isFetching ? '...' : 'Fetch'}
                </button>
            </div>
            <p className="text-xs text-gray-500 mb-3 px-1 h-6">
                {fetchError ? <span className="text-red-400">{fetchError}</span> : "e.g., Right-click > 'Copy Image Address'"}
            </p>
            <ImageUploader value={value} onImageUpload={onImageUpload} />
        </div>
    );
};