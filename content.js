// Add CSS styles
const style = document.createElement('style');
style.textContent = `
.pre-viral-tweet {
    border: 2px solid #1DA1F2 !important;
    border-radius: 10px !important;
    padding: 10px !important;
    position: relative !important;
    z-index: 1 !important;
    cursor: pointer !important;
}

.pre-viral-tweet::before {
    content: "🚀 Pre-Viral";
    position: absolute !important;
    top: 0px !important;
    left: 10px !important;
    background-color: #1DA1F2 !important;
    color: white !important;
    padding: 2px 8px !important;
    border-radius: 10px !important;
    font-size: 12px !important;
    font-weight: bold !important;
    z-index: 10 !important;
}

.engagement-rate {
    position: absolute !important;
    top: 0px !important;
    right: 10px !important;
    background-color: #1DA1F2 !important;
    color: white !important;
    padding: 2px 8px !important;
    border-radius: 10px !important;
    font-size: 12px !important;
    font-weight: bold !important;
    z-index: 10 !important;
}

.pre-viral-tweet:hover,
.pre-viral-tweet:hover::before {
    border-color: #1DA1F2 !important;
    opacity: 1 !important;
}

.pre-viral-tweet:hover {
    background-color: rgba(29, 161, 242, 0.1) !important;
}

.pre-viral-tweet * {
    z-index: 2 !important;
}

.hidden-tweet {
    display: none !important;
}

.favorite-account-btn {
    background-color: #FF6B6B !important;
    color: white !important;
    border: none !important;
    border-radius: 20px !important;
    padding: 8px 16px !important;
    font-size: 12px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    margin-top: 8px !important;
    transition: all 0.3s ease !important;
    z-index: 1000 !important;
}

.favorite-account-btn:hover {
    background-color: #FF5252 !important;
    transform: scale(1.05) !important;
}

.favorite-account-btn.favorited {
    background-color: #4CAF50 !important;
}

.favorite-account-btn.favorited:hover {
    background-color: #45a049 !important;
}

.favorite-account-btn .btn-text {
    display: inline-block !important;
}

.favorite-account-btn .btn-icon {
    margin-right: 4px !important;
}
`;
document.head.appendChild(style);

let tweetQueue = [];
let isProcessing = false;
const BATCH_SIZE = 10;
let enableFilter = false;
let timeThreshold = 6;
let timeUnit = 'hours';
let engagementRate = 5;
let enableEngagementFilter = false;
let enableIndividualFilters = false;
let minLikes = 0;
let minComments = 0;
let minReposts = 0;
let minBookmarks = 0;
let minViews = 0;
let favoriteAccounts = [];
let hoverCardObserver = null;


// Helper function to parse Twitter's number format (e.g., "1.5M", "2.3K", "1,234")
function parseTwitterNumber(numberStr) {
    if (!numberStr) return 0;
    
    // Remove commas first
    let cleanStr = numberStr.replace(/,/g, '');
    
    // Handle K (thousands)
    if (cleanStr.includes('K')) {
        const num = parseFloat(cleanStr.replace('K', ''));
        return Math.round(num * 1000);
    }
    
    // Handle M (millions)
    if (cleanStr.includes('M')) {
        const num = parseFloat(cleanStr.replace('M', ''));
        return Math.round(num * 1000000);
    }
    
    // Handle B (billions)
    if (cleanStr.includes('B')) {
        const num = parseFloat(cleanStr.replace('B', ''));
        return Math.round(num * 1000000000);
    }
    
    // Handle regular numbers
    const num = parseInt(cleanStr, 10);
    return isNaN(num) ? 0 : num;
}

