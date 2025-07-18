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
`;
document.head.appendChild(style);

let tweetQueue = [];
let isProcessing = false;
const BATCH_SIZE = 10;
let enableFilter = false;
let timeThreshold = 6;
let engagementRate = 5;

function loadSettings() {
    console.log("Loading settings");
    chrome.storage.sync.get(['enableFilter', 'timeThreshold', 'engagementRate'], function (result) {
        enableFilter = result.enableFilter || false;
        timeThreshold = result.timeThreshold || 6;
        engagementRate = result.engagementRate || 5;

        console.log("Settings loaded:", { enableFilter, timeThreshold, engagementRate });

        if (enableFilter) {
            prepareInitialTweetQueue();
        } else {
            showAllTweets();
        }
    });
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
        if (i === batch.length - 1) {
            isProcessing = false;
            console.log("Batch processing complete. Press 'Load More Tweets' for the next batch.");
        }
    }
}

function extractTweetData(tweetElement) {
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
                    const numericCount = parseInt(count.replace(/,/g, ''), 10);
                    if (!isNaN(numericCount)) {
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

    } catch (error) {
        console.error('Error extracting tweet data:', error);
    }

    return data;
}

function shouldShowTweet(tweetData) {
    if (!enableFilter) return true;

    const now = new Date();
    const tweetDate = new Date(tweetData.timestamp);
    const hoursSincePosted = (now - tweetDate) / (1000 * 60 * 60);

    if (hoursSincePosted > timeThreshold) {
        console.log('HIDE ✖️ Hours since posted:', hoursSincePosted, '\n Time threshold:', timeThreshold);
        return false;
    }

    const totalEngagements = tweetData.likes + tweetData.retweets + tweetData.comments + tweetData.bookmarks;
    const engagementRateCalculated = (totalEngagements / Math.max(tweetData.views, 1)) * 100;

    if (engagementRateCalculated < engagementRate) {
        console.log('HIDE ✖️ Engagement rate:', engagementRateCalculated, '\n Engagement threshold:', engagementRate);
        return false;
    }

    console.log('SHOW🚀 Engagement rate:', engagementRateCalculated, '\n Engagement threshold:', engagementRate);
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

    const tweetData = extractTweetData(tweetElement);
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Message received:", request);
    if (request.action === "updateSettingsAndFilter" || request.action === "updateSettingsAndLoadMoreTweets" || request.action === "loadMoreTweets") {
        if (request.action !== "loadMoreTweets") {
            enableFilter = request.settings.enableFilter;
            timeThreshold = request.settings.timeThreshold;
            engagementRate = request.settings.engagementRate;
        }

        if (enableFilter) {
            if (request.action === "updateSettingsAndLoadMoreTweets" || request.action === "loadMoreTweets") {
                processTweetQueue();
            } else {
                prepareInitialTweetQueue();
                processTweetQueue();
            }
        } else {
            showAllTweets();
        }
    }
});

initTweetFilter();

setInterval(ensureButtonExists, 5000);