class SpasmRenderer {
    constructor(canvas, characterData, renderData, contentBaseUrl) {
        if (!Spasm) {
            console.error("Spasm.js is not loaded!");
            return;
        }

        this.canvas = canvas;
        this.characterData = characterData;
        this.renderData = renderData;
        this.contentBaseUrl = contentBaseUrl;

        this.itemPreview = null;
        this.initialize();
    }

    initialize() {
        try {
            this.itemPreview = new Spasm.ItemPreview(this.canvas, this.contentBaseUrl, true, true);

            const gear = {
                itemHashes: this.renderData.peerView.equipment.map(item => item.itemHash),
                dyeHashes: this.renderData.customDyes.map(dye => dye.dyeHash)
            };

            this.itemPreview.setGenderType(this.characterData.genderType);
            this.itemPreview.setClassHash(this.characterData.classHash);

            this.itemPreview.loadItemReferenceIds(
                gear.itemHashes.concat(gear.dyeHashes),
                null,
                (success) => {
                    if (success) {
                        console.log(`Character ${this.characterData.characterId} rendered successfully.`);
                        this.itemPreview.setDyes(this.renderData.customDyes);
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

    destroy() {
        if (this.itemPreview) {
            this.itemPreview.stopAnimating();
            this.itemPreview = null;
        }
    }
}