function loadSettings() {
    console.log("Loading settings");
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(['enableFilter', 'timeThreshold', 'timeUnit', 'engagementRate', 'enableEngagementFilter', 'enableIndividualFilters', 'minLikes', 'minComments', 'minReposts', 'minBookmarks', 'minViews', 'favoriteAccounts'], function (result) {
                if (chrome.runtime.lastError) {
                    console.error('Chrome storage error:', chrome.runtime.lastError);
                    return;
                }
                
                enableFilter = result.enableFilter || false;
                timeThreshold = result.timeThreshold || 6;
                timeUnit = result.timeUnit || 'hours';
                engagementRate = result.engagementRate || 5;
                enableEngagementFilter = result.enableEngagementFilter !== undefined ? result.enableEngagementFilter : false;
                enableIndividualFilters = result.enableIndividualFilters || false;
                minLikes = result.minLikes || 0;
                minComments = result.minComments || 0;
                minReposts = result.minReposts || 0;
                minBookmarks = result.minBookmarks || 0;
                minViews = result.minViews || 0;
                favoriteAccounts = result.favoriteAccounts || [];

                console.log("Settings loaded:", { enableFilter, timeThreshold, timeUnit, engagementRate, enableEngagementFilter, enableIndividualFilters, minLikes, minComments, minReposts, minBookmarks, minViews, favoriteAccounts });

                // Check if any filters are enabled
                const hasActiveFilters = enableFilter || enableEngagementFilter || enableIndividualFilters;
                
                if (hasActiveFilters) {
                    console.log("✓ Filters are active, preparing tweet queue");
                    prepareInitialTweetQueue();
                } else {
                    console.log("✓ No filters active, showing all tweets");
                    showAllTweets();
                }
            });
        } else {
            console.warn('Chrome storage API not available');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function loadFavoriteAccounts() {
    console.log("Loading favorite accounts");
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(['favoriteAccounts'], function (result) {
                if (chrome.runtime.lastError) {
                    console.error('Chrome storage error:', chrome.runtime.lastError);
                    return;
                }
                favoriteAccounts = result.favoriteAccounts || [];
                console.log("Favorite accounts loaded:", favoriteAccounts);
            });
        }
    } catch (error) {
        console.error('Error loading favorite accounts:', error);
    }
}

function saveFavoriteAccounts() {
    console.log("Saving favorite accounts:", favoriteAccounts);
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ favoriteAccounts: favoriteAccounts }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Chrome storage error:', chrome.runtime.lastError);
                    return;
                }
                console.log('Favorite accounts saved');
            });
        }
    } catch (error) {
        console.error('Error saving favorite accounts:', error);
    }
}

function extractUserInfoFromHoverCard(hoverCard) {
    try {
        // Look for the username in the hover card - try multiple selectors
        let usernameElement = hoverCard.querySelector('a[href^="/"][role="link"]');
        if (!usernameElement) {
            usernameElement = hoverCard.querySelector('a[href*="/status/"]');
        }
        if (!usernameElement) {
            usernameElement = hoverCard.querySelector('a[href*="/"]');
        }
        
        if (!usernameElement) return null;
        
        // Extract username from URL
        let username = '';
        if (usernameElement.href) {
            const urlParts = usernameElement.href.split('/');
            username = urlParts[urlParts.length - 1] || urlParts[1];
        } else if (usernameElement.getAttribute('href')) {
            const href = usernameElement.getAttribute('href');
            const urlParts = href.split('/');
            username = urlParts[urlParts.length - 1] || urlParts[1];
        }
        
        if (!username) return null;
        
        // Look for display name - try multiple selectors
        let displayNameElement = hoverCard.querySelector('div[dir="ltr"] span');
        if (!displayNameElement) {
            displayNameElement = hoverCard.querySelector('span[dir="ltr"]');
        }
        if (!displayNameElement) {
            displayNameElement = hoverCard.querySelector('div[style*="color: rgb(231, 233, 234)"]');
        }
        
        const displayName = displayNameElement ? displayNameElement.textContent.trim() : username;
        
        // Look for follower count - try multiple selectors
        let followerElement = hoverCard.querySelector('a[href*="/verified_followers"]');
        if (!followerElement) {
            followerElement = hoverCard.querySelector('a[href*="/followers"]');
        }
        if (!followerElement) {
            // Look for text containing "Followers"
            const allLinks = hoverCard.querySelectorAll('a');
            for (let link of allLinks) {
                if (link.textContent.includes('Followers')) {
                    followerElement = link;
                    break;
                }
            }
        }
        
        let followerCount = '0';
        if (followerElement) {
            const followerText = followerElement.textContent;
            const match = followerText.match(/(\d+(?:\.\d+)?[KMB]?)/);
            if (match) {
                followerCount = match[1];
            }
        }
        
        return {
            username: username.toLowerCase(),
            displayName: displayName,
            followerCount: followerCount,
            profileUrl: `https://twitter.com/${username}`
        };
    } catch (error) {
        console.error('Error extracting user info from hover card:', error);
        return null;
    }
}

