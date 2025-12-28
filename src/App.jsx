import React, { useState } from 'react';
import { AlertCircle, Key, Send, ExternalLink, Loader2, Trash2, Copy, Check } from 'lucide-react';

export default function TwitterCommentTool() {
  const [accessKey, setAccessKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [twitterLinks, setTwitterLinks] = useState('');
  const [comments, setComments] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // =====================================================
  // ADD CUSTOMER KEYS HERE - One per line
  // Generate keys at: https://www.uuidgenerator.net/
  // =====================================================
  const VALID_KEYS = [
    'DEMO-2024-ABC123',
    'CUSTOMER-001-XYZ789',
    'PREMIUM-USER-DEF456'
  ];

  const handleAuth = () => {
    if (VALID_KEYS.includes(accessKey.trim())) {
      setIsAuthenticated(true);
      setError('');
      // Store key in browser (optional - removes need to re-enter)
      localStorage.setItem('twitter_tool_key', accessKey.trim());
    } else {
      setError('Invalid access key. Please check and try again.');
    }
  };

  // Check for stored key on load
  React.useEffect(() => {
    const storedKey = localStorage.getItem('twitter_tool_key');
    if (storedKey && VALID_KEYS.includes(storedKey)) {
      setAccessKey(storedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const extractTwitterLinks = (text) => {
    const urlRegex = /https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/g;
    return text.match(urlRegex) || [];
  };

  const generateComments = async () => {
    const links = extractTwitterLinks(twitterLinks);
    
    if (links.length === 0) {
      setError('No valid Twitter/X links found. Please paste tweet URLs.');
      return;
    }
  
    setIsGenerating(true);
    setError('');
    setComments([]);
  
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numComments: links.length })
      });
  
      const data = await response.json();
      const cleanedText = data.text.replace(/```json|```/g, '').trim();
      const generatedComments = JSON.parse(cleanedText);
  
      const pairedData = links.map((link, idx) => ({
        id: idx,
        link,
        comment: generatedComments[idx] || 'Great post! 👍'
      }));
  
      setComments(pairedData);
    } catch (err) {
      setError('Failed to generate comments. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const openTwitterReply = (link, comment) => {
    const tweetId = link.match(/status\/(\d+)/)?.[1];
    
    if (tweetId) {
      const intentUrl = `https://twitter.com/intent/tweet?in_reply_to=${tweetId}&text=${encodeURIComponent(comment)}`;
      window.open(intentUrl, '_blank');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAccessKey('');
    setComments([]);
    setTwitterLinks('');
    localStorage.removeItem('twitter_tool_key');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Key className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Twitter Comment Tool</h1>
          <p className="text-gray-600 text-center mb-6">Enter your access key to continue</p>
          
          <div className="space-y-4">
            <input
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              placeholder="Enter your access key"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            <button
              onClick={handleAuth}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Authenticate
            </button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">Need an access key?</p>
              <p className="text-xs text-blue-600">Contact us to purchase access to this tool.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Twitter Comment Generator</h1>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Twitter Links (one per line or separated by spaces)
              </label>
              {/* <textarea
                value={twitterLinks}
                onChange={(e) => setTwitterLinks(e.target.value)}
                placeholder="https://twitter.com/user/status/123456789&#10;https://x.com/user/status/987654321&#10;..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              /> */}
              <textarea
  value={twitterLinks}
  onChange={(e) => setTwitterLinks(e.target.value)}
  onPaste={(e) => {
    // Prevent default paste behavior
    e.preventDefault();
    
    // Get pasted text from clipboard
    const pastedText = e.clipboardData.getData('text');
    
    // Get current cursor position
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Insert pasted text at cursor position
    const newValue = 
      twitterLinks.substring(0, start) + 
      pastedText + 
      twitterLinks.substring(end);
    
    setTwitterLinks(newValue);
    
    // Set cursor position after pasted content
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + pastedText.length;
    }, 0);
  }}
  placeholder="https://twitter.com/user/status/123456789&#10;https://x.com/user/status/987654321&#10;..."
  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
/>
              <p className="text-xs text-gray-500 mt-2">
                {extractTwitterLinks(twitterLinks).length} valid links detected
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={generateComments}
              disabled={isGenerating || !twitterLinks.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Comments...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Comments
                </>
              )}
            </button>
          </div>
        </div>

        {comments.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Generated Comments ({comments.length})
              </h2>
              <button
                onClick={() => setComments([])}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            <div className="space-y-3">
              {comments.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <p className="text-gray-800 flex-1">{item.comment}</p>
                        <button
                          onClick={() => copyToClipboard(item.comment)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Copy comment"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{item.link}</p>
                    </div>
                    <button
                      onClick={() => openTwitterReply(item.link, item.comment)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 whitespace-nowrap text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open & Comment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}