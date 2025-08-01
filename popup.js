// Global function for saving settings
function saveSettings(callback) {
    const enableFilterToggle = document.getElementById('enableFilterToggle');
    const timeThresholdInput = document.getElementById('timeThreshold');
    const timeUnitSelect = document.getElementById('timeUnit');
    const enableEngagementFilterToggle = document.getElementById('enableEngagementFilterToggle');
    const engagementRateInput = document.getElementById('engagementRate');
    const enableIndividualFiltersToggle = document.getElementById('enableIndividualFiltersToggle');
    const minLikesInput = document.getElementById('minLikes');
    const minCommentsInput = document.getElementById('minComments');
    const minRepostsInput = document.getElementById('minReposts');
    const minBookmarksInput = document.getElementById('minBookmarks');
    const minViewsInput = document.getElementById('minViews');
    
    if (!enableFilterToggle || !timeThresholdInput || !timeUnitSelect || !enableEngagementFilterToggle || !engagementRateInput || !enableIndividualFiltersToggle || !minLikesInput || !minCommentsInput || !minRepostsInput || !minBookmarksInput || !minViewsInput) {
        console.error('Required elements not found');
        if (callback) callback();
        return;
    }

    const enableFilter = enableFilterToggle.classList.contains('active');
    const timeThreshold = parseInt(timeThresholdInput.value);
    const timeUnit = timeUnitSelect.value;
    const enableEngagementFilter = enableEngagementFilterToggle.classList.contains('active');
    const engagementRate = parseInt(engagementRateInput.value);
    const enableIndividualFilters = enableIndividualFiltersToggle.classList.contains('active');
    const minLikes = parseInt(minLikesInput.value) || 0;
    const minComments = parseInt(minCommentsInput.value) || 0;
    const minReposts = parseInt(minRepostsInput.value) || 0;
    const minBookmarks = parseInt(minBookmarksInput.value) || 0;
    const minViews = parseInt(minViewsInput.value) || 0;

    chrome.storage.sync.set({
        enableFilter: enableFilter,
        timeThreshold: timeThreshold,
        timeUnit: timeUnit,
        enableEngagementFilter: enableEngagementFilter,
        engagementRate: engagementRate,
        enableIndividualFilters: enableIndividualFilters,
        minLikes: minLikes,
        minComments: minComments,
        minReposts: minReposts,
        minBookmarks: minBookmarks,
        minViews: minViews,
        whitelistedAccounts: window.whitelistedAccounts || []
    }, function() {
        console.log('Settings saved');
        if (callback) callback();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const enableFilterToggle = document.getElementById('enableFilterToggle');
    const timeThresholdInput = document.getElementById('timeThreshold');
    const timeUnitSelect = document.getElementById('timeUnit');
    const enableEngagementFilterToggle = document.getElementById('enableEngagementFilterToggle');
    const engagementRateInput = document.getElementById('engagementRate');
    const engagementRateContainer = document.getElementById('engagementRateContainer');
    const enableIndividualFiltersToggle = document.getElementById('enableIndividualFiltersToggle');
    const individualFiltersContainer = document.getElementById('individualFiltersContainer');

    const accountInput = document.getElementById('accountInput');
    const addAccountButton = document.getElementById('addAccount');
    const accountList = document.getElementById('accountList');
    const saveSettingsButton = document.getElementById('saveSettings');




    // Make whitelistedAccounts globally accessible
    window.whitelistedAccounts = [];

    // Function to update toggle state
    function updateToggleState(toggleElement, isActive) {
        if (isActive) {
            toggleElement.classList.add('active');
        } else {
            toggleElement.classList.remove('active');
        }
    }

    // Function to handle toggle clicks
    function handleToggleClick(toggleElement, callback) {
        const isCurrentlyActive = toggleElement.classList.contains('active');
        const newState = !isCurrentlyActive;
        updateToggleState(toggleElement, newState);
        if (callback) callback(newState);
    }

    // Function to normalize account names (remove @, lowercase, trim)
    function normalizeAccountName(accountName) {
        return accountName.replace('@', '').toLowerCase().trim();
    }

    // Function to update the account list display
    function updateAccountListDisplay() {
        if (window.whitelistedAccounts.length === 0) {
            accountList.innerHTML = '<div class="empty-list">No accounts added</div>';
        } else {
            accountList.innerHTML = window.whitelistedAccounts.map(account => `
                <div class="account-item">
                    <span class="account-name">@${account}</span>
                    <button class="remove-btn" onclick="removeAccount('${account}')">Remove</button>
                </div>
            `).join('');
        }
    }



    // Function to add an account to the whitelist
    function addAccount() {
        const accountName = normalizeAccountName(accountInput.value);
        
        if (!accountName) {
            alert('Please enter a valid account name');
            return;
        }
        
        if (window.whitelistedAccounts.includes(accountName)) {
            alert('Account already in the list');
            return;
        }
        
        window.whitelistedAccounts.push(accountName);
        accountInput.value = '';
        updateAccountListDisplay();
    }

    // Function to remove an account from the whitelist
    window.removeAccount = function(accountName) {
        window.whitelistedAccounts = window.whitelistedAccounts.filter(account => account !== accountName);
        updateAccountListDisplay();
    };

    // Function to show/hide individual filters container
    function updateIndividualFiltersVisibility() {
        const isEnabled = enableIndividualFiltersToggle.classList.contains('active');
        individualFiltersContainer.style.display = isEnabled ? 'block' : 'none';
    }

    // Function to update time input min/max based on selected unit
    function updateTimeInputLimits() {
        if (timeUnitSelect.value === 'minutes') {
            timeThresholdInput.min = 1;
            timeThresholdInput.max = 59;
            // Convert hours to minutes if switching from hours to minutes
            if (timeThresholdInput.value > 59) {
                timeThresholdInput.value = 30; // Default to 30 minutes
            }
        } else {
            timeThresholdInput.min = 1;
            timeThresholdInput.max = 24;
            // Convert minutes to hours if switching from minutes to hours
            if (timeThresholdInput.value < 1) {
                timeThresholdInput.value = 1; // Default to 1 hour
            }
        }
    }

    // Function to show/hide engagement rate container
    function updateEngagementRateVisibility() {
        const isEnabled = enableEngagementFilterToggle.classList.contains('active');
        engagementRateContainer.style.display = isEnabled ? 'block' : 'none';
    }





    // Load saved settings
    chrome.storage.sync.get(['enableFilter', 'timeThreshold', 'timeUnit', 'enableEngagementFilter', 'engagementRate', 'enableIndividualFilters', 'minLikes', 'minComments', 'minReposts', 'minBookmarks', 'minViews', 'whitelistedAccounts'], function (result) {
        const enableFilter = result.enableFilter || false;
        const enableEngagementFilter = result.enableEngagementFilter !== undefined ? result.enableEngagementFilter : false;
        const enableIndividualFilters = result.enableIndividualFilters || false;
        
        // Update toggle states
        updateToggleState(enableFilterToggle, enableFilter);
        updateToggleState(enableEngagementFilterToggle, enableEngagementFilter);
        updateToggleState(enableIndividualFiltersToggle, enableIndividualFilters);
        
        timeThresholdInput.value = result.timeThreshold || 6;
        timeUnitSelect.value = result.timeUnit || 'hours';
        engagementRateInput.value = result.engagementRate || 5;
        document.getElementById('minLikes').value = result.minLikes || 0;
        document.getElementById('minComments').value = result.minComments || 0;
        document.getElementById('minReposts').value = result.minReposts || 0;
        document.getElementById('minBookmarks').value = result.minBookmarks || 0;
        document.getElementById('minViews').value = result.minViews || 0;
        window.whitelistedAccounts = result.whitelistedAccounts || [];

        // Update UI based on loaded settings
        updateTimeInputLimits();
        updateEngagementRateVisibility();
        updateIndividualFiltersVisibility();
        updateAccountListDisplay();
    });

    // Event listeners for toggles
    enableFilterToggle.addEventListener('click', function() {
        handleToggleClick(enableFilterToggle, function(isEnabled) {
            // Toggle functionality
        });
    });

    enableEngagementFilterToggle.addEventListener('click', function() {
        handleToggleClick(enableEngagementFilterToggle, function(isEnabled) {
            updateEngagementRateVisibility();
        });
    });

    enableIndividualFiltersToggle.addEventListener('click', function() {
        handleToggleClick(enableIndividualFiltersToggle, function(isEnabled) {
            updateIndividualFiltersVisibility();
        });
    });



    // Event listeners
    addAccountButton.addEventListener('click', addAccount);
    
    accountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addAccount();
        }
    });



    // Update time input limits when unit changes
    timeUnitSelect.addEventListener('change', updateTimeInputLimits);

    function getCurrentSettings() {
        return {
            enableFilter: enableFilterToggle.classList.contains('active'),
            timeThreshold: parseInt(timeThresholdInput.value),
            timeUnit: timeUnitSelect.value,
            enableEngagementFilter: enableEngagementFilterToggle.classList.contains('active'),
            engagementRate: parseInt(engagementRateInput.value),
            enableIndividualFilters: enableIndividualFiltersToggle.classList.contains('active'),
            minLikes: parseInt(document.getElementById('minLikes').value) || 0,
            minComments: parseInt(document.getElementById('minComments').value) || 0,
            minReposts: parseInt(document.getElementById('minReposts').value) || 0,
            minBookmarks: parseInt(document.getElementById('minBookmarks').value) || 0,
            minViews: parseInt(document.getElementById('minViews').value) || 0,
            whitelistedAccounts: window.whitelistedAccounts
        };
    }

    // Save settings when the save button is clicked
    saveSettingsButton.addEventListener('click', function() {
        saveSettings(function() {
            // Notify the content script that settings have changed
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateSettingsAndFilter",
                    settings: getCurrentSettings()
                });
            });
            window.close();
        });
    });


    
});

