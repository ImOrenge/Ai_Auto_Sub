/**
 * Font Registration Test
 * 
 * This script verifies that Korean fonts are properly registered in the canvas environment.
 * Run with: npx tsx scripts/test-korean-font.ts
 */

import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';

async function testKoreanFont() {
  console.log('🧪 Testing Korean Font Registration...\n');

  // Register fonts - matches node-renderer.ts
  const fontsToRegister = [
    // English fonts
    ['Anton-Regular.ttf', 'Anton'],
    
    // Korean fonts - Gothic (고딕체)
    ['NotoSansKR-Variable.ttf', 'Noto Sans KR'],
    ['NanumGothic-Regular.ttf', 'Nanum Gothic'],
    ['IBMPlexSansKR-Regular.ttf', 'IBM Plex Sans KR'],
    ['DoHyeon-Regular.ttf', 'Do Hyeon'],
    ['Jua-Regular.ttf', 'Jua'],
    ['BlackHanSans-Regular.ttf', 'Black Han Sans'],
    
    // Korean fonts - Serif (명조체)
    ['NotoSerifKR-Variable.ttf', 'Noto Serif KR'],
    ['NanumMyeongjo-Regular.ttf', 'Nanum Myeongjo'],
    ['GowunBatang-Regular.ttf', 'Gowun Batang'],
    
    // Korean fonts - Decorative (장식체/손글씨)
    ['GamjaFlower-Regular.ttf', 'Gamja Flower'],
    ['Sunflower-Medium.ttf', 'Sunflower'],
  ];

  for (const [filename, familyName] of fontsToRegister) {
    const fontPath = path.join(process.cwd(), 'lib/render/fonts', filename);
    try {
      GlobalFonts.registerFromPath(fontPath, familyName);
      console.log(`✅ ${familyName} registered successfully`);
    } catch (err) {
      console.error(`❌ Failed to register ${familyName}:`, err);
    }
  }

  // List all registered fonts
  console.log('\n📋 Registered Fonts:');
  const families = GlobalFonts.families;
  families.forEach((family, idx) => {
    console.log(`  ${idx + 1}. ${family.family} (${family.styles.length} styles)`);
  });

  // Test rendering Korean text with various fonts
  console.log('\n🎨 Testing Korean Text Rendering...');
  const canvas = createCanvas(1200, 800);
  const ctx = canvas.getContext('2d');

  // Clear background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1200, 800);

  // Test Korean text with different fonts
  const testTexts = [
    { text: 'Noto Sans KR', font: 'Noto Sans KR', weight: 'normal' },
    { text: '나눔고딕', font: 'Nanum Gothic', weight: 'normal' },
    { text: 'IBM Plex 한국어', font: 'IBM Plex Sans KR', weight: 'normal' },
    { text: '도현체', font: 'Do Hyeon', weight: 'normal' },
    { text: '주아체', font: 'Jua', weight: 'normal' },
    { text: '검은고딕체', font: 'Black Han Sans', weight: 'normal' },
    { text: 'Noto 명조체', font: 'Noto Serif KR', weight: 'normal' },
    { text: '나눔명조', font: 'Nanum Myeongjo', weight: 'normal' },
    { text: '고운바탕', font: 'Gowun Batang', weight: 'normal' },
    { text: '감자꽃체', font: 'Gamja Flower', weight: 'normal' },
    { text: '해바라기체', font: 'Sunflower', weight: 'normal' },
  ];

  let y = 50;
  testTexts.forEach((test, idx) => {
    ctx.font = `${test.weight} 32px "${test.font}"`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${idx + 1}. ${test.text} - 한글 테스트`, 50, y);
    
    const metrics = ctx.measureText(test.text);
    console.log(`  ${idx + 1}. "${test.text}" [${test.font}] - Width: ${metrics.width.toFixed(2)}px`);
    
    y += 65;
  });

  // Save test image
  const outputPath = path.join(process.cwd(), 'test-korean-font-output.png');
  const buffer = canvas.toBuffer('image/png');
  await import('fs/promises').then(fs => fs.writeFile(outputPath, buffer));
  
  console.log(`\n✅ Test complete! Output saved to: ${outputPath}`);
  console.log('\nIf Korean characters render as boxes (□□□), the font is not properly loaded.');
  console.log('If Korean characters render correctly (안녕하세요), the font is working! 🎉');
}

testKoreanFont().catch(console.error);