function createFavoriteButton(userInfo) {
    const isFavorited = favoriteAccounts.some(account => account.username === userInfo.username);
    
    const button = document.createElement('button');
    button.className = `favorite-account-btn ${isFavorited ? 'favorited' : ''}`;
    button.innerHTML = `
        <span class="btn-icon">${isFavorited ? '❤️' : '🤍'}</span>
        <span class="btn-text">${isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
    `;
    
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFavoriteAccount(userInfo, button);
    });
    
    return button;
}

function toggleFavoriteAccount(userInfo, button) {
    const existingIndex = favoriteAccounts.findIndex(account => account.username === userInfo.username);
    
    if (existingIndex !== -1) {
        // Remove from favorites
        favoriteAccounts.splice(existingIndex, 1);
        button.classList.remove('favorited');
        button.innerHTML = `
            <span class="btn-icon">🤍</span>
            <span class="btn-text">Add to Favorites</span>
        `;
        console.log(`Removed ${userInfo.username} from favorites`);
    } else {
        // Add to favorites
        favoriteAccounts.push(userInfo);
        button.classList.add('favorited');
        button.innerHTML = `
            <span class="btn-icon">❤️</span>
            <span class="btn-text">Favorited</span>
        `;
        console.log(`Added ${userInfo.username} to favorites`);
    }
    
    saveFavoriteAccounts();
}

function handleHoverCard(hoverCard) {
    // Check if we've already processed this hover card
    if (hoverCard.dataset.favoriteButtonAdded) {
        return;
    }
    
    const userInfo = extractUserInfoFromHoverCard(hoverCard);
    if (!userInfo) {
        console.log('Could not extract user info from hover card');
        return;
    }
    
    console.log('Processing hover card for user:', userInfo);
    
    // Try multiple strategies to find the best place to add the button
    
    // Strategy 1: Look for the follow button area
    let container = null;
    const followButtonArea = hoverCard.querySelector('button[data-testid*="follow"]');
    if (followButtonArea && followButtonArea.parentElement) {
        container = followButtonArea.parentElement;
    }
    
    // Strategy 2: Look for the button area by class
    if (!container) {
        const buttonArea = hoverCard.querySelector('div[style*="min-width: 0px"]');
        if (buttonArea) {
            container = buttonArea;
        }
    }
    
    // Strategy 3: Look for the last div with buttons
    if (!container) {
        const allDivs = hoverCard.querySelectorAll('div');
        for (let i = allDivs.length - 1; i >= 0; i--) {
            const div = allDivs[i];
            if (div.querySelector('button')) {
                container = div;
                break;
            }
        }
    }
    
    // Strategy 4: Fallback to the hover card itself
    if (!container) {
        container = hoverCard;
    }
    
    // Check if button already exists
    if (!container.querySelector('.favorite-account-btn')) {
        const favoriteButton = createFavoriteButton(userInfo);
        container.appendChild(favoriteButton);
        hoverCard.dataset.favoriteButtonAdded = 'true';
        console.log('Added favorite button to hover card');
    }
}

function initHoverCardObserver() {
    console.log("Initializing hover card observer");
    
    // Disconnect existing observer if it exists
    if (hoverCardObserver) {
        hoverCardObserver.disconnect();
    }
    
    // Create new observer to watch for hover cards
    hoverCardObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a hover card
                        if (node.matches && node.matches('[data-testid="HoverCard"]')) {
                            console.log('Hover card detected');
                            handleHoverCard(node);
                        }
                        
                        // Also check for hover cards within the added node
                        const hoverCards = node.querySelectorAll ? node.querySelectorAll('[data-testid="HoverCard"]') : [];
                        hoverCards.forEach(hoverCard => {
                            console.log('Hover card detected within added node');
                            handleHoverCard(hoverCard);
                        });
                    }
                });
            }
        });
    });
    
    // Start observing the entire document for hover card additions
    hoverCardObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Also check for existing hover cards that might be present
    checkForExistingHoverCards();
    
    console.log("Hover card observer initialized");
}

function checkForExistingHoverCards() {
    const existingHoverCards = document.querySelectorAll('[data-testid="HoverCard"]');
    if (existingHoverCards.length > 0) {
        console.log(`Found ${existingHoverCards.length} existing hover cards`);
        existingHoverCards.forEach(hoverCard => {
            if (!hoverCard.dataset.favoriteButtonAdded) {
                console.log('Found existing hover card, processing...');
                handleHoverCard(hoverCard);
            }
        });
    }
}

