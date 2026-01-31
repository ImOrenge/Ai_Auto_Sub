
import { generateAss } from "../lib/subtitle/ass";
import { SubtitleConfig, SubtitleCue } from "../lib/jobs/types";

function testSelection() {
  const mockCues: SubtitleCue[] = [
    { id: 1, startTime: 0, endTime: 2, text: "Style Test" }
  ];

  const testConfig = (name: string, config: any) => {
    const fullConfig = {
      fontName: 'Arial',
      fontSize: 24,
      fontWeight: 'normal',
      primaryColor: '#FFFFFF',
      outlineColor: '#000000',
      backgroundColor: '#00000080',
      outlineWidth: 2,
      position: 'bottom',
      showBilingual: false,
      marginV: 20,
      ...config
    } as SubtitleConfig;

    const ass = generateAss(mockCues, fullConfig);
    const styleLine = ass.split("\n").find(l => l.startsWith("Style: Default"));
    console.log(`--- ${name} ---`);
    console.log(`StyleLine: ${styleLine}`);
  };

  testConfig("Opaque Red", { primaryColor: "#FF0000" });
  testConfig("50% Opaque Red", { primaryColor: "#FF000080" });
  testConfig("Fully Transparent Red", { primaryColor: "#FF000000" });
  testConfig("Custom Shadow", { shadowColor: "#000000", shadowOffsetX: 8 });
  testConfig("Space Font", { fontName: "Noto Sans KR" });
}

testSelection();
