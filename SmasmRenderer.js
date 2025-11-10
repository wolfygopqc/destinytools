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
            // Initialize Spasm's ItemPreview, which is the main controller for rendering
            this.itemPreview = new Spasm.ItemPreview(this.canvas, this.contentBaseUrl);

            // Extract the necessary data for rendering from the API response
            const gear = this.renderData.peerView.equipment.map(item => item.itemHash);
            const dyes = this.renderData.customDyes;
            const customization = this.renderData.customization;

            // Set character properties
            this.itemPreview.setGenderType(this.characterData.genderType);
            this.itemPreview.setClassHash(this.characterData.classHash);

            // This is the main call to load and render the character
            // It takes the list of gear hashes, dye hashes, and customization options
            this.itemPreview.loadItemReferenceIdsWithMutedItems(
                gear,
                null, // shaderItemReferenceId (optional)
                {},   // mutedItems
                (success) => { // Callback on completion
                    if (success) {
                        console.log(`Character ${this.characterData.characterId} rendered successfully.`);
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