function createLoadMoreButton() {
    console.log("Creating load more button");
    if (document.getElementById('loadMoreTweetsButton')) {
        console.log("Button already exists, not creating a new one");
        return;
    }
    const button = document.createElement('button');
    button.innerHTML = '🚀 Give Me Viral Tweets';
    button.id = 'loadMoreTweetsButton';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 60px;
        background-color: #1DA1F2;
        color: white;
        border: none;
        border-radius: 50px;
        padding: 10px 20px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        z-index: 9999999;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;

    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#1991DB';
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#1DA1F2';
    });

    button.addEventListener('click', () => {
        console.log("Load more button clicked");
        processTweetQueue();
    });

    document.body.appendChild(button);
    console.log("Load more button created and appended to body");
}

function ensureButtonExists() {
    if (!document.getElementById('loadMoreTweetsButton')) {
        console.log("Button not found, creating it");
        createLoadMoreButton();
    }
}

function initTweetFilter() {
    console.log("Tweet Filter initialization started");
    createLoadMoreButton();

    const twitterFeed = document.querySelector('div[aria-label="Timeline: Your Home Timeline"]');
    if (twitterFeed) {
        console.log("Twitter feed found");

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.matches('article[data-testid="tweet"]')) {
                            if (!node.classList.contains('pre-viral-tweet') && !node.classList.contains('hidden-tweet')) {
                                tweetQueue.push(node);
                            }
                        }
                    });
                }
            });
        });
        observer.observe(twitterFeed, { childList: true, subtree: true });
    } else {
        console.log("Twitter feed not found");
    }

    loadSettings();
    loadFavoriteAccounts(); // Load favorite accounts after settings
    initHoverCardObserver(); // Initialize hover card observer

    console.log("Tweet Filter initialization completed");
}

async function processTweetQueue() {
    if (isProcessing) {
        console.log("Already processing tweets");
        return;
    }
    
    if (tweetQueue.length === 0) {
        console.log("No tweets in queue, preparing new batch");
        prepareInitialTweetQueue();
    }
    
    if (tweetQueue.length === 0) {
        console.log("No tweets available to process");
        return;
    }
    
    isProcessing = true;
    console.log(`Processing ${Math.min(BATCH_SIZE, tweetQueue.length)} tweets`);
    
    const batch = tweetQueue.splice(0, BATCH_SIZE);
    
    for (let i = 0; i < batch.length; i++) {
        await filterTweet(batch[i]);
        // Add small delay between tweets to prevent overwhelming the DOM
        if (i < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
        }
        if (i === batch.length - 1) {
            isProcessing = false;
            console.log("Batch processing complete. Press 'Load More Tweets' for the next batch.");
        }
    }
}

async function extractTweetData(tweetElement) {
    const data = {
        timestamp: new Date(),
        likes: 0,
        retweets: 0,
        comments: 0,
        bookmarks: 0,
        views: 0,
        hasMedia: false,
        hasHashtags: false
    };

    try {
        const timeElement = tweetElement.querySelector('time');
        if (timeElement && timeElement.dateTime) {
            data.timestamp = new Date(timeElement.dateTime);
        }

        const engagementGroup = tweetElement.querySelector('[role="group"]');
        if (engagementGroup) {
            const ariaLabel = engagementGroup.getAttribute('aria-label');
            if (ariaLabel) {
                const metrics = ariaLabel.split(', ');
                metrics.forEach(metric => {
                    const [count, type] = metric.split(' ');
                    const numericCount = parseTwitterNumber(count);
                    if (numericCount > 0) {
                        if (type.includes('repl')) data.comments = numericCount;
                        else if (type.includes('repost')) data.retweets = numericCount;
                        else if (type.includes('like')) data.likes = numericCount;
                        else if (type.includes('bookmark')) data.bookmarks = numericCount;
                        else if (type.includes('view')) data.views = numericCount;
                    }
                });
            }
        }

        data.hasMedia = tweetElement.querySelector('div[data-testid="tweetPhoto"], div[data-testid="videoPlayer"]') !== null;
        data.hasHashtags = tweetElement.textContent.includes('#');

        // Log the extracted data for debugging
        console.log(`📊 Extracted tweet data:`, {
            likes: data.likes,
            retweets: data.retweets,
            comments: data.comments,
            bookmarks: data.bookmarks,
            views: data.views,
            hasMedia: data.hasMedia,
            hasHashtags: data.hasHashtags
        });

    } catch (error) {
        console.error('Error extracting tweet data:', error);
    }

    return data;
}





