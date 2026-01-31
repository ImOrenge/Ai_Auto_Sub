
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');

async function main() {
    console.log('Starting Plain JS Canvas POC Test...');

    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const cue = {
        startTime: 0,
        endTime: 3,
        text: "Hello Plain Node.js Canvas!",
    };

    const style = {
        fontName: "Arial",
        fontSize: 80,
        fontWeight: "bold",
        primaryColor: "#FF0000",
        outlineColor: "#FFFFFF",
        backgroundColor: "#00000088",
        outlineWidth: 4,
        position: "bottom",
        marginV: 150,
    };

    // 1. Fill Background
    ctx.fillStyle = "#222222";
    ctx.fillRect(0, 0, width, height);

    // 2. Render Subtitle (Simplified Logic)
    console.log('Rendering subtitle...');

    const fontSize = style.fontSize || 48;
    const fontWeight = style.fontWeight || 'bold';
    const fontName = style.fontName || 'Arial';

    ctx.font = `${fontWeight} ${fontSize}px "${fontName}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = width / 2;
    const y = height - (style.marginV || 100);

    // Draw Background
    const textWidth = ctx.measureText(cue.text).width;
    const boxWidth = textWidth + 40;
    const boxHeight = fontSize + 20;
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);

    // Draw Outline
    if (style.outlineWidth > 0) {
        ctx.strokeStyle = style.outlineColor;
        ctx.lineWidth = style.outlineWidth * 2;
        ctx.strokeText(cue.text, x, y);
    }

    // Draw Text
    ctx.fillStyle = style.primaryColor;
    ctx.fillText(cue.text, x, y);

    // 3. Save
    const buffer = await canvas.encode('png');
    fs.writeFileSync('test-poc.png', buffer);
    console.log('Success! Saved to test-poc.png');
}

main().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
