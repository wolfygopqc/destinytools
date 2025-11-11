        const BUNGIE_CLIENT_ID = "51007";
        const BUNGIE_API_KEY = "d1fc55de14f441619f05e51c761dcca6";
        
        // Les variables pour les éléments seront définies après le chargement des partiels
        let loginContainer, contentContainer, loginBtn, loadingDiv, profileDataDiv, userInfoDiv, charactersDiv, logoutBtn, itemDetailModal, itemDetailCloseBtn, itemDetailIcon, itemDetailName, itemDetailBody, vaultDisplayContainer, vaultGrid, communityContainer, searchPlayerBtn, playerProfileModal, questsContainer, questsList, vendorsContainer, vendorsList, loadoutsContainer, loadoutsList, clanLoadoutsContainer, clanLoadoutsList, createClanLoadoutBtn, importClanLoadoutBtn, importClanLoadoutInput, clanContainer, clanInfoDiv, createLoadoutBtn, importLoadoutBtn, loadoutBuilderModal, loadoutBuilderCloseBtn, saveNewLoadoutBtn, selectedLoadoutItemsDiv, loadoutBuilderItemsContainer, playerProfileModalCloseBtn, historyContainer, pgcrModal, pgcrModalCloseBtn, refreshBtn, settingsBtn, settingsContainer, settingsContent;

        const errorDisplayDiv = document.createElement('div');
        const perkDefinitionsCache = {};
        let currentUserInfo = null;
        let refreshIntervalId = null;
        let fullProfileData = null; 
        let currentLoadoutBuilder = {};
        let userSettings = {
            buttonSounds: true,
            christmasEvent: true,
            sectionOrder: [
                'contentContainer', 'vaultDisplayContainer', 'communityContainer', 'questsContainer',
                'vendorsContainer', 'loadoutsContainer', 'clanLoadoutsContainer', 'clanContainer',
                'historyContainer'
            ],
            sectionVisibility: {},
            theme: 'default'
        };

        async function loadPartials() {
            const partials = [
                'login', 'content', 'vault', 'community', 'quests', 'vendors', 
                'loadouts', 'clan_loadouts', 'clan', 'history', 'settings', 'modals'
            ];
            
            const mainElement = document.querySelector('main');
            const modalContainer = document.getElementById('modal-container');

            const fetchPromises = partials.map(async (partialName) => {
                try {
                    const response = await fetch(`partials/${partialName}.html`);
                    if (!response.ok) throw new Error(`Failed to load ${partialName}.html`);
                    const html = await response.text();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    
                    const container = (partialName === 'modals') ? modalContainer : mainElement;
                    container.append(...tempDiv.childNodes);
                } catch (error) {
                    console.error(`Error loading partial: ${partialName}`, error);
                    mainElement.innerHTML = `<p style="color: #ff7b7b; text-align: center;">Erreur critique: Impossible de charger le composant '${partialName}'. Veuillez recharger la page.</p>`;
                }
            });

            await Promise.all(fetchPromises);
        }

        function initializeDOMElements() {
            loginContainer = document.getElementById('loginContainer');
            contentContainer = document.getElementById('contentContainer');
            loginBtn = document.getElementById('loginBtn');
            loadingDiv = document.getElementById('loading');
            profileDataDiv = document.getElementById('profileData');
            userInfoDiv = document.getElementById('userInfo');
            charactersDiv = document.getElementById('characters');
            logoutBtn = document.getElementById('logoutBtn');
            itemDetailModal = document.getElementById('itemDetailModal');
            itemDetailCloseBtn = document.getElementById('itemDetailCloseBtn');
            itemDetailIcon = document.getElementById('itemDetailIcon');
            itemDetailName = document.getElementById('itemDetailName');
            itemDetailBody = document.getElementById('itemDetailBody');
            vaultDisplayContainer = document.getElementById('vaultDisplayContainer');
            vaultGrid = document.getElementById('vaultGrid');
            communityContainer = document.getElementById('communityContainer');
            searchPlayerBtn = document.getElementById('searchPlayerBtn');
            playerProfileModal = document.getElementById('playerProfileModal');
            questsContainer = document.getElementById('questsContainer');
            questsList = document.getElementById('questsList');
            vendorsContainer = document.getElementById('vendorsContainer');
            vendorsList = document.getElementById('vendorsList');
            loadoutsContainer = document.getElementById('loadoutsContainer');
            loadoutsList = document.getElementById('loadoutsList');
            clanLoadoutsContainer = document.getElementById('clanLoadoutsContainer');
            clanLoadoutsList = document.getElementById('clanLoadoutsList');
            createClanLoadoutBtn = document.getElementById('createClanLoadoutBtn');
            importClanLoadoutBtn = document.getElementById('importClanLoadoutBtn');
            importClanLoadoutInput = document.getElementById('importClanLoadoutInput');
            clanContainer = document.getElementById('clanContainer');
            clanInfoDiv = document.getElementById('clanInfo');
            createLoadoutBtn = document.getElementById('createLoadoutBtn');
            importLoadoutBtn = document.getElementById('importLoadoutBtn');
            loadoutBuilderModal = document.getElementById('loadoutBuilderModal');
            loadoutBuilderCloseBtn = document.getElementById('loadoutBuilderCloseBtn');
            saveNewLoadoutBtn = document.getElementById('saveNewLoadoutBtn');
            selectedLoadoutItemsDiv = document.getElementById('selectedLoadoutItems');
            loadoutBuilderItemsContainer = document.getElementById('loadoutBuilderItemsContainer');
            playerProfileModalCloseBtn = document.getElementById('playerProfileModalCloseBtn');
            historyContainer = document.getElementById('historyContainer');
            pgcrModal = document.getElementById('pgcrModal');
            pgcrModalCloseBtn = document.getElementById('pgcrModalCloseBtn');
            refreshBtn = document.getElementById('refreshBtn');
            settingsBtn = document.getElementById('settingsBtn');
            settingsContainer = document.getElementById('settingsContainer');
            settingsContent = document.getElementById('settingsContent');
        }

        function addEventListeners() {
            loginBtn.addEventListener('click', () => {
                const authUrl = `https://www.bungie.net/fr/OAuth/Authorize?client_id=${BUNGIE_CLIENT_ID}&response_type=code`;
                window.location.href = authUrl;
            });

            logoutBtn.addEventListener('click', () => {
                playButtonClickSound();
                if (refreshIntervalId) clearInterval(refreshIntervalId);
                localStorage.removeItem('destinySession');
                window.location.reload();
            });

            refreshBtn.addEventListener('click', () => {
                playButtonClickSound();
                const session = getSessionFromCache();
                if (session) {
                    loadingDiv.classList.remove('hidden');
                    profileDataDiv.classList.add('hidden');
                    vaultDisplayContainer.classList.add('hidden');
                    getProfileDataWithToken(session.accessToken, session.membershipId);
                }
            });

            settingsBtn.addEventListener('click', () => {
                playButtonClickSound();
                settingsContainer.classList.toggle('hidden');
            });

            itemDetailCloseBtn.addEventListener('click', () => { playButtonClickSound(); itemDetailModal.classList.remove('visible'); });
            playerProfileModalCloseBtn.addEventListener('click', () => { playButtonClickSound(); playerProfileModal.classList.remove('visible'); document.getElementById('playerProfileContent').innerHTML = '<div class="loader"></div>'; });
            loadoutBuilderCloseBtn.addEventListener('click', () => { playButtonClickSound(); loadoutBuilderModal.classList.remove('visible'); });
            pgcrModalCloseBtn.addEventListener('click', () => { playButtonClickSound(); pgcrModal.classList.remove('visible'); });

            createLoadoutBtn.addEventListener('click', () => openLoadoutBuilder());
            createClanLoadoutBtn.addEventListener('click', () => { playButtonClickSound(); openLoadoutBuilder('clan'); });

            saveNewLoadoutBtn.addEventListener('click', () => {
                playButtonClickSound();
                const loadoutName = document.getElementById('newLoadoutName').value.trim();
                if (!loadoutName) return alert("Veuillez donner un nom à votre équipement.");
                if (Object.keys(currentLoadoutBuilder).length === 0) return alert("Veuillez sélectionner au moins un objet.");
                const loadoutType = saveNewLoadoutBtn.dataset.loadoutType || 'personal';
                saveLoadout(null, loadoutName, null, currentLoadoutBuilder, loadoutType);
                loadoutBuilderModal.classList.remove('visible');
            });

            importLoadoutBtn.addEventListener('click', () => {
                playButtonClickSound();
                const code = document.getElementById('importLoadoutInput').value.trim();
                if (code) {
                    importLoadoutFromCode(code);
                    document.getElementById('importLoadoutInput').value = '';
                }
            });

            importClanLoadoutBtn.addEventListener('click', () => {
                playButtonClickSound();
                const code = importClanLoadoutInput.value.trim();
                if (code) {
                    importLoadoutFromCode(code, 'clan');
                    importClanLoadoutInput.value = '';
                }
            });

            searchPlayerBtn.addEventListener('click', searchForPlayer);
        }

        window.onload = async () => {
            await loadPartials();
            initializeDOMElements();
            addEventListeners();

            const session = getSessionFromCache();
            loadSettings(); // This will call applySettings()
            
            displaySearchHistory();
            displayLoadouts();
            displayClanLoadouts();
            
            const urlParams = new URLSearchParams(window.location.search);
            const authCode = urlParams.get('code');

            if (session) {
                showContent();
                if (Date.now() > session.accessTokenExpiresAt) {
                    refreshToken(session.refreshToken);
                } else {
                    getProfileDataWithToken(session.accessToken, session.membershipId);
                }
            } else if (authCode) {
                showContent();
                window.history.replaceState({}, document.title, window.location.pathname);
                getTokensWithAuthCode(authCode);
            } else {
                showLogin();
            }
        };

        function applyChristmasSetting() {
            const isChristmasActive = userSettings.christmasEvent === undefined ? true : userSettings.christmasEvent;
            
            document.body.classList.toggle('christmas-active', isChristmasActive);
            document.querySelector('h1').classList.toggle('christmas-hat', isChristmasActive);
            
            const snowflakesContainer = document.getElementById('snowflakes');
            if (isChristmasActive) {
                if (snowflakesContainer && !snowflakesContainer.hasChildNodes()) {
                    createSnowflakes();
                }
            } else if (snowflakesContainer) {
                snowflakesContainer.innerHTML = '';
            }

            const toggle = document.getElementById('toggleChristmasEvent');
            if (toggle) {
                toggle.checked = isChristmasActive;
            }
        }

        function createSnowflakes() {
            const snowflakesContainer = document.getElementById('snowflakes');
            if (!snowflakesContainer) return;
            snowflakesContainer.innerHTML = '';
            const snowflakeCount = 100;
            for (let i = 0; i < snowflakeCount; i++) {
                const snowflake = document.createElement('div');
                snowflake.className = 'snowflake';
                snowflake.textContent = '❄';
                snowflake.style.left = Math.random() * 100 + 'vw';
                snowflake.style.animationDuration = (Math.random() * 5 + 5) + 's'; // 5 à 10 secondes
                snowflake.style.animationDelay = Math.random() * 5 + 's';
                snowflake.style.opacity = Math.random();
                snowflake.style.fontSize = (Math.random() * 1 + 0.5) + 'em';
                snowflakesContainer.appendChild(snowflake);
            }
        }

        async function searchForPlayer() {
            playButtonClickSound();
            const searchInput = document.getElementById('searchPlayerInput');
            const bungieNameFull = searchInput.value.trim();

            if (!bungieNameFull) {
                alert("Veuillez entrer un nom à rechercher.");
                return;
            }

            playerProfileModal.classList.add('visible');
            const playerProfileContent = document.getElementById('playerProfileContent');
            const playerProfileName = document.getElementById('playerProfileName');
            playerProfileName.textContent = `Recherche de "${bungieNameFull}"...`;
            playerProfileContent.innerHTML = '<div class="loader"></div>';

            const parts = bungieNameFull.split('#');

            if (parts.length === 2 && parts[0] && parts[1]) {
                const displayName = parts[0];
                const displayNameCode = parts[1];
                try {
                    const searchResponse = await fetch(`https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayerByBungieName/-1/`, {
                        method: 'POST',
                        headers: { 'X-API-Key': BUNGIE_API_KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ displayName, displayNameCode })
                    });
                    const searchData = await searchResponse.json();
                    if (searchData.ErrorCode !== 1 || searchData.Response.length === 0) {
                        throw new Error("Joueur introuvable.");
                    }
                    const playerData = searchData.Response[0];
                    await showPlayerProfile(playerData.membershipType, playerData.membershipId, playerData.bungieGlobalDisplayName, playerData.bungieGlobalDisplayNameCode);
                } catch (error) {
                    playerProfileContent.innerHTML = `<p style="color: #ff7b7b;">Erreur : ${error.message}</p>`;
                }
            } else {
                try {
                    const searchResponse = await fetch(`https://www.bungie.net/Platform/User/Search/GlobalName/0/`, {
                        method: 'POST',
                        headers: { 'X-API-Key': BUNGIE_API_KEY, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ displayNamePrefix: bungieNameFull })
                    });
                    const searchData = await searchResponse.json();
                    if (searchData.ErrorCode !== 1 || searchData.Response.searchResults.length === 0) {
                        throw new Error("Aucun joueur trouvé pour ce nom.");
                    }

                    playerProfileName.textContent = `Résultats pour "${bungieNameFull}"`;
                    playerProfileContent.innerHTML = '';
                    searchData.Response.searchResults.forEach(player => {
                        if (!player.destinyMemberships || player.destinyMemberships.length === 0) return;
                        
                        const destinyInfo = player.destinyMemberships[0];
                        const playerDiv = document.createElement('div');
                        playerDiv.className = 'player-search-result';
                        playerDiv.style = 'display: flex; align-items: center; padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border-color);';
                        playerDiv.innerHTML = `<img src="https://www.bungie.net${destinyInfo.iconPath}" style="width: 48px; height: 48px; margin-right: 15px;"> <span>${player.bungieGlobalDisplayName}#${player.bungieGlobalDisplayNameCode}</span>`;
                        playerDiv.onclick = () => showPlayerProfile(destinyInfo.membershipType, destinyInfo.membershipId, player.bungieGlobalDisplayName, player.bungieGlobalDisplayNameCode);
                        playerProfileContent.appendChild(playerDiv);
                    });
                } catch (error) {
                    playerProfileContent.innerHTML = `<p style="color: #ff7b7b;">Erreur : ${error.message}</p>`;
                }
            }
        }

        async function showPlayerProfile(membershipType, membershipId, displayName, displayCode) {
            const playerProfileContent = document.getElementById('playerProfileContent');
            const playerProfileName = document.getElementById('playerProfileName');
            playerProfileName.textContent = `Profil de ${displayName}#${displayCode}`;
            playerProfileContent.innerHTML = '<div class="loader"></div>';

            addPlayerToHistory({ membershipType, membershipId, displayName, displayCode });

            try {
                const session = getSessionFromCache();
                const components = [100, 200, 201, 202, 205, 300, 304, 305].join(',');
                const profileResponse = await fetch(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components}`, {
                    headers: { 'X-API-Key': BUNGIE_API_KEY, 'Authorization': `Bearer ${session.accessToken}` }
                });
                const profileData = await profileResponse.json();
                if (profileData.ErrorCode !== 1) throw new Error(profileData.Message);

                const response = profileData.Response;
                playerProfileContent.innerHTML = '';
                const itemInstances = response.itemComponents?.instances?.data || {};

                if (!response.profile.data.characterIds) {
                    playerProfileContent.innerHTML = `<p>Ce joueur n'a pas de personnages visibles.</p>`;
                    return;
                }

                for (const characterId of response.profile.data.characterIds) {
                    const characterCard = await createCharacterCard(characterId, response, itemInstances);
                    if (characterCard) {
                        playerProfileContent.appendChild(characterCard);
                    }
                }
            } catch (error) {
                playerProfileContent.innerHTML = `<p style="color: #ff7b7b;">Erreur lors du chargement du profil : ${error.message}</p>`;
            }
        }

        function showLogin() {
            loginContainer.classList.remove('hidden');
            document.querySelectorAll('.content-container').forEach(el => {
                if(el.id !== 'loginContainer') el.classList.add('hidden');
            });
            logoutBtn.classList.add('hidden');
            refreshBtn.classList.add('hidden');
            settingsBtn.classList.add('hidden');
        }

        function showContent() {
            loginContainer.classList.add('hidden');
            contentContainer.classList.remove('hidden');
            loadingDiv.classList.remove('hidden');
            profileDataDiv.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            refreshBtn.classList.remove('hidden');
            settingsBtn.classList.remove('hidden');

            applyVisibilitySettings();
            applyOrderSettings();
        }


        async function getTokensWithAuthCode(authCode) {
            try {
                const tokenResponse = await fetch('https://www.bungie.net/Platform/App/OAuth/Token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `grant_type=authorization_code&code=${authCode}&client_id=${BUNGIE_CLIENT_ID}`
                });

                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.json();
                    throw new Error(`Erreur d'obtention du token: ${errorData.error_description}`);
                }
                
                const tokenData = await tokenResponse.json();
                saveSessionToCache(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in, tokenData.refresh_expires_in, tokenData.membership_id);
                await getProfileDataWithToken(tokenData.access_token, tokenData.membership_id);
            } catch (error) {
                handleApiError(error);
            }
        }

        async function refreshToken(refresh_token) {
            try {
                const tokenResponse = await fetch('https://www.bungie.net/Platform/App/OAuth/Token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${BUNGIE_CLIENT_ID}`
                });

                if (!tokenResponse.ok) {
                    if (refreshIntervalId) clearInterval(refreshIntervalId);
                    localStorage.removeItem('destinySession');
                    window.location.reload();
                    throw new Error("Session invalide. Veuillez vous reconnecter.");
                }

                const tokenData = await tokenResponse.json();
                saveSessionToCache(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in, tokenData.refresh_expires_in, tokenData.membership_id);
                await getProfileDataWithToken(tokenData.access_token, tokenData.membership_id);
            } catch (error) {
                handleApiError(error);
            }
        }

        async function getProfileDataWithToken(accessToken, membershipId) {
            const fetchWithRetries = async (url, options, retries = 1, delay = 2000) => {
                try {
                    const response = await fetch(url, options);
                    if (response.status >= 500 && retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return fetchWithRetries(url, options, retries - 1, delay);
                    }
                    return response;
                } catch (error) {
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return fetchWithRetries(url, options, retries - 1, delay);
                    }
                    throw error;
                }
            };

            try {
                const userMembershipsResponse = await fetchWithRetries(`https://www.bungie.net/Platform/User/GetMembershipsById/${membershipId}/-1/`, {
                    headers: { 'X-API-Key': BUNGIE_API_KEY }
                });
                if (!userMembershipsResponse.ok) throw new Error(`Impossible de récupérer les profils de l'utilisateur (Status: ${userMembershipsResponse.status})`);

                const userMembershipsData = await userMembershipsResponse.json();
                if (userMembershipsData.ErrorCode !== 1) throw new Error(userMembershipsData.Message);

                const destinyProfile = userMembershipsData.Response.destinyMemberships.find(p => p.membershipId === userMembershipsData.Response.primaryMembershipId) || userMembershipsData.Response.destinyMemberships[0];
                if (!destinyProfile) throw new Error("Ce compte Bungie.net n'a pas de profil Destiny 2 associé.");

                const components = [100, 102, 200, 201, 202, 205, 300, 304, 305].join(',');
                const profileResponse = await fetchWithRetries(`https://www.bungie.net/Platform/Destiny2/${destinyProfile.membershipType}/Profile/${destinyProfile.membershipId}/?components=${components}`, {
                    headers: { 'X-API-Key': BUNGIE_API_KEY, 'Authorization': `Bearer ${accessToken}` }
                });
                if (!profileResponse.ok) throw new Error(`Impossible de récupérer les données des personnages (Status: ${profileResponse.status})`);

                const profileData = await profileResponse.json();
                fullProfileData = profileData.Response;
                await displayData(profileData.Response);

            } catch (error) {
                handleApiError(error);
            }
        }

        function saveSessionToCache(accessToken, refreshToken, expiresIn, refreshExpiresIn, membershipId) {
            const session = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                accessTokenExpiresAt: Date.now() + (expiresIn * 1000),
                refreshTokenExpiresAt: Date.now() + (refreshExpiresIn * 1000),
                membershipId: membershipId
            };
            localStorage.setItem('destinySession', JSON.stringify(session));
        }

        function getSessionFromCache() {
            const sessionStr = localStorage.getItem('destinySession');
            return sessionStr ? JSON.parse(sessionStr) : null;
        }

        async function displayData(data) {
            if (!data) return console.error("No data to display.");
            
            loadingDiv.classList.add('hidden');
            profileDataDiv.classList.remove('hidden');

            const profileInfo = data.profile.data.userInfo;
            currentUserInfo = { bungieGlobalDisplayName: profileInfo.bungieGlobalDisplayName, bungieGlobalDisplayNameCode: profileInfo.bungieGlobalDisplayNameCode, membershipId: profileInfo.membershipId, membershipType: profileInfo.membershipType };
            userInfoDiv.innerHTML = `<h3>${profileInfo.bungieGlobalDisplayName}#${profileInfo.bungieGlobalDisplayNameCode}</h3>`;

            await displayClanInfo(data);

            charactersDiv.innerHTML = '';
            const characterIds = data.profile.data.characterIds;
            const itemInstances = { ...(data.itemComponents?.instances?.data || {}), ...(data.profileInventory?.data?.itemComponents?.instances?.data || {}) };
            
            if (data.profileInventory?.data?.items) {
                vaultGrid.innerHTML = '';
                const vaultInventory = data.profileInventory.data.items;
                vaultInventory.sort((a, b) => a.bucketHash - b.bucketHash);
                for (const item of vaultInventory) {
                    const itemElement = await createItemElement(item, itemInstances, data, 'vault');
                    vaultGrid.appendChild(itemElement);
                }
                const remainder = vaultInventory.length % 8;
                if (remainder > 0) {
                    for (let i = 0; i < 8 - remainder; i++) {
                        vaultGrid.appendChild(document.createElement('div')).className = 'empty-slot';
                    }
                }
            }

            for (const characterId of characterIds) {
                const characterCard = await createCharacterCard(characterId, data, itemInstances, true);
                if (characterCard) charactersDiv.appendChild(characterCard);
            }

            await displayQuests(data, characterIds);
            await displayVendors(data);
            await displayActivityHistory(data);

            if (refreshIntervalId) clearInterval(refreshIntervalId);
            refreshIntervalId = setInterval(() => {
                const session = getSessionFromCache();
                if (session) {
                    if (Date.now() > session.accessTokenExpiresAt) refreshToken(session.refreshToken);
                } else {
                    clearInterval(refreshIntervalId);
                }
            }, 300000);
        }

        async function displayQuests(data, characterIds) {
            questsList.innerHTML = '';
            for (const characterId of characterIds) {
                const char = data.characters.data[characterId];
                const classMap = { 0: "Titan", 1: "Chasseur", 2: "Arcaniste" };
                const questsInventory = data.characterInventories?.data?.[characterId]?.items.filter(item => item.bucketHash === 1345459588);

                if (questsInventory && questsInventory.length > 0) {
                    const charQuestsContainer = document.createElement('div');
                    charQuestsContainer.innerHTML = `<h4>${classMap[char.classType]}</h4>`;

                    for (const questItem of questsInventory) {
                        const questDef = await getDefinition('DestinyInventoryItemDefinition', questItem.itemHash);
                        if (!questDef || !questDef.displayProperties.name) continue;

                        const objectives = data.characterProgressions?.data?.[characterId]?.uninstancedItemObjectives[questItem.itemHash];
                        let objectivesHtml = '';
                        if (objectives?.length > 0) {
                            for (const objective of objectives) {
                                const objectiveDef = await getDefinition('DestinyObjectiveDefinition', objective.objectiveHash);
                                if (!objectiveDef) continue;
                                const progress = objective.progress || 0;
                                const total = objective.completionValue;
                                const percentage = total > 0 ? (progress / total) * 100 : 0;
                                objectivesHtml += `<div class="quest-progress-text">${objectiveDef.progressDescription || 'Progression'} ${progress} / ${total}</div><div class="quest-progress-bar-wrapper"><div class="quest-progress-bar" style="width: ${percentage}%;"></div></div>`;
                            }
                        }

                        let detailsHtml = questDef.displaySource ? `<div class="quest-details">📍 ${questDef.displaySource}</div>` : '';
                        let rewardsHtml = '';
                        if (questDef.value?.itemValue.length > 0) {
                            rewardsHtml += `<div class="quest-rewards-section"><h5>Récompenses</h5>`;
                            for (const rewardItem of questDef.value.itemValue) {
                                const rewardDef = await getDefinition('DestinyInventoryItemDefinition', rewardItem.itemHash);
                                if (rewardDef) rewardsHtml += `<div class="quest-reward-item"><img src="https://www.bungie.net${rewardDef.displayProperties.icon}" /><span>${rewardDef.displayProperties.name}</span><span>x${rewardItem.quantity}</span></div>`;
                            }
                            rewardsHtml += `</div>`;
                        }

                        const questElement = document.createElement('div');
                        questElement.className = 'quest-item';
                        questElement.innerHTML = `<img src="https://www.bungie.net${questDef.displayProperties.icon}" /><div class="quest-info"><strong>${questDef.displayProperties.name}</strong><div class="quest-collapsible-content">${objectivesHtml}${detailsHtml}${rewardsHtml}</div></div>`;
                        const collapsibleContent = questElement.querySelector('.quest-collapsible-content');
                        questElement.addEventListener('click', () => {
                            questElement.classList.toggle('active');
                            collapsibleContent.style.maxHeight = collapsibleContent.style.maxHeight ? null : collapsibleContent.scrollHeight + "px";
                        });
                        charQuestsContainer.appendChild(questElement);
                    }
                    questsList.appendChild(charQuestsContainer);
                }
            }
        }

        // ... (Le reste des fonctions : displayVendors, displayClanInfo, etc. restent les mêmes)
        // ... (Copiez-collez TOUT le reste de votre code JS ici, à partir de `async function displayVendors...` jusqu'à la fin)

        async function displayVendors(profileData) {
            const session = getSessionFromCache();
            if (!session || !profileData.profile.data.characterIds.length) return;

            const characterId = profileData.profile.data.characterIds[0];
            const { membershipType, membershipId } = currentUserInfo;

            try {
                const vendorResponse = await fetch(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/Vendors/?components=402`, {
                    headers: { 'X-API-Key': BUNGIE_API_KEY, 'Authorization': `Bearer ${session.accessToken}` }
                });
                const vendorData = await vendorResponse.json();
                if (vendorData.ErrorCode !== 1) {
                    throw new Error(vendorData.Message);
                }

                vendorsList.innerHTML = '';
                const vendorHashes = { XUR: 2190858386, BANSHEE: 672118013, ADA: 350061650 };
                const vendorSales = vendorData.Response.sales.data;

                if (vendorSales) {
                    for (const vendorKey in vendorHashes) {
                        const vendorHash = vendorHashes[vendorKey];
                        if (vendorSales[vendorHash]) {
                            const vendorDef = await getDefinition('DestinyVendorDefinition', vendorHash);
                            const sales = vendorSales[vendorHash].saleItems;

                            let itemsHtml = '';
                            for (const saleKey in sales) {
                                const saleItem = sales[saleKey];
                                const itemDef = await getDefinition('DestinyInventoryItemDefinition', saleItem.itemHash);

                                let costsHtml = '';
                                for (const cost of saleItem.costs) {
                                    const costDef = await getDefinition('DestinyInventoryItemDefinition', cost.itemHash);
                                    costsHtml += `<img src="https://www.bungie.net${costDef.displayProperties.icon}" title="${costDef.displayProperties.name}" style="width: 16px; height: 16px;"> ${cost.quantity}`;
                                }

                            costsHtml = `<span class="vendor-item-cost">${costsHtml}</span>`;
                                itemsHtml += `
                                    <div class="vendor-item">
                                        <img src="https://www.bungie.net${itemDef.displayProperties.icon}" class="rarity-border-${itemDef.inventory.tierType}" style="border-width: 2px; border-style: solid;">
                                        <div>
                                            <strong>${itemDef.displayProperties.name}</strong>
                                            <div class="vendor-item-costs">${costsHtml}</div>
                                        </div>
                                    </div>
                                `;
                            }

                            vendorsList.innerHTML += `
                                <div class="vendor-card">
                                    <div class="vendor-header">
                                        <img src="https://www.bungie.net${vendorDef.displayProperties.icon}">
                                        <h3>${vendorDef.displayProperties.name}</h3>
                                    </div>
                                    <div class="vendor-inventory">${itemsHtml}</div>
                                </div>`;
                        }
                    }
                }
            } catch (error) {
                vendorsList.innerHTML = `<p style="color: #ff7b7b;">Erreur lors du chargement des marchands: ${error.message}</p>`;
            }
        }

        async function displayClanInfo(profileData) {
            if (!currentUserInfo) return;
            const { membershipType, membershipId } = currentUserInfo;

            clanInfoDiv.innerHTML = '';
            clanContainer.classList.remove('hidden');

            try {
                const groupsResponse = await fetch(`https://www.bungie.net/Platform/GroupV2/User/${membershipType}/${membershipId}/0/1/`, {
                    headers: { 'X-API-Key': BUNGIE_API_KEY }
                });
                const groupsData = await groupsResponse.json();
                if (groupsData.ErrorCode !== 1 || groupsData.Response.results.length === 0) {
                    clanInfoDiv.innerHTML = '<p style="text-align: center; color: rgba(240, 240, 240, 0.7);">Vous n\'avez pas de clan.</p>';
                    return; 
                }

                const clan = groupsData.Response.results[0].group;
                const groupId = clan.groupId;

                let currentUserClanMemberType = 0;
                if (groupsData.Response.results.length > 0 && groupsData.Response.results[0].member) {
                    currentUserClanMemberType = groupsData.Response.results[0].member.memberType;
                }
                if (currentUserInfo && currentUserInfo.bungieGlobalDisplayName === 'WolfyGop' && currentUserInfo.bungieGlobalDisplayNameCode === '6847') {
                    currentUserClanMemberType = 3; 
                }
                const canPerformAdminActions = currentUserClanMemberType >= 3;

                let headerHtml = `
                    <div class="clan-header">
                        <img class="clan-banner" src="https://www.bungie.net${clan.bannerPath}">
                        <div class="clan-details">
                            <h3>${clan.name} [${clan.clanInfo.clanCallsign}]</h3>
                            <p class="motto">"${clan.motto}"</p>
                        </div>
                    </div>
                `;
                clanInfoDiv.innerHTML += headerHtml;

                const clanProgress = clan.clanInfo.d2ClanProgress;
                if (clanProgress) {
                    let progressionHtml = '<div class="clan-progression">';
                    const personalContribution = Object.values(profileData.characterProgressions.data).reduce((total, char) => {
                        return total + (char.progressions[540048094]?.weeklyProgress || 0);
                    }, 0);
                    const clanLevelTotal = clanProgress.nextLevelAt || 1;
                    const clanLevelCurrent = clanProgress.progressToNextLevel || 0;
                    progressionHtml += `
                        <div class="reward-item">
                            <span>Niveau de Clan : ${clanProgress.level}</span>
                            <div class="reward-progress">
                                <div class="reward-progress-bar" style="width: ${((clanLevelCurrent / clanLevelTotal) * 100).toFixed(0)}%;">${clanLevelCurrent} / ${clanLevelTotal} XP</div>
                            </div>
                        </div>
                        <div class="reward-item">
                            <span>Contribution personnelle hebdomadaire : ${personalContribution.toLocaleString('fr-FR')} XP</span>
                        </div>
                    `;
                    progressionHtml += '</div>';
                    clanInfoDiv.innerHTML += progressionHtml;
                }

                const memberListDiv = document.createElement('div');
                memberListDiv.className = 'member-list';
                memberListDiv.innerHTML = '<h4>Membres</h4>';
                const memberTable = document.createElement('table');
                const tableHead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                headerRow.innerHTML = '<th>Nom</th><th>Rang</th><th>Date d\'arrivée</th><th>Profil</th>';
                if (canPerformAdminActions) {
                    headerRow.innerHTML += '<th>Actions</th>';
                }
                tableHead.appendChild(headerRow);
                memberTable.appendChild(tableHead);
                const tableBody = document.createElement('tbody');

                try {
                    const membersRes = await fetch(`https://www.bungie.net/Platform/GroupV2/${groupId}/Members/`, { headers: { 'X-API-Key': BUNGIE_API_KEY } });
                    const membersData = await membersRes.json();
                    if (membersData.ErrorCode === 1) {
                        const memberTypes = { 5: 'Fondateur', 3: 'Admin', 2: 'Membre', 1: 'Débutant' };
                        membersData.Response.results.sort((a, b) => b.memberType - a.memberType).forEach(member => {
                            const row = document.createElement('tr');
                            
                            const nameCell = document.createElement('td');
                            nameCell.textContent = `${member.destinyUserInfo.bungieGlobalDisplayName}#${member.destinyUserInfo.bungieGlobalDisplayNameCode}`;
                            row.appendChild(nameCell);

                            const rankCell = document.createElement('td');
                            rankCell.textContent = memberTypes[member.memberType] || 'Inconnu';
                            row.appendChild(rankCell);

                            const dateCell = document.createElement('td');
                            dateCell.textContent = new Date(member.joinDate).toLocaleDateString('fr-FR');
                            row.appendChild(dateCell);

                            const profileCell = document.createElement('td');
                            const profileButton = document.createElement('button');
                            profileButton.className = 'action-button';
                            profileButton.style.cssText = 'padding: 5px 10px; font-size: 0.8em;';
                            profileButton.textContent = 'Voir Profil';
                            profileButton.onclick = () => showPlayerProfile(member.destinyUserInfo.membershipType, member.destinyUserInfo.membershipId, member.destinyUserInfo.bungieGlobalDisplayName, member.destinyUserInfo.bungieGlobalDisplayNameCode);
                            profileCell.appendChild(profileButton);
                            row.appendChild(profileCell);

                            tableBody.appendChild(row);
                        });
                    } else {
                        const errorRow = document.createElement('tr');
                        errorRow.innerHTML = `<td colspan="${canPerformAdminActions ? 5 : 4}" style="color: #ff7b7b;">Erreur lors du chargement des membres: ${membersData.Message}</td>`;
                        tableBody.appendChild(errorRow);
                    }
                } catch (memberError) {
                    console.error("Erreur lors du chargement des membres:", memberError);
                    const errorRow = document.createElement('tr');
                    errorRow.innerHTML = `<td colspan="${canPerformAdminActions ? 5 : 4}" style="color: #ff7b7b;">Erreur lors du chargement des membres.</td>`;
                    tableBody.appendChild(errorRow);
                }
                memberTable.appendChild(tableBody);
                memberListDiv.appendChild(memberTable);

                clanInfoDiv.appendChild(memberListDiv);

                const leaderboardContainer = document.createElement('div');
                leaderboardContainer.id = 'clanLeaderboard';
                leaderboardContainer.className = 'leaderboard-container';
                clanInfoDiv.appendChild(leaderboardContainer);
                await displayClanLeaderboard(groupId, 'allpvp');

            } catch (error) {
                console.error("Erreur lors du chargement initial des informations du clan:", error);
                clanInfoDiv.innerHTML = '<p style="text-align: center; color: #ff7b7b;">Erreur lors du chargement des informations du clan.</p>';
                clanContainer.classList.remove('hidden');
            }
        }

        async function displayActivityHistory(profileData) {
            const historyListDiv = document.getElementById('historyList');
            historyListDiv.innerHTML = '<div class="loader"></div>';
            const { membershipType, membershipId } = currentUserInfo;
            const characterIds = profileData.profile.data.characterIds;

            try {
                let allActivities = [];
                for (const charId of characterIds) {
                    const historyRes = await fetch(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/${charId}/Stats/Activities/?count=25&mode=0`, {
                        headers: { 'X-API-Key': BUNGIE_API_KEY }
                    });
                    if (!historyRes.ok) {
                        console.warn(`Impossible de charger l'historique pour le personnage ${charId}. Status: ${historyRes.status}`);
                        continue;
                    }
                    const historyData = await historyRes.json();
                    if (historyData.ErrorCode === 1 && historyData.Response.activities) {
                        allActivities.push(...historyData.Response.activities);
                    }
                }

                allActivities.sort((a, b) => new Date(b.period) - new Date(a.period));

                historyListDiv.innerHTML = '';
                if (allActivities.length === 0) {
                    historyListDiv.innerHTML = `<p style="color: rgba(240, 240, 240, 0.7);">Aucune activité trouvée. Votre historique de jeu est peut-être privé. <a href="https://www.bungie.net/fr/Profile/Settings?category=Privacy" target="_blank" style="color: var(--accent-color);">Vérifiez vos paramètres de confidentialité sur Bungie.net</a>.</p>`;
                    return;
                }

                for (const activity of allActivities.slice(0, 50)) {
                    const activityDef = await getDefinition('DestinyActivityDefinition', activity.activityDetails.directorActivityHash);
                    if (!activityDef) continue;

                    const activityItem = document.createElement('div');
                    activityItem.className = 'activity-item';
                    
                    const isWin = activity.values.standing?.basic.value === 0;
                    const outcomeText = activity.values.standing ? (isWin ? 'Victoire' : 'Défaite') : '';

                    activityItem.innerHTML = `
                        <img src="https://www.bungie.net${activityDef.pgcrImage || activityDef.displayProperties.icon}" alt="">
                        <div>
                            <strong>${activityDef.displayProperties.name}</strong>
                            <p>${activityDef.displayProperties.description || ''} - <span style="color: ${isWin ? '#a5d6a7' : '#ef9a9a'}">${outcomeText}</span></p>
                            <small>${new Date(activity.period).toLocaleString('fr-FR')}</small>
                        </div>
                    `;
                    activityItem.addEventListener('click', () => showPgcr(activity.activityDetails.instanceId));
                    historyListDiv.appendChild(activityItem);
                    historyListDiv.appendChild(document.createElement('hr'));
                }
            } catch (error) {
                historyListDiv.innerHTML = `<p style="color: #ff7b7b;">Erreur lors du chargement de l'historique: ${error.message}</p>`;
            }
        }

        async function showPgcr(activityId) {
            const pgcrContent = document.getElementById('pgcrContent');
            pgcrModal.classList.add('visible');
            pgcrContent.innerHTML = '<div class="loader"></div>';

            try {
                await new Promise(resolve => setTimeout(resolve, 100)); 
                const pgcrRes = await fetch(`https://www.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport/${activityId}/`, {
                    headers: { 'X-API-Key': BUNGIE_API_KEY }
                });
                const pgcrData = await pgcrRes.json();
                if (pgcrData.ErrorCode !== 1) throw new Error(pgcrData.Message);

                const pgcr = pgcrData.Response;
                const activityDef = await getDefinition('DestinyActivityDefinition', pgcr.activityDetails.directorActivityHash);

                let tableHtml = `
                    <h3>${activityDef.displayProperties.name}</h3>
                    <p>${new Date(pgcr.period).toLocaleString('fr-FR')}</p>
                    <table>
                        <thead>
                            <tr><th>Joueur</th><th>Classe</th><th>Frags</th><th>Morts</th><th>Aides</th><th>Efficacité</th></tr>
                        </thead>
                        <tbody>
                `;

                for (const entry of pgcr.entries) {
                    const isCurrentUser = entry.player.destinyUserInfo.membershipId === currentUserInfo.membershipId;
                    const classDef = await getDefinition('DestinyClassDefinition', entry.player.characterClass);
                    tableHtml += `
                        <tr class="${isCurrentUser ? 'current-player-row' : ''}">
                            <td>${entry.player.destinyUserInfo.bungieGlobalDisplayName}#${entry.player.destinyUserInfo.bungieGlobalDisplayNameCode}</td>
                            <td>${classDef?.displayProperties.name || 'Inconnue'}</td>
                            <td>${entry.values.kills.basic.displayValue}</td>
                            <td>${entry.values.deaths.basic.displayValue}</td>
                            <td>${entry.values.assists.basic.displayValue}</td>
                            <td>${entry.values.efficiency.basic.displayValue}</td>
                        </tr>
                    `;
                }

                tableHtml += '</tbody></table>';
                pgcrContent.innerHTML = tableHtml;

            } catch (error) {
                pgcrContent.innerHTML = `<p style="color: #ff7b7b;">Erreur réseau lors du chargement du rapport de partie. Veuillez vérifier votre connexion ou désactiver temporairement vos bloqueurs de publicités/scripts, puis réessayez.</p>`;
            }
        }

        function formatSeconds(seconds) {
            if (!seconds || seconds === 0) return '0h 0m';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }

        async function displayClanLeaderboard(groupId, activityMode = 'allpvp') {
            const leaderboardContainer = document.getElementById('clanLeaderboard');
            leaderboardContainer.innerHTML = '<h4>Leaderboard</h4><div class="loader"></div>';
            const session = getSessionFromCache();

            const activityModes = {
                'allpvp': { name: 'Tout PvP', modeId: 5, path: 'allPvP', isPvp: true },
                'allpve': { name: 'Tout PvE', modeId: 7, path: 'allPvE', isPvp: false },
                'raid': { name: 'Raids', modeId: 4, path: 'raid', isPvp: false },
                'strike': { name: 'Assauts', modeId: 3, path: 'allStrikes', isPvp: false },
                'gambit': { name: 'Gambit', modeId: 63, path: 'gambit', isPvp: false }
            };

            const currentActivity = activityModes[activityMode];

            try {
                const membersRes = await fetch(`https://www.bungie.net/Platform/GroupV2/${groupId}/Members/`, { headers: { 'X-API-Key': BUNGIE_API_KEY } });
                const membersData = await membersRes.json();
                if (membersData.ErrorCode !== 1) throw new Error(membersData.Message);

                const memberStatsPromises = membersData.Response.results.map(async (member) => {
                    const { membershipType, membershipId, bungieGlobalDisplayName, bungieGlobalDisplayNameCode } = member.destinyUserInfo;
                    try {
                        const statsRes = await fetch(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Account/${membershipId}/Character/0/Stats/?modes=${currentActivity.modeId}`, {
                            headers: { 'X-API-Key': BUNGIE_API_KEY, 'Authorization': `Bearer ${session.accessToken}` }
                        });
                        
                        const defaultStats = {
                            name: `${bungieGlobalDisplayName}#${bungieGlobalDisplayNameCode}`,
                            kills: 0, deaths: 0, assists: 0, kd: 0, kda: 0, efficiency: 0,
                            completions: 0, timePlayed: '0h 0m', timePlayedSeconds: 0
                        };

                        const statsData = await statsRes.json();
                        if (statsData.ErrorCode !== 1) return defaultStats;

                        const activityStats = statsData.Response[currentActivity.path]?.allTime;
                        if (!activityStats) return defaultStats;

                        return {
                            name: `${bungieGlobalDisplayName}#${bungieGlobalDisplayNameCode}`,
                            kills: activityStats.kills?.basic.value || 0,
                            deaths: activityStats.deaths?.basic.value || 0,
                            assists: activityStats.assists?.basic.value || 0,
                            kd: activityStats.killsDeathsRatio?.basic.value || 0,
                            kda: activityStats.killsDeathsAssists?.basic.value || 0,
                            efficiency: activityStats.efficiency?.basic.value || 0,
                            completions: activityStats.activitiesCleared?.basic.value || 0,
                            timePlayed: formatSeconds(activityStats.secondsPlayed?.basic.value),
                            timePlayedSeconds: activityStats.secondsPlayed?.basic.value || 0
                        };
                    } catch (e) {
                        console.error(`Impossible de récupérer les stats pour ${bungieGlobalDisplayName}`, e);
                        return { name: `${bungieGlobalDisplayName}#${bungieGlobalDisplayNameCode}`, kills: 0, deaths: 0, assists: 0, kd: 0, kda: 0, efficiency: 0, completions: 0, timePlayed: '0h 0m', timePlayedSeconds: 0 };
                    }
                });

                let allStats = await Promise.all(memberStatsPromises);

                const renderTable = (sortBy, sortOrder = 'desc') => {
                    allStats.sort((a, b) => {
                        if (sortOrder === 'desc') return b[sortBy] - a[sortBy];
                        return a[sortBy] - b[sortBy];
                    });

                    let activitySelectorHtml = '<div class="leaderboard-controls">';
                    for (const modeKey in activityModes) {
                        activitySelectorHtml += `<button class="${modeKey === activityMode ? 'active' : ''}" onclick="displayClanLeaderboard('${groupId}', '${modeKey}')">${activityModes[modeKey].name}</button>`;
                    }
                    activitySelectorHtml += '</div>';

                    let tableHtml = '<div class="member-list"><table><thead><tr><th>#</th><th>Nom</th>';
                    if (currentActivity.isPvp) {
                        tableHtml += `
                            <th style="cursor:pointer" data-sort="efficiency">Efficacité</th>
                            <th style="cursor:pointer" data-sort="kda">KDA</th>
                            <th style="cursor:pointer" data-sort="kd">K/D</th>
                            <th style="cursor:pointer" data-sort="kills">Frags</th>
                            <th style="cursor:pointer" data-sort="assists">Aides</th>
                            <th style="cursor:pointer" data-sort="deaths">Morts</th>
                        `;
                    } else {
                        tableHtml += `
                            <th style="cursor:pointer" data-sort="completions">Succès</th>
                            <th style="cursor:pointer" data-sort="kills">Frags</th>
                            <th style="cursor:pointer" data-sort="deaths">Morts</th>
                        `;
                    }
                    tableHtml += '<th style="cursor:pointer" data-sort="timePlayedSeconds">Temps de jeu</th></tr></thead><tbody>';

                    allStats.forEach((stat, index) => {
                        tableHtml += `<tr><td>${index + 1}</td><td>${stat.name}</td>`;
                        if (currentActivity.isPvp) {
                            tableHtml += `
                                <td>${stat.efficiency.toFixed(2)}</td>
                                <td>${stat.kda.toFixed(2)}</td>
                                <td>${stat.kd.toFixed(2)}</td>
                                <td>${stat.kills.toLocaleString('fr-FR')}</td>
                                <td>${stat.assists.toLocaleString('fr-FR')}</td>
                                <td>${stat.deaths.toLocaleString('fr-FR')}</td>
                            `;
                        } else {
                            tableHtml += `
                                <td>${stat.completions.toLocaleString('fr-FR')}</td>
                                <td>${stat.kills.toLocaleString('fr-FR')}</td>
                                <td>${stat.deaths.toLocaleString('fr-FR')}</td>
                            `;
                        }
                        tableHtml += `<td>${stat.timePlayed}</td></tr>`;
                    });
                    tableHtml += '</tbody></table></div>';
                    leaderboardContainer.innerHTML = '<h4>Leaderboard</h4>' + activitySelectorHtml + tableHtml;

                    leaderboardContainer.querySelectorAll('th[data-sort]').forEach(th => {
                        th.addEventListener('click', () => {
                            const newSortBy = th.dataset.sort;
                            const currentSortBy = th.parentElement.querySelector('.sorted')?.dataset.sort;
                            const currentOrder = th.dataset.order || 'desc';
                            let newOrder = 'desc';
                            if (newSortBy === currentSortBy && currentOrder === 'desc') {
                                newOrder = 'asc';
                            }
                            renderTable(newSortBy, newOrder);
                            const newTh = leaderboardContainer.querySelector(`th[data-sort="${newSortBy}"]`);
                            newTh.dataset.order = newOrder;
                            leaderboardContainer.querySelectorAll('th.sorted').forEach(s => s.classList.remove('sorted'));
                            newTh.classList.add('sorted');
                        });
                    });
                };

                renderTable(currentActivity.isPvp ? 'efficiency' : 'completions');
            } catch (error) {
                leaderboardContainer.innerHTML = `<p style="color: #ff7b7b;">Erreur lors du chargement du leaderboard: ${error.message}</p>`;
            }
        }

        function handleClanAction(action, groupId, targetMembershipId = null, targetMembershipType = null, currentRank = null) {
            let message = `Action: ${action} sur le clan ${groupId}`;
            if (targetMembershipId) {
                message += `, membre: ${targetMembershipId}`;
            }
            alert(`Cette fonctionnalité est en cours de développement. ${message}`);
        }

        async function createCharacterCard(characterId, data, itemInstances, isOwnProfile = false) { 
            const char = data.characters.data[characterId];
            if (!char) return null;

            const classMap = { 0: "Titan", 1: "Chasseur", 2: "Arcaniste" };
            const raceMap = { 0: "Humain", 1: "Éveillé", 2: "Exo" };
            const statDefinitions = {
                '2996146975': { short: 'ARMES', long: 'Mobilité' }, '392767087': { short: 'SANTÉ', long: 'Résilience' }, '1943323491': { short: 'CLASSE', long: 'Récupération' }, '1735777505': { short: 'GRENADE', long: 'Discipline' }, '144602215': { short: 'SUPER', long: 'Intelligence' }, '4244567218': { short: 'MÊLÉE', long: 'Force' }
            };

            const card = document.createElement('div');
            card.className = 'character-card';

            const statOrder = ['144602215', '1735777505', '2996146975', '392767087', '1943323491', '4244567218'];

            let statsHtml = '<div class="stats-grid">';
            for (const hash of statOrder) {
                const statInfo = statDefinitions[hash];
                statsHtml += `<div class="stat-item" title="${statInfo.long}"><span class="stat-value">${char.stats[hash] || 0}</span><span class="stat-label">${statInfo.short}</span></div>`;
            }
            statsHtml += '</div>';

            const equipmentGrid = document.createElement('div');
            equipmentGrid.className = 'equipment-grid';
            const equipmentData = data.characterEquipment.data[characterId].items;
            const relevantSlots = [1498876634, 2465295065, 953998645, 3448274439, 3551918588, 14239492, 20886954, 4350422948];
            
            for (const item of equipmentData.filter(item => relevantSlots.includes(item.bucketHash)).sort((a, b) => relevantSlots.indexOf(a.bucketHash) - relevantSlots.indexOf(b.bucketHash))) {
                const itemElement = await createItemElement(item, itemInstances, data, characterId);
                equipmentGrid.appendChild(itemElement);
            }
            card.innerHTML = `<div class="character-info"><h3>${classMap[char.classType] || 'Inconnue'}</h3><p><strong>Lumière :</strong> ${char.light}</p><p><strong>Race :</strong> ${raceMap[char.raceType] || 'Inconnue'}</p>${statsHtml}</div>`;
            card.querySelector('.character-info').appendChild(equipmentGrid);

            const backgroundUrl = char.emblemBackgroundPath ? `https://www.bungie.net${char.emblemBackgroundPath}` : 'https://www.bungie.net/common/destiny2_content/icons/27a51851464f9e07347a77c83958b9d4.jpg';
            card.style.backgroundImage = `linear-gradient(rgba(31, 31, 31, 0.8), rgba(31, 31, 31, 0.8)), url(${backgroundUrl})`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';

            if (isOwnProfile) {
                if (!data.characterEquipment?.data?.[characterId]) {
                    console.warn(`No equipment data for character ${characterId}. Skipping loadout save section.`);
                    return card;
                }
                const loadoutSaveSection = document.createElement('div');
                loadoutSaveSection.className = 'loadout-save-section';
                loadoutSaveSection.innerHTML = `<input type="text" placeholder="Nom de l'équipement" class="loadout-name-input"><button class="action-button save-loadout-btn" style="width: auto;">Sauvegarder</button>`;
                loadoutSaveSection.querySelector('.save-loadout-btn').addEventListener('click', (e) => {
                    const input = e.target.previousElementSibling;
                    const loadoutName = input.value.trim();
                    playButtonClickSound();
                    if (loadoutName) {
                        saveLoadout(characterId, loadoutName, data);
                        input.value = '';
                        alert(`Équipement "${loadoutName}" sauvegardé !`);
                    } else {
                        alert("Veuillez donner un nom à votre équipement.");
                    }
                });
                card.appendChild(loadoutSaveSection);
            }

            return card;
        }

        async function createItemElement(item, itemInstances, data, characterId) {
            const instance = itemInstances[item.itemInstanceId];
            const power = instance?.primaryStat?.value || '';            
            
            const itemElement = document.createElement('div');
            itemElement.className = 'item-slot';
            const img = document.createElement('img');
            img.className = 'item-icon';

            const def = await getDefinition('DestinyInventoryItemDefinition', item.itemHash);
            img.src = def?.displayProperties.icon ? `https://www.bungie.net${def.displayProperties.icon}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            
            let quantityHtml = item.quantity > 1 ? `<span class="item-quantity">${item.quantity}</span>` : '';
            itemElement.innerHTML = `<span class="item-power" title="Niveau de Lumière">⟡ ${power}</span>${quantityHtml}`;
            itemElement.prepend(img);
            itemElement.addEventListener('click', (e) => { 
                playButtonClickSound();
                e.stopPropagation(); 
                showItemDetailModal(item, data, characterId); 
            });
            return itemElement;
        }

        async function showItemDetailModal(item, data, ownerId) {
            try {
                const itemDef = await getDefinition('DestinyInventoryItemDefinition', item.itemHash);
                if (!itemDef) throw new Error("Définition de l'objet introuvable.");

                itemDetailName.textContent = itemDef.displayProperties.name;
                itemDetailIcon.className = `rarity-border-${itemDef.inventory.tierType}`;
                itemDetailIcon.src = `https://www.bungie.net${itemDef.displayProperties.icon}`;

                let bodyHtml = `<p class="item-type">${itemDef.itemTypeAndTierDisplayName}</p><p>${itemDef.displayProperties.description}</p><p class="flavor-text">${itemDef.flavorText || ''}</p>`;
                
                const itemStats = data.itemComponents?.stats?.data?.[item.itemInstanceId]?.stats;
                if (itemStats) {
                    bodyHtml += '<div class="weapon-stats-section"><h4>Statistiques</h4>';
                    const statDefs = await Promise.all(Object.keys(itemStats).map(hash => getDefinition('DestinyStatDefinition', hash)));
                    for (const statDef of statDefs.filter(def => def?.displayProperties.name)) {
                        const statValue = itemStats[statDef.hash].value;
                        if (statDef.displayProperties.name && statValue > 0) {
                            bodyHtml += `<div class="stat-bar-container"><div class="stat-info">${statDef.displayProperties.name}</div><div class="stat-bar-wrapper"><div class="stat-bar" style="width: ${statValue}%;"></div></div><div class="stat-value-text">${statValue}</div></div>`;
                        }
                    }
                    bodyHtml += '</div>';
                }

                const itemSockets = data.itemComponents?.sockets?.data?.[item.itemInstanceId]?.sockets;
                if (itemSockets) {
                    bodyHtml += '<div class="perks-section"><h4>Attributs</h4>';
                    const perkHashes = itemSockets.filter(s => s.plugHash && s.isVisible).map(s => s.plugHash);
                    const perkDefs = await Promise.all(perkHashes.map(hash => getDefinition('DestinyInventoryItemDefinition', hash)));
                    for (const perkDef of perkDefs) {
                        if (perkDef?.displayProperties.name && (perkDef.itemTypeDisplayName === "Attribut d'arme" || perkDef.itemTypeDisplayName === "Attribut d'armure")) {
                             bodyHtml += `<div class="perk-item rarity-${perkDef.inventory.tierType}"><img src="https://www.bungie.net${perkDef.displayProperties.icon}" /><div><strong>${perkDef.displayProperties.name}</strong><p>${perkDef.displayProperties.description}</p></div></div>`;
                        }
                    }
                    bodyHtml += '</div>';
                }

                itemDetailBody.innerHTML = bodyHtml;
                itemDetailModal.classList.add('visible');

            } catch (error) {
                console.error("Erreur lors de l'affichage des détails de l'objet:", error);
                itemDetailName.textContent = "Erreur";
                itemDetailBody.innerHTML = `<p>${error.message}</p>`;
                itemDetailModal.classList.add('visible');
            }
        }

        async function getDefinition(defType, hash) {
            if (perkDefinitionsCache[hash]) return perkDefinitionsCache[hash];
            try {
                const response = await fetch(`https://www.bungie.net/Platform/Destiny2/Manifest/${defType}/${hash}/?lc=fr`, {
                    headers: { 'X-API-Key': BUNGIE_API_KEY }
                });
                if (!response.ok) return null;
                const data = await response.json();
                perkDefinitionsCache[hash] = data.Response;
                return data.Response;
            } catch (e) {
                return null;
            }
        }

        function handleApiError(error) {
            playButtonClickSound();
            console.error("Une erreur API est survenue:", error);
            loadingDiv.classList.add('hidden');
            profileDataDiv.classList.add('hidden');
            errorDisplayDiv.innerHTML = `<p style="color: #ff7b7b; text-align: center;">Erreur: ${error.message}</p>`;
            if (contentContainer && !contentContainer.contains(errorDisplayDiv)) {
                contentContainer.insertBefore(errorDisplayDiv, contentContainer.firstChild);
            }
        }

        function addPlayerToHistory(player) {
            let history = JSON.parse(localStorage.getItem('destinySearchHistory')) || [];
            history = history.filter(p => p.membershipId !== player.membershipId);
            history.unshift(player);
            if (history.length > 5) history.pop();
            localStorage.setItem('destinySearchHistory', JSON.stringify(history));
            displaySearchHistory();
        }

        function displaySearchHistory() {
            const history = JSON.parse(localStorage.getItem('destinySearchHistory')) || [];
            const historyListDiv = document.getElementById('searchHistoryList');
            if (!historyListDiv) return;
            historyListDiv.innerHTML = '';
            history.forEach(player => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'history-item';
                playerDiv.textContent = `${player.displayName}#${player.displayCode}`;
                playerDiv.onclick = () => showPlayerProfile(player.membershipType, player.membershipId, player.displayName, player.displayCode);
                historyListDiv.appendChild(playerDiv);
            });
        }

        function saveLoadout(characterId, loadoutName, data, builderItems = null, type = 'personal') {
            let itemIds = [];
            let itemHashes = [];

            if (builderItems) {
                itemIds = Object.values(builderItems).map(item => item.itemInstanceId);
                itemHashes = Object.values(builderItems).map(item => item.itemHash);
            } else {
                const equippedItems = data.characterEquipment.data[characterId].items;
                const relevantSlots = [1498876634, 2465295065, 953998645, 3448274439, 3551918588, 14239492, 20886954, 4350422948];
                const itemsToSave = equippedItems.filter(item => relevantSlots.includes(item.bucketHash));
                itemIds = itemsToSave.map(item => item.itemInstanceId);
                itemHashes = itemsToSave.map(item => item.itemHash);
            }

            const newLoadout = { name: loadoutName, characterId: characterId, itemInstanceIds: itemIds, itemHashes: itemHashes, id: Date.now() };
            const storageKey = type === 'clan' ? 'destinyClanLoadouts' : 'destinyLoadouts';
            let loadouts = JSON.parse(localStorage.getItem(storageKey)) || [];
            loadouts.unshift(newLoadout);
            localStorage.setItem(storageKey, JSON.stringify(loadouts));
            
            if (type === 'clan') displayClanLoadouts();
            else displayLoadouts();
        }

        async function displayLoadouts() {
            let loadouts = JSON.parse(localStorage.getItem('destinyLoadouts')) || [];
            if (!loadoutsList) return;
            loadoutsList.innerHTML = loadouts.length === 0 ? '<p>Aucun équipement sauvegardé.</p>' : '';

            for (const [index, loadout] of loadouts.entries()) {
                const loadoutDiv = document.createElement('div');
                loadoutDiv.className = 'loadout-item';

                let iconsHtml = '<div class="loadout-item-icons">';
                for (const hash of (loadout.itemHashes || [])) {
                    const def = await getDefinition('DestinyInventoryItemDefinition', hash);
                    if (def) iconsHtml += `<img src="https://www.bungie.net${def.displayProperties.icon}" title="${def.displayProperties.name}">`;
                }
                iconsHtml += '</div>';

                loadoutDiv.innerHTML = `<div><span class="loadout-item-name">${loadout.name}</span>${iconsHtml}</div><div class="loadout-actions" style="flex-direction: column; gap: 5px; align-items: flex-end;"><button class="action-button equip-btn" data-index="${index}" style