function shouldShowTweet(tweetData) {
    // Check if any filters are enabled
    const hasActiveFilters = enableFilter || enableEngagementFilter || enableIndividualFilters;
    if (!hasActiveFilters) {
        console.log('✓ No filters enabled, showing all tweets');
        return true;
    }

    // Time filtering
    if (enableFilter) {
        const now = new Date();
        const tweetDate = new Date(tweetData.timestamp);
        const timeSincePostedMs = now - tweetDate;
        
        let timeSincePostedInUnit;
        if (timeUnit === 'minutes') {
            timeSincePostedInUnit = timeSincePostedMs / (1000 * 60);
        } else {
            timeSincePostedInUnit = timeSincePostedMs / (1000 * 60 * 60);
        }

        console.log(`Tweet timestamp: ${tweetDate.toISOString()}, Current time: ${now.toISOString()}`);
        console.log(`Time since posted: ${timeSincePostedInUnit.toFixed(2)} ${timeUnit}, Threshold: ${timeThreshold} ${timeUnit}`);

        if (timeSincePostedInUnit > timeThreshold) {
            console.log(`HIDE ✖️ Time since posted: ${timeSincePostedInUnit.toFixed(2)} ${timeUnit}, Time threshold: ${timeThreshold} ${timeUnit}`);
            return false;
        }
    } else {
        console.log('✓ Time filter disabled, skipping time check');
    }

    // Engagement rate filtering
    if (enableEngagementFilter) {
        const totalEngagements = tweetData.likes + tweetData.retweets + tweetData.comments + tweetData.bookmarks;
        const engagementRateCalculated = (totalEngagements / Math.max(tweetData.views, 1)) * 100;

        if (engagementRateCalculated < engagementRate) {
            console.log('HIDE ✖️ Engagement rate:', engagementRateCalculated, '\n Engagement threshold:', engagementRate);
            return false;
        }
        
        console.log('SHOW🚀 Engagement rate:', engagementRateCalculated, '\n Engagement threshold:', engagementRate);
    } else {
        console.log('✓ Engagement filter disabled, skipping engagement rate check');
    }

    // Individual engagement filters
    if (enableIndividualFilters) {
        console.log(`🔍 Checking individual filters - minLikes: ${minLikes}, minComments: ${minComments}, minReposts: ${minReposts}, minBookmarks: ${minBookmarks}, minViews: ${minViews}`);
        console.log(`📊 Tweet metrics - likes: ${tweetData.likes}, comments: ${tweetData.comments}, reposts: ${tweetData.retweets}, bookmarks: ${tweetData.bookmarks}, views: ${tweetData.views}`);
        
        if (tweetData.likes < minLikes) {
            console.log(`HIDE ✖️ Likes: ${tweetData.likes}, Minimum required: ${minLikes}`);
            return false;
        }
        
        if (tweetData.comments < minComments) {
            console.log(`HIDE ✖️ Comments: ${tweetData.comments}, Minimum required: ${minComments}`);
            return false;
        }
        
        if (tweetData.retweets < minReposts) {
            console.log(`HIDE ✖️ Reposts: ${tweetData.retweets}, Minimum required: ${minReposts}`);
            return false;
        }
        
        if (tweetData.bookmarks < minBookmarks) {
            console.log(`HIDE ✖️ Bookmarks: ${tweetData.bookmarks}, Minimum required: ${minBookmarks}`);
            return false;
        }
        
        if (tweetData.views < minViews) {
            console.log(`HIDE ✖️ Views: ${tweetData.views}, Minimum required: ${minViews}`);
            return false;
        }
        
        console.log('✓ All individual engagement filters passed');
    } else {
        console.log('✓ Individual engagement filters disabled, skipping individual checks');
    }

    return true;
}

function showTweet(tweetElement, tweetData) {
    tweetElement.classList.remove('hidden-tweet');
    tweetElement.classList.add('pre-viral-tweet');
    tweetElement.style.display = '';
    addNewTabBehavior(tweetElement);

    const totalEngagements = tweetData.likes + tweetData.retweets + tweetData.comments + tweetData.bookmarks;
    const engagementRateCalculated = (totalEngagements / Math.max(tweetData.views, 1)) * 100;
    
    let engagementRateElement = tweetElement.querySelector('.engagement-rate');
    if (!engagementRateElement) {
        engagementRateElement = document.createElement('div');
        engagementRateElement.className = 'engagement-rate';
        tweetElement.appendChild(engagementRateElement);
    }

    engagementRateElement.textContent = `ER: ${engagementRateCalculated.toFixed(2)}%`;
}

