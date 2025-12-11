import React, { useEffect, useRef } from 'react';

const ExternalService: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            console.log("Message from:", event.origin);
            
            // Logic from provided snippet for reload
            if (event.data && event.data.type === 'reload') {
                 if (iframeRef.current) {
                    // Reloading just the iframe instead of the whole page to preserve SPA state
                    iframeRef.current.src = iframeRef.current.src;
                }
            }

            if (event.data && event.data.type === 'url' && event.data.url) {
                window.open(event.data.url, '_blank');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="w-full h-full bg-white flex flex-col">
            <iframe 
                ref={iframeRef}
                id="contentFrame" 
                src="https://app.emergent.sh/loading-preview?host=html-recovery.preview.emergentagent.com" 
                allowFullScreen 
                className="flex-grow w-full border-none h-[calc(100vh-5rem)]" 
                title="External Preview"
            />
        </div>
    );
};

export default ExternalService;