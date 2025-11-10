// SpasmRenderer.js

// This class will manage the 3D rendering of a character using Spasm.js
class SpasmRenderer {
    constructor(canvas, characterData, renderData, contentBaseUrl) {
        if (!Spasm) {
            console.error("Spasm.js is not loaded!");
            return;
        }

        this.canvas = canvas;
        this.characterData = characterData; // Basic character info (class, gender...)
        this.renderData = renderData;     // The DestinyCharacterRenderComponent data
        this.contentBaseUrl = contentBaseUrl;

        this.itemPreview = null;
        this.initialize();
    }

    initialize() {
        try { 
            // Correctly initialize Spasm.ItemPreview with all arguments
            // The last two booleans enable camera controls, which seems
            // This is crucial for the renderer to initialize properly.
            this.itemPreview = new Spasm.ItemPreview(this.canvas, this.contentBaseUrl, true, true);

            // Spasm.js requires a specific data structure combining gear, dyes, and customization.
            const gear = {
                itemHashes: this.renderData.peerView.equipment.map(item => item.itemHash),
                dyeHashes: this.renderData.customDyes.map(dye => dye.dyeHash)
            };

            // Set character properties
            this.itemPreview.setGenderType(this.characterData.genderType);
            this.itemPreview.setClassHash(this.characterData.classHash);

            // This is the main call to load and render the character.
            // We use loadItemReferenceIds, which is the simplest method provided by Spasm.
            // It takes the combined gear object and a callback.
            this.itemPreview.loadItemReferenceIds(
                gear.itemHashes.concat(gear.dyeHashes),
                null, // We can pass a specific shader here if we want to override
                (success) => { // Callback on completion
                    if (success) {
                        console.log(`Character ${this.characterData.characterId} rendered successfully.`);
                        // Apply the specific dyes and customization after loading the assets
                        this.itemPreview.setDyes(this.renderData.customDyes); // This is the correct format
                        this.itemPreview.startAnimating();
                    } else {
                        console.error(`Failed to render character ${this.characterData.characterId}.`);
                    }
                }
            );

        } catch (error) {
            console.error("Error during Spasm.js initialization:", error);
        }
    }

    // Call this to stop rendering and clean up resources
    destroy() {
        if (this.itemPreview) {
            this.itemPreview.stopAnimating();
            this.itemPreview = null;
        }
    }
}