function hideTweet(tweetElement) {
    tweetElement.classList.remove('pre-viral-tweet');
    tweetElement.classList.add('hidden-tweet');
    tweetElement.style.display = 'none';
}

async function filterTweet(tweetElement) {
    if (!tweetElement) {
        console.warn('Attempted to filter undefined tweet element');
        return;
    }

    const tweetData = await extractTweetData(tweetElement);
    const shouldShow = shouldShowTweet(tweetData);
    console.log('Tweet data:', tweetData, 'Should show:', shouldShow);

    if (shouldShow) {
        showTweet(tweetElement, tweetData);
    } else {
        hideTweet(tweetElement);
    }
}

function filterInitialTweets() {
    console.log("Filtering initial tweets");
    const tweets = document.querySelectorAll('article[data-testid="tweet"]:not(.pre-viral-tweet):not(.hidden-tweet)');
    tweetQueue = Array.from(tweets);
    processTweetQueue();
}

function prepareInitialTweetQueue() {
    console.log("Preparing initial tweet queue");
    tweetQueue = Array.from(document.querySelectorAll('article[data-testid="tweet"]:not(.pre-viral-tweet):not(.hidden-tweet)'));
    console.log(`${tweetQueue.length} tweets queued. Press 'Load More Tweets' to start filtering.`);
}

function showAllTweets() {
    console.log("Showing all tweets");
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(tweet => {
        tweet.classList.remove('pre-viral-tweet', 'hidden-tweet');
        tweet.style.display = '';
    });
    tweetQueue = [];
}

function addNewTabBehavior(tweetElement) {
    tweetElement.addEventListener('click', function (event) {
        if (event.target.closest('a, button')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
        if (tweetLink) {
            const tweetUrl = tweetLink.href;
            window.open(tweetUrl, '_blank');
        }
    }, true);
}

// Add message listener with error handling
try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            console.log("Message received:", request);
            
            if (request.action === "updateSettingsAndFilter" || request.action === "updateSettingsAndLoadMoreTweets") {
                // Always update settings if they are provided in the request
                if (request.settings) {
                    enableFilter = request.settings.enableFilter;
                    timeThreshold = request.settings.timeThreshold;
                    timeUnit = request.settings.timeUnit;
                    engagementRate = request.settings.engagementRate;
                    enableEngagementFilter = request.settings.enableEngagementFilter;
                    enableIndividualFilters = request.settings.enableIndividualFilters;
                    minLikes = request.settings.minLikes || 0;
                    minComments = request.settings.minComments || 0;
                    minReposts = request.settings.minReposts || 0;
                    minBookmarks = request.settings.minBookmarks || 0;
                    minViews = request.settings.minViews || 0;
                    console.log("Settings updated:", { enableFilter, timeThreshold, timeUnit, engagementRate, enableEngagementFilter, enableIndividualFilters, minLikes, minComments, minReposts, minBookmarks, minViews });
                }

                // Check if any filters are enabled
                const hasActiveFilters = enableFilter || enableEngagementFilter || enableIndividualFilters;
                
                if (hasActiveFilters) {
                    if (request.action === "updateSettingsAndLoadMoreTweets") {
                        processTweetQueue();
                    } else {
                        prepareInitialTweetQueue();
                        processTweetQueue();
                    }
                } else {
                    showAllTweets();
                }
            } else if (request.action === "getFavoriteAccounts") {
                // Send favorite accounts back to popup
                sendResponse({ favoriteAccounts: favoriteAccounts });
            } else if (request.action === "removeFavoriteAccount") {
                // Remove account from favorites
                const username = request.username;
                favoriteAccounts = favoriteAccounts.filter(account => account.username !== username);
                saveFavoriteAccounts();
                sendResponse({ success: true });
            }
        });
    } else {
        console.warn('Chrome runtime API not available');
    }
} catch (error) {
    console.error('Error setting up message listener:', error);
}

initTweetFilter();

// Reload settings periodically to catch changes made in popup
// Only set intervals if Chrome APIs are available
try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        setInterval(loadSettings, 10000); // Reload settings every 10 seconds
    }
    setInterval(ensureButtonExists, 5000);
    setInterval(checkForExistingHoverCards, 3000); // Check for hover cards every 3 seconds
} catch (error) {
    console.error('Error setting up intervals:', error